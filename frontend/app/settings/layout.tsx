'use client';

import React from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import WorkspaceLayout from '../../components/WorkspaceLayout';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <WorkspaceLayout isAdminArea={false}>
        {children}
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
