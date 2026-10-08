import {
  GetCommand,
  QueryCommand,
  UpdateCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { ddb, ORDERS_STORE_INDEX, TABLES } from '@/lib/dynamodb';
import { DEV_MODE } from '@/lib/dev-mode';
import { MAX_PASSCODE_ATTEMPTS } from '@/lib/constants';
import { mockStore } from '@/lib/db/mock-store';
import type { Order, OrderStatus, RiderOrder } from '@/types';

/** Drops the secret fields so they can never reach a rider's browser. */
export function toRiderOrder(order: Order): RiderOrder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deliveryPasscode, passcodeAttempts, ...rest } = order;
  return rest;
}

/**
 * One store's orders in the given statuses, newest first. Queries the storeId-createdAt-index GSI
 * and filters by status; paginates because a Query reads at most 1 MB *before* the filter is
 * applied — one page could otherwise hide matching orders.
 */
export async function listOrdersByStatus(
  storeId: string,
  statuses: OrderStatus[]
): Promise<RiderOrder[]> {
  if (DEV_MODE) return mockStore.listOrdersByStatus(storeId, statuses).map(toRiderOrder);

  const values = Object.fromEntries(statuses.map((s, i) => [`:s${i}`, s]));
  const params: QueryCommandInput = {
    TableName: TABLES.ORDERS,
    IndexName: ORDERS_STORE_INDEX,
    KeyConditionExpression: 'storeId = :storeId',
    FilterExpression: `#status IN (${Object.keys(values).join(', ')})`,
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':storeId': storeId, ...values },
    ScanIndexForward: false,
  };

  const items: Order[] = [];
  let lastKey: QueryCommandInput['ExclusiveStartKey'];
  do {
    const res = await ddb.send(new QueryCommand({ ...params, ExclusiveStartKey: lastKey }));
    items.push(...((res.Items as Order[]) ?? []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  return items.map(toRiderOrder);
}

/** Full order including the passcode — server-side use only, never return this from a route. */
export async function getOrder(orderId: string): Promise<Order | null> {
  if (DEV_MODE) return mockStore.getOrder(orderId);

  const res = await ddb.send(new GetCommand({ TableName: TABLES.ORDERS, Key: { orderId } }));
  return (res.Item as Order) ?? null;
}

/**
 * Atomically spends one passcode attempt. Returns false once the order is out of attempts,
 * so concurrent guesses can't overshoot the limit.
 */
export async function consumePasscodeAttempt(orderId: string): Promise<boolean> {
  if (DEV_MODE) return mockStore.consumePasscodeAttempt(orderId);

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.ORDERS,
        Key: { orderId },
        UpdateExpression: 'ADD passcodeAttempts :one',
        ConditionExpression:
          'attribute_exists(orderId) AND (attribute_not_exists(passcodeAttempts) OR passcodeAttempts < :max)',
        ExpressionAttributeValues: { ':one': 1, ':max': MAX_PASSCODE_ATTEMPTS },
      })
    );
    return true;
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return false;
    throw err;
  }
}

/** Moves a dispatched order to delivered. Returns false if it was no longer dispatched. */
export async function markDelivered(orderId: string, riderId: string): Promise<boolean> {
  if (DEV_MODE) return mockStore.markDelivered(orderId, riderId);

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.ORDERS,
        Key: { orderId },
        UpdateExpression: 'SET #status = :delivered, deliveredAt = :at, deliveredBy = :by',
        ConditionExpression: '#status = :dispatched',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':delivered': 'delivered',
          ':dispatched': 'dispatched',
          ':at': new Date().toISOString(),
          ':by': riderId,
        },
      })
    );
    return true;
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return false;
    throw err;
  }
}
