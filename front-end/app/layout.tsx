import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';
import { UserProvider } from '@/components/UserProvider';

export const metadata: Metadata = {
  title: 'Notification System',
  description: 'Scalable multi-channel notification system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <Nav />
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
