import { NextResponse } from 'next/server';
import { getCurrentRider } from '@/lib/auth/rider';
import { listOrdersByStatus } from '@/lib/db/orders';

export async function GET() {
  const rider = await getCurrentRider();
  if (!rider) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const orders = await listOrdersByStatus(['dispatched', 'delivered']);
  return NextResponse.json({ orders });
}
