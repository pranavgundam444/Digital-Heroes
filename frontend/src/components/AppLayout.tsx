import React from 'react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <div className="app-body">
        <Sidebar />
        <div className="main-content">
          <div style={{ flex: 1 }}>{children}</div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
