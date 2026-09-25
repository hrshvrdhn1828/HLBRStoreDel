'use client';

import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-grass-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <span className="text-lg font-bold text-grass-500">HLBR Store Del.</span>
        <button
          onClick={handleLogout}
          className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-500 hover:border-grass-300 hover:text-grass-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
