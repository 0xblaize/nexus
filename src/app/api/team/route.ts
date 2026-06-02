import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { addTeamMember, removeTeamMember, getTeamMembers, updateTeamMember } from "@/lib/team-members";

export const runtime = "nodejs";

// GET /api/team - Get all team members
export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const members = await getTeamMembers();

    return NextResponse.json({
      success: true,
      members,
      count: members.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch team members",
      },
      { status: 500 },
    );
  }
}

// POST /api/team - Add a team member
export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: "email and name are required" },
        { status: 400 },
      );
    }

    const member = await addTeamMember({
      email: body.email,
      name: body.name,
      role: body.role || "member",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Team member ${body.email} added successfully`,
        member,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add team member",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/team - Remove a team member
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (!body.email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 },
      );
    }

    const member = await removeTeamMember({
      email: body.email,
    });

    return NextResponse.json({
      success: true,
      message: `Team member ${body.email} removed successfully`,
      member,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to remove team member",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/team - Update a team member
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    if (!body.email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 },
      );
    }

    const member = await updateTeamMember({
      email: body.email,
      name: body.name,
      role: body.role,
    });

    return NextResponse.json({
      success: true,
      message: "Team member updated successfully",
      member,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update team member",
      },
      { status: 500 },
    );
  }
}
