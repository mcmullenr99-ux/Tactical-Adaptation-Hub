import { drizzle } from "drizzle-orm/node-postgres";
import { PgDialect } from "drizzle-orm/pg-core";
import { type SQL } from "drizzle-orm";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

const pgDialect = new PgDialect();

/**
 * Execute a drizzle sql`` template via pool.query() directly.
 * Use this instead of db.execute() for raw SQL — db.execute() returns
 * non-iterable results in the production bundle.
 */
export async function rawQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  query: SQL,
): Promise<{ rows: T[] }> {
  const compiled = pgDialect.sqlToQuery(query);
  return pool.query<T>(compiled.sql, compiled.params);
}

export * from "./schema";
