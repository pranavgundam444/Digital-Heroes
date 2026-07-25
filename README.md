# Lead Management Platform

A full-stack lead management platform built for a small sales team.

## Architecture Overview
*   **Backend:** Node.js, Express, TypeScript, Prisma (SQLite).
*   **Frontend:** React, TypeScript, Vite, React Router.
*   **Design:** Custom design system (vanilla CSS), dark mode, glassmorphism.
*   **Auth:** JWT-based authentication with `httpOnly` cookies and Role-Based Access Control (RBAC).

## Features
*   **Public Capture Form:** Unauthenticated endpoint/page for capturing new leads.
*   **Lead Pipeline:** Track leads from `NEW` to `WON` or `LOST`.
*   **Role-Based Access (ADMIN vs. MEMBER):**
    *   Members can view all leads, but only edit status and add notes to leads *assigned to them*.
    *   Admins have full control (delete, reassign, manage users).
    *   Permissions are strictly enforced on the server via Express middleware (`requireAuth`, `requireRole`) and in the controllers. The UI mirrors these restrictions.
*   **Activity Trail:** An append-only, system-generated log of all mutations (creation, assignment, status changes, note additions).
*   **Task B Deliverables:** Located in the `/task-b` folder.

## Setup & Run Instructions

### Prerequisites
*   Node.js (v18+ recommended)
*   npm

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up the database and seed it with demo data:
    ```bash
    npm run db:push
    npm run db:seed
    ```
    *This will create an SQLite database (`dev.db`) and populate it with sample users, leads, notes, and activity history.*
4.  Start the backend development server:
    ```bash
    npm run dev
    ```
    *The server will run on `http://localhost:3001`.*

### Frontend Setup
1.  In a new terminal window, navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    *The frontend will run on `http://localhost:5173`.*

## Login Credentials
The seed script creates two accounts:
*   **ADMIN:** email: `admin@leadpro.com` | password: `Admin@1234`
*   **MEMBER:** email: `member@leadpro.com` | password: `Member@1234`

## Running Tests
The backend includes a comprehensive Jest + Supertest suite that tests all auth rules, permissions, and end-to-end flows.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Run the tests:
    ```bash
    npm test
    ```
    *This uses a separate test database (`test.db`) defined in `.env.test`.*

## API Documentation

All API endpoints expect and return JSON. Authenticated endpoints require a JWT either via an `httpOnly` cookie named `token` or an `Authorization: Bearer <token>` header.

### Auth
*   `POST /api/auth/login` (Public) - Body: `{ email, password }`. Returns: `{ token, message }`.
*   `POST /api/auth/logout` (Auth required) - Clears cookie.
*   `GET /api/auth/me` (Auth required) - Returns the currently authenticated user.

### Public Capture
*   `POST /api/capture` (Public) - Body: `{ name, email, phone?, company?, source?, message? }`. Returns: `{ message, leadId }`.

### Leads (Auth Required)
*   `GET /api/leads` - Query: `page, limit, status, assignedTo, search, sortBy, sortOrder`. Returns paginated list of leads.
*   `POST /api/leads` - Body: `{ name, email, ... }`. Creates a lead manually.
*   `GET /api/leads/:id` - Returns lead details.
*   `PATCH /api/leads/:id` - Update lead details. Members can only update `status` on assigned leads. Admins can update any field on any lead.
*   `DELETE /api/leads/:id` (Admin only) - Deletes a lead.
*   `PATCH /api/leads/:id/assign` (Admin only) - Body: `{ assignedToId }`. Assigns a lead.
*   `GET /api/leads/:id/notes` - Returns notes for a lead.
*   `POST /api/leads/:id/notes` - Body: `{ body }`. Members can only add notes to assigned leads.
*   `GET /api/leads/:id/activity` - Returns the activity trail for a lead.

### Users (Admin Only)
*   `GET /api/users` - Returns all users.
*   `POST /api/users` - Creates a new user.
*   `GET /api/users/:id` - Returns user details.
*   `PATCH /api/users/:id` - Updates user details.
