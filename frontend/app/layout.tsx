import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/authContext';
import { ThemeProvider } from '../context/themeContext';
import { ToastProvider } from '../context/toastContext';
import GoogleAuthProvider from '../components/GoogleAuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '21st Tech Company - Premium Text-to-Speech Platform',
  description: 'Convert text to natural, high-fidelity speech instantly. Built for modern teams and creators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased transition-colors duration-200`}>
        <ThemeProvider>
          <ToastProvider>
            <GoogleAuthProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </GoogleAuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
