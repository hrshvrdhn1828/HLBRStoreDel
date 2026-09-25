import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentRider } from '@/lib/auth/rider';
import { isVisibleToExecutive } from '@/lib/visibility';
import { listOrdersByStatus } from '@/lib/db/orders';
import OrderCard from '@/components/OrderCard';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'active', label: 'Out for delivery', status: 'dispatched', empty: 'No orders out for delivery.' },
  { key: 'delivered', label: 'Delivered', status: 'delivered', empty: 'No delivered orders yet.' },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Layouts don't re-run on every navigation, so the page checks the session itself too.
  const rider = await getCurrentRider();
  if (!rider) redirect('/login');

  const { tab: tabParam } = await searchParams;
  const tab = TABS.find((t) => t.key === tabParam) ?? TABS[0];
  const orders = (await listOrdersByStatus([tab.status])).filter((o) =>
    isVisibleToExecutive(o, rider.employeeId)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'active' ? '/' : `/?tab=${t.key}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              t.key === tab.key
                ? 'border-grass-500 bg-grass-500 font-semibold text-white'
                : 'border-stone-200 text-stone-500 hover:border-grass-300'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="py-16 text-center text-stone-400">{tab.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
