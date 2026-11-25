import type { OrderStatus } from '@/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  payment_pending: 'Awaiting Payment',
  payment_failed: 'Payment Failed',
  placed: 'Order Placed',
  order_confirmed: 'Order Confirmed',
  order_failed_to_confirm: 'Order Failed to Confirm',
  preparing_order: 'Preparing Order',
  packed: 'Packed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  failed_delivery: 'Failed Delivery',
};

// The statuses of real orders. payment_pending / payment_failed (SperdyWalkin, unpaid) never reach this app: it only
// lists dispatched and delivered orders.
export const ORDER_STATUS_VALUES: OrderStatus[] = [
  'placed',
  'order_confirmed',
  'order_failed_to_confirm',
  'preparing_order',
  'packed',
  'dispatched',
  'delivered',
  'failed_delivery',
];

export const ORDER_STATUS_TONE: Record<OrderStatus, 'neutral' | 'positive' | 'negative'> = {
  payment_pending: 'neutral',
  payment_failed: 'negative',
  placed: 'neutral',
  order_confirmed: 'positive',
  order_failed_to_confirm: 'negative',
  preparing_order: 'neutral',
  packed: 'neutral',
  dispatched: 'neutral',
  delivered: 'positive',
  failed_delivery: 'negative',
};
