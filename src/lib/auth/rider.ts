import { getSession } from '@/lib/auth/session';
import { getRider } from '@/lib/db/riders';
import type { Rider } from '@/types';

/**
 * The signed-in rider, or null. Verifies the JWT *and* that the account still exists,
 * so removing a rider from the table cuts off access immediately instead of at token expiry.
 * Every page and API route must go through this — src/proxy.ts only checks the cookie exists.
 */
export async function getCurrentRider(): Promise<Rider | null> {
  const session = await getSession();
  if (!session) return null;
  return getRider(session.employeeId);
}
