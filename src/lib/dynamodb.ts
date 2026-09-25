import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

// Shares the orders table with the HLBRStore storefront app — this app only
// reads/writes orders and its own rider accounts, never users/products.
export const TABLES = {
  ORDERS: process.env.DYNAMODB_ORDERS_TABLE || 'hlbr_store_orders',
  DEL_EXECUTIVES: process.env.DYNAMODB_DEL_EXECUTIVES_TABLE || 'hlbr_store_del_executives',
};
