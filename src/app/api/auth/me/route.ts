import { NextResponse } from 'next/server';
import { getCurrentRider } from '@/lib/auth/rider';

export async function GET() {
  const rider = await getCurrentRider();
  if (!rider) {
    return NextResponse.json({ rider: null }, { status: 401 });
  }
  return NextResponse.json({ rider: { employeeId: rider.employeeId, name: rider.name } });
}
