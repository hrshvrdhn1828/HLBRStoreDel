'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PASSCODE_LENGTH } from '@/lib/constants';

export default function PasscodeForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const left = typeof data.attemptsLeft === 'number' ? ` (${data.attemptsLeft} left)` : '';
        throw new Error((data.error || 'Failed to confirm delivery') + left);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPasscode('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-stone-100 pt-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="font-medium text-stone-600">Customer passcode</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={PASSCODE_LENGTH}
          value={passcode}
          onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
          placeholder={'•'.repeat(PASSCODE_LENGTH)}
          className="rounded-md border border-stone-200 px-3 py-2 text-center text-lg tracking-[0.5em] focus:border-grass-400 focus:outline-none"
        />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || passcode.length !== PASSCODE_LENGTH}
        className="rounded-md bg-grass-500 px-3 py-2 text-sm font-semibold text-white hover:bg-grass-600 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
      >
        {submitting ? 'Confirming…' : 'Confirm Delivery'}
      </button>
    </form>
  );
}
