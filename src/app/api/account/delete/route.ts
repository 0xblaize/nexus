import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { TransactionSql } from "postgres";

import { authOptions } from "@/lib/auth";
import { getSql, hasDatabaseConfig } from "@/lib/postgres";
import { hydrateUserSession } from "@/lib/user-profile";

export const runtime = "nodejs";

async function tableExists(sql: ReturnType<typeof getSql>, tableName: string) {
  const rows = await sql`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = ${tableName}
    ) as exists
  `;
  return Boolean(rows[0]?.exists);
}

async function columnExists(sql: ReturnType<typeof getSql>, tableName: string, columnName: string) {
  const rows = await sql`
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = ${tableName}
        and column_name = ${columnName}
    ) as exists
  `;
  return Boolean(rows[0]?.exists);
}

function clearAuthCookies(response: NextResponse) {
  for (const name of [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ]) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  }
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const hydrated = hydrateUserSession(session?.user?.email, session?.user?.name);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authenticated account required" }, { status: 401 });
  }

  const userId = hydrated.emailAddress;
  const deleted: string[] = [];

  if (hasDatabaseConfig()) {
    const sql = getSql();

    await sql.begin(async (tx: TransactionSql) => {
      if ((await tableExists(tx, "app_settings")) && (await columnExists(tx, "app_settings", "user_id"))) {
        await tx`delete from app_settings where user_id = ${userId}`;
        deleted.push("app_settings");
      }

      if ((await tableExists(tx, "app_watchlist")) && (await columnExists(tx, "app_watchlist", "user_id"))) {
        await tx`delete from app_watchlist where user_id = ${userId}`;
        deleted.push("app_watchlist");
      }

      if (await tableExists(tx, "users")) {
        if (await columnExists(tx, "users", "id")) {
          await tx`delete from users where id = ${userId}`;
          deleted.push("users.id");
        } else if (await columnExists(tx, "users", "email")) {
          await tx`delete from users where lower(email) = lower(${userId})`;
          deleted.push("users.email");
        }
      }
    });
  }

  const response = NextResponse.json({
    success: true,
    deleted,
    redirectTo: "/",
  });
  clearAuthCookies(response);
  return response;
}
