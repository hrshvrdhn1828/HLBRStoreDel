/**
 * In-memory stand-in for DynamoDB, used only when DEV_MODE=true (see src/lib/dev-mode.ts).
 * Lets the app run end-to-end on a laptop with no AWS account. Data resets on server restart.
 */
import bcrypt from 'bcryptjs';
import { DEV_RIDER } from '@/lib/dev-mode';
import { MAX_PASSCODE_ATTEMPTS } from '@/lib/constants';
import type { Order, OrderStatus, Rider } from '@/types';

const seedRiders = () => new Map<string, Rider>([
  [
    DEV_RIDER.employeeId,
    {
      employeeId: DEV_RIDER.employeeId,
      passwordHash: bcrypt.hashSync(DEV_RIDER.password, 10),
      name: DEV_RIDER.name,
      createdAt: new Date().toISOString(),
    },
  ],
]);

const minutesAgo = (m: number) => new Date(Date.now() - 1000 * 60 * m).toISOString();

const seedOrders = () => new Map<string, Order>(
  (
    [
      {
        orderId: 'dev-order-1',
        mobileNumber: '919876543210',
        customerName: 'Priya',
        items: [{ productId: 'p1', name: 'Masala Chai', price: 20, qty: 2 }],
        floor: '3rd Floor',
        unitNo: 'Acme Corp, Unit 402',
        itemsTotal: 40,
        deliveryFee: 0,
        orderTotal: 40,
        status: 'dispatched',
        deliveryPasscode: '4821',
        createdAt: minutesAgo(30),
      },
      {
        orderId: 'dev-order-2',
        mobileNumber: '919876543211',
        customerName: 'Rahul',
        items: [{ productId: 'p3', name: 'Veg Sandwich', price: 60, qty: 1 }],
        floor: '5th Floor',
        unitNo: '501',
        itemsTotal: 60,
        deliveryFee: 5,
        orderTotal: 65,
        status: 'dispatched',
        deliveryPasscode: '1357',
        createdAt: minutesAgo(90),
      },
      {
        orderId: 'dev-order-3',
        mobileNumber: '919876543212',
        customerName: 'Anita',
        items: [{ productId: 'p2', name: 'Cold Coffee', price: 80, qty: 1 }],
        floor: '2nd Floor',
        unitNo: 'Unit 210',
        itemsTotal: 80,
        deliveryFee: 5,
        orderTotal: 85,
        status: 'delivered',
        deliveryPasscode: '9090',
        deliveredAt: minutesAgo(20),
        deliveredBy: DEV_RIDER.employeeId,
        createdAt: minutesAgo(120),
      },
      {
        // Not dispatched yet — must never show up in the rider panel.
        orderId: 'dev-order-4',
        mobileNumber: '919876543213',
        customerName: 'Vikram',
        items: [{ productId: 'p1', name: 'Masala Chai', price: 20, qty: 1 }],
        floor: '4th Floor',
        unitNo: 'Unit 305',
        itemsTotal: 20,
        deliveryFee: 5,
        orderTotal: 25,
        status: 'packed',
        deliveryPasscode: '2468',
        createdAt: minutesAgo(10),
      },
    ] satisfies Order[]
  ).map((order) => [order.orderId, order])
);

// Next dev/Turbopack can load this module once per bundle (pages vs. route handlers), each with
// its own copy of the Maps. Parking the state on globalThis keeps them all looking at the same data.
const globalForMock = globalThis as unknown as {
  __hlbrDelMock?: { riders: Map<string, Rider>; orders: Map<string, Order> };
};
const state = (globalForMock.__hlbrDelMock ??= { riders: seedRiders(), orders: seedOrders() });
const { riders, orders } = state;

export const mockStore = {
  getRider(employeeId: string): Rider | null {
    return riders.get(employeeId) ?? null;
  },

  listOrdersByStatus(statuses: OrderStatus[]): Order[] {
    return [...orders.values()]
      .filter((o) => statuses.includes(o.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getOrder(orderId: string): Order | null {
    return orders.get(orderId) ?? null;
  },

  consumePasscodeAttempt(orderId: string): boolean {
    const order = orders.get(orderId);
    if (!order) return false;
    const used = order.passcodeAttempts ?? 0;
    if (used >= MAX_PASSCODE_ATTEMPTS) return false;
    orders.set(orderId, { ...order, passcodeAttempts: used + 1 });
    return true;
  },

  markDelivered(orderId: string, riderId: string): boolean {
    const order = orders.get(orderId);
    if (!order || order.status !== 'dispatched') return false;
    orders.set(orderId, {
      ...order,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      deliveredBy: riderId,
    });
    return true;
  },
};
