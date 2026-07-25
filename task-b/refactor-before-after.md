# Task B: Refactoring Example — Layered Architecture

## The Problem: The "Fat Controller"

This is a typical example of bad legacy code found in the inherited codebase. An Express route handler that mixes HTTP parsing, weak validation, raw database calls, hardcoded secrets, and business logic all in one place.

### Before: `routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { Client } = require('pg');

// BAD: Hardcoded secrets in code!
const SECRET_KEY = "my_super_secret_jwt_key_123"; 

router.post('/api/checkout', async (req, res) => {
  // 1. Mixing HTTP context with business logic
  const { userId, productId, amount, token } = req.body;

  // 2. Weak, inline validation
  if (!userId || !productId || !amount) {
    return res.status(400).send("Missing fields");
  }

  // 3. Raw database connections inside the route
  const client = new Client({
    user: 'db_user',
    host: 'localhost',
    database: 'production_db',
    password: 'db_password_123', // BAD: Hardcoded credentials
    port: 5432,
  });

  try {
    await client.connect();

    // 4. Raw SQL susceptible to injection if not careful, mixing persistence with logic
    const userRes = await client.query(`SELECT balance FROM users WHERE id = ${userId}`);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).send("User not found");
    }

    // 5. Core business logic deeply embedded in the route
    if (user.balance < amount) {
      return res.status(400).send("Insufficient funds");
    }

    const newBalance = user.balance - amount;

    // Mutating state via raw SQL
    await client.query(`UPDATE users SET balance = ${newBalance} WHERE id = ${userId}`);
    await client.query(`INSERT INTO orders (user_id, product_id, amount) VALUES (${userId}, ${productId}, ${amount})`);

    return res.status(200).json({ success: true, newBalance });

  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  } finally {
    await client.end();
  }
});

module.exports = router;
```

---

## The Solution: Layered Architecture

We separate concerns into three layers:
1.  **Controller:** Handles HTTP requests and responses (parsing, HTTP validation, status codes).
2.  **Service:** Contains the core business logic. Knows nothing about HTTP or the underlying database technology.
3.  **Repository/Config:** Handles data persistence (using an ORM like Prisma) and environment configuration.

### After: Refactored Codebase

**1. `config/env.ts` (Configuration Layer)**
```typescript
// Secrets are now loaded from the environment, never committed to code.
export const config = {
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
};
```

**2. `repositories/userRepository.ts` (Data Access Layer)**
```typescript
import prisma from '../config/prisma';

// Abstracts the database. If we switch from Postgres to MySQL, we only change this file.
export async function getUserBalance(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? user.balance : null;
}

export async function createOrderAndUpdateBalance(userId: string, productId: string, amount: number, newBalance: number) {
  // Uses a transaction to ensure data integrity
  return prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { balance: newBalance } }),
    prisma.order.create({ data: { userId, productId, amount } })
  ]);
}
```

**3. `services/checkoutService.ts` (Business Logic Layer)**
```typescript
import { getUserBalance, createOrderAndUpdateBalance } from '../repositories/userRepository';

// Pure business logic. Extremely easy to unit test by mocking the repository.
export async function processCheckout(userId: string, productId: string, amount: number): Promise<number> {
  const balance = await getUserBalance(userId);

  if (balance === null) {
    throw new Error('USER_NOT_FOUND');
  }

  if (balance < amount) {
    throw new Error('INSUFFICIENT_FUNDS');
  }

  const newBalance = balance - amount;
  await createOrderAndUpdateBalance(userId, productId, amount, newBalance);

  return newBalance;
}
```

**4. `controllers/checkoutController.ts` (HTTP Layer)**
```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { processCheckout } from '../services/checkoutService';

// Strict validation using Zod
const CheckoutSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  amount: z.number().positive()
});

export async function handleCheckout(req: Request, res: Response) {
  try {
    // 1. Validate Input
    const parsed = CheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error });
    }

    const { userId, productId, amount } = parsed.data;

    // 2. Call Service (Business Logic)
    const newBalance = await processCheckout(userId, productId, amount);

    // 3. Return HTTP Response
    return res.status(200).json({ success: true, newBalance });

  } catch (err: any) {
    // Map business errors to HTTP status codes
    if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: "User not found" });
    if (err.message === 'INSUFFICIENT_FUNDS') return res.status(400).json({ error: "Insufficient funds" });
    
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
```

## What Improved?

1.  **Testability (Massive Improvement):** The `processCheckout` service can now be exhaustively unit-tested without spinning up an Express server or a real database. We simply pass mock values and mock the repository functions.
2.  **Security:** Hardcoded secrets are gone. SQL injection risk is eliminated by using an ORM (Prisma). Input validation is strict and robust (Zod).
3.  **Separation of Concerns:** The Controller only cares about HTTP (req/res, status codes). The Service only cares about business rules (balance checks). The Repository only cares about database syntax.
4.  **Reusability:** If we decide to build a CLI tool or a background worker that also needs to process checkouts, it can import `processCheckout` from the service layer directly. It couldn't do that with the legacy code because the logic was trapped inside an Express route.
