'use client';

import React, { useState } from 'react';
import { DatabaseSchema } from '@/types';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

interface AdminRootProps {
  initialAuthenticated: boolean;
  initialData: DatabaseSchema;
}

export default function AdminRoot({
  initialAuthenticated,
  initialData,
}: AdminRootProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);

  return (
    <>
      {isAuthenticated ? (
        <AdminDashboard
          initialData={initialData}
          onLogout={() => setIsAuthenticated(false)}
        />
      ) : (
        <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </>
  );
}
