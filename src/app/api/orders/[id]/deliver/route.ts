import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getCurrentRider } from '@/lib/auth/rider';
import { consumePasscodeAttempt, getOrder, markDelivered } from '@/lib/db/orders';
import { MAX_PASSCODE_ATTEMPTS, PASSCODE_LENGTH } from '@/lib/constants';

function passcodesMatch(submitted: string, expected: string): boolean {
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rider = await getCurrentRider();
  if (!rider) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  let passcode: unknown;
  try {
    ({ passcode } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (typeof passcode !== 'string' || !new RegExp(`^\\d{${PASSCODE_LENGTH}}$`).test(passcode)) {
    return NextResponse.json(
      { error: `Passcode must be ${PASSCODE_LENGTH} digits` },
      { status: 400 }
    );
  }

  try {
    const order = await getOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'dispatched') {
      return NextResponse.json(
        { error: 'Only dispatched orders can be marked delivered' },
        { status: 409 }
      );
    }
    // Checked before spending a passcode attempt: someone else's order must not be guessable
    // (or lockable) from this account. Unassigned orders predate assignment and stay open.
    if (order.assignedTo && order.assignedTo !== rider.employeeId) {
      return NextResponse.json(
        { error: 'This order is assigned to another delivery executive' },
        { status: 403 }
      );
    }
    if (!order.deliveryPasscode) {
      return NextResponse.json(
        { error: 'This order has no delivery passcode. Contact the coordinator.' },
        { status: 409 }
      );
    }

    // Spend the attempt *before* comparing, atomically, so parallel guesses can't beat the limit.
    if (!(await consumePasscodeAttempt(id))) {
      return NextResponse.json(
        { error: 'Too many wrong attempts. Contact the coordinator.' },
        { status: 429 }
      );
    }

    if (!passcodesMatch(passcode, order.deliveryPasscode)) {
      const attemptsLeft = Math.max(0, MAX_PASSCODE_ATTEMPTS - ((order.passcodeAttempts ?? 0) + 1));
      return NextResponse.json({ error: 'Incorrect passcode', attemptsLeft }, { status: 401 });
    }

    if (!(await markDelivered(id, rider.employeeId))) {
      return NextResponse.json({ error: 'Order is no longer out for delivery' }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delivery confirmation failed', err);
    return NextResponse.json({ error: 'Failed to confirm delivery' }, { status: 500 });
  }
}
