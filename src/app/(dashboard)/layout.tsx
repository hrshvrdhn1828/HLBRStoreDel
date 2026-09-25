import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { getCurrentRider } from '@/lib/auth/rider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The proxy only checks the cookie is present; this is the real gate for every page.
  if (!(await getCurrentRider())) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
