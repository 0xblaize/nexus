import { randomUUID } from "crypto";
import { hasDatabaseConfig, getSql } from "./postgres.js";

export async function addTeamMember({ email, name, role = "member" }) {
  if (!hasDatabaseConfig()) {
    throw new Error("Database not configured");
  }

  const sql = getSql();
  const id = randomUUID();

  try {
    const result = await sql`
      insert into team_members (id, email, name, role, status)
      values (${id}, ${email.toLowerCase()}, ${name}, ${role}, 'active')
      returning id, email, name, role, status, created_at
    `;

    return result[0];
  } catch (error) {
    if (error.message.includes("duplicate")) {
      throw new Error(`Team member with email ${email} already exists`);
    }
    throw error;
  }
}

export async function removeTeamMember({ email }) {
  if (!hasDatabaseConfig()) {
    throw new Error("Database not configured");
  }

  const sql = getSql();

  try {
    const result = await sql`
      update team_members
      set status = 'inactive', updated_at = now()
      where email = ${email.toLowerCase()}
      returning id, email, name, role, status
    `;

    if (result.length === 0) {
      throw new Error(`Team member with email ${email} not found`);
    }

    return result[0];
  } catch (error) {
    throw error;
  }
}

export async function getTeamMembers() {
  if (!hasDatabaseConfig()) {
    return [];
  }

  const sql = getSql();

  try {
    const result = await sql`
      select id, email, name, role, status, created_at, updated_at
      from team_members
      where status = 'active'
      order by created_at asc
    `;

    return result;
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

export async function getTeamMemberByEmail({ email }) {
  if (!hasDatabaseConfig()) {
    return null;
  }

  const sql = getSql();

  try {
    const result = await sql`
      select id, email, name, role, status, created_at, updated_at
      from team_members
      where email = ${email.toLowerCase()} and status = 'active'
    `;

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching team member:", error);
    return null;
  }
}

export async function updateTeamMember({ email, name, role }) {
  if (!hasDatabaseConfig()) {
    throw new Error("Database not configured");
  }

  const sql = getSql();

  try {
    const result = await sql`
      update team_members
      set
        ${name ? sql`name = ${name},` : sql``}
        ${role ? sql`role = ${role},` : sql``}
        updated_at = now()
      where email = ${email.toLowerCase()}
      returning id, email, name, role, status, created_at, updated_at
    `;

    if (result.length === 0) {
      throw new Error(`Team member with email ${email} not found`);
    }

    return result[0];
  } catch (error) {
    throw error;
  }
}

export async function getActiveTeamMembers() {
  if (!hasDatabaseConfig()) {
    return [];
  }

  const sql = getSql();

  try {
    const result = await sql`
      select id, email, name, role
      from team_members
      where status = 'active'
      order by created_at asc
    `;

    return result;
  } catch (error) {
    console.error("Error fetching active team members:", error);
    return [];
  }
}
