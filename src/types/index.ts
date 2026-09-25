export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus =
  | 'placed'
  | 'order_confirmed'
  | 'order_failed_to_confirm'
  | 'packed'
  | 'dispatched'
  | 'delivered'
  | 'failed_delivery';

// Mirrors the Order shape written by the HLBRStore storefront app (hlbr_store_orders).
// Keep in sync with that repo's src/types/index.ts.
export interface Order {
  orderId: string;
  mobileNumber: string;
  customerName: string;
  items: OrderItem[];
  floor: string;
  unitNo: string;
  itemsTotal: number;
  deliveryFee: number;
  orderTotal: number;
  status: OrderStatus;
  statusComment?: string;
  createdAt: string;

  // --- Fields this app depends on / writes ---
  /** Delivery executive this dispatched order is assigned to. Set by HLBRStoreCoord when dispatching. */
  assignedTo?: string;
  /** Secret the customer reads out to the rider. Written by the storefront; never sent to the browser here. */
  deliveryPasscode?: string;
  /** Passcode guesses used so far (owned by this app). */
  passcodeAttempts?: number;
  /** Set by this app when a rider completes the delivery. */
  deliveredAt?: string;
  deliveredBy?: string;
}

/** An order as sent to riders' browsers: the passcode and attempt counter are stripped. */
export type RiderOrder = Omit<Order, 'deliveryPasscode' | 'passcodeAttempts'>;

export interface Rider {
  employeeId: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface SessionPayload {
  employeeId: string;
  [key: string]: unknown;
}
