'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Public admin signup is disabled per production security rules.
    // Redirect all requests to /admin/login.
    router.replace('/admin/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f3f4f6] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-neutral-400 font-medium">
          Public admin registration is disabled. Redirecting to Admin Login...
        </p>
      </div>
    </div>
  );
}
