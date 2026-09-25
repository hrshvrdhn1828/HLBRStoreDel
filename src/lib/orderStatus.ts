import type { OrderStatus } from '@/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  order_confirmed: 'Order Confirmed',
  order_failed_to_confirm: 'Order Failed to Confirm',
  packed: 'Packed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  failed_delivery: 'Failed Delivery',
};

export const ORDER_STATUS_VALUES: OrderStatus[] = [
  'placed',
  'order_confirmed',
  'order_failed_to_confirm',
  'packed',
  'dispatched',
  'delivered',
  'failed_delivery',
];

export const ORDER_STATUS_TONE: Record<OrderStatus, 'neutral' | 'positive' | 'negative'> = {
  placed: 'neutral',
  order_confirmed: 'positive',
  order_failed_to_confirm: 'negative',
  packed: 'neutral',
  dispatched: 'neutral',
  delivered: 'positive',
  failed_delivery: 'negative',
};
