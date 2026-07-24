'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminRoute from '../../components/AdminRoute';
import WorkspaceLayout from '../../components/WorkspaceLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Exclude public admin login/signup pages from AdminRoute protection & Admin Sidebar layout
  if (pathname === '/admin/login' || pathname === '/admin/signup') {
    return <>{children}</>;
  }

  return (
    <AdminRoute>
      <WorkspaceLayout isAdminArea={true}>
        {children}
      </WorkspaceLayout>
    </AdminRoute>
  );
}
