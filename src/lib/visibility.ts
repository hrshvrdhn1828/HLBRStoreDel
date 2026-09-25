import type { RiderOrder } from '@/types';

/**
 * Whether a delivery executive should see and work on this order.
 * - Dispatched: only the executive it's assigned to. Orders dispatched before assignment existed
 *   have no assignee and stay visible to everyone so they can still be delivered.
 * - Delivered: the executive who delivered it (or was assigned it).
 * Anything else isn't shown in this app.
 */
export function isVisibleToExecutive(order: RiderOrder, employeeId: string): boolean {
  if (order.status === 'dispatched') return !order.assignedTo || order.assignedTo === employeeId;
  if (order.status === 'delivered') {
    return order.deliveredBy === employeeId || order.assignedTo === employeeId;
  }
  return false;
}
