import PasscodeForm from '@/components/PasscodeForm';
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus';
import type { RiderOrder } from '@/types';

export default function OrderCard({ order }: { order: RiderOrder }) {
  const delivered = order.status === 'delivered';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-800">
            {order.customerName} · Floor {order.floor}
          </p>
          <p className="text-xs text-stone-400">{order.unitNo}</p>
          <a href={`tel:${order.mobileNumber}`} className="text-xs text-grass-600 underline">
            {order.mobileNumber}
          </a>
          <p className="mt-1 text-xs text-stone-400">
            {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              delivered ? 'bg-grass-100 text-grass-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {delivered ? ORDER_STATUS_LABELS.delivered : 'Out for delivery'}
          </span>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-stone-400">
            {delivered ? 'Collected' : 'Collect cash'}
          </p>
          <p className="font-semibold text-grass-700">₹{order.orderTotal}</p>
        </div>
      </div>

      <div className="rounded-lg bg-stone-50 p-3">
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between py-0.5 text-sm text-stone-700">
            <span>
              {item.name} × {item.qty}
            </span>
            <span>₹{item.price * item.qty}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-stone-200 pt-1 text-xs text-stone-500">
          <span>Delivery fee</span>
          <span>{order.deliveryFee === 0 ? 'Free' : `₹${order.deliveryFee}`}</span>
        </div>
      </div>

      {!delivered && !order.assignedTo && (
        <p className="text-xs text-amber-700">
          Not assigned to anyone yet — confirm with the coordinator before taking it.
        </p>
      )}

      {delivered ? (
        order.deliveredAt && (
          <p className="text-xs text-stone-500">
            Delivered {new Date(order.deliveredAt).toLocaleString('en-IN')}
          </p>
        )
      ) : (
        <PasscodeForm orderId={order.orderId} />
      )}
    </div>
  );
}
