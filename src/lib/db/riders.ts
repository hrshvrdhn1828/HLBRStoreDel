import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '@/lib/dynamodb';
import { DEV_MODE } from '@/lib/dev-mode';
import { mockStore } from '@/lib/db/mock-store';
import type { Rider } from '@/types';

export async function getRider(employeeId: string): Promise<Rider | null> {
  if (DEV_MODE) return mockStore.getRider(employeeId);

  const res = await ddb.send(new GetCommand({ TableName: TABLES.DEL_EXECUTIVES, Key: { employeeId } }));
  return (res.Item as Rider) ?? null;
}
