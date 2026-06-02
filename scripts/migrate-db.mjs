import { config } from "dotenv";

import { ensureDatabaseSchema } from "../src/lib/postgres.js";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not configured. Nothing to migrate.");
  process.exit(0);
}

try {
  await ensureDatabaseSchema();
  console.log("Database schema is ready.");
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
