'use client';

import React, { useMemo } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '837458393193-ppc9c70il4234j9g8r84kj2lg1429e05.apps.googleusercontent.com'
    );
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
