export const DEV_MODE = process.env.DEV_MODE === 'true';

// Next.js only inlines NEXT_PUBLIC_* vars into client bundles, so client components
// need this separate copy of the same flag.
// Keep DEV_MODE and NEXT_PUBLIC_DEV_MODE set to the same value in .env.local.
export const DEV_MODE_PUBLIC = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// Fixed dev-mode rider, seeded into the in-memory mock store.
export const DEV_RIDER = {
  employeeId: 'HLBR-STORE-DEL-1',
  password: 'pass@1234',
  name: 'Dev Rider',
};
