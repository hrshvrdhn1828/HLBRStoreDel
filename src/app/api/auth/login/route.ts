import { NextRequest, NextResponse } from 'next/server';
import { getRider } from '@/lib/db/riders';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';

// Valid bcrypt hash of a throwaway value, compared against when the rider doesn't exist
// so the response time doesn't reveal which employee IDs are real.
const DUMMY_HASH = '$2a$10$g4kzcQeaema/ZHSDvmc.TelTaX52V7qFF7XCSegw/K4aPjtgCZVX2';

export async function POST(request: NextRequest) {
  let employeeId: unknown;
  let password: unknown;
  try {
    ({ employeeId, password } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!employeeId || typeof employeeId !== 'string' || !employeeId.trim()) {
    return NextResponse.json({ error: 'Delivery Executive ID is required' }, { status: 400 });
  }
  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 });
  }

  try {
    const rider = await getRider(employeeId.trim());
    const ok = await verifyPassword(password, rider?.passwordHash ?? DUMMY_HASH);

    // Generic error either way — don't reveal whether the rider ID exists.
    if (!rider || !ok) {
      return NextResponse.json({ error: 'Incorrect Delivery Executive ID or password' }, { status: 401 });
    }

    const token = await createSessionToken({ employeeId: rider.employeeId });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      rider: { employeeId: rider.employeeId, name: rider.name },
    });
  } catch (err) {
    console.error('Login failed', err);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
