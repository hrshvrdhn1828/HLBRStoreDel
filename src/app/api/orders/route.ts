import { NextResponse } from 'next/server';
import { getCurrentRider } from '@/lib/auth/rider';
import { listOrdersByStatus } from '@/lib/db/orders';
import { isVisibleToExecutive } from '@/lib/visibility';

export async function GET() {
  const rider = await getCurrentRider();
  if (!rider) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const orders = (await listOrdersByStatus(['dispatched', 'delivered'])).filter((o) =>
    isVisibleToExecutive(o, rider.employeeId)
  );
  return NextResponse.json({ orders });
}
