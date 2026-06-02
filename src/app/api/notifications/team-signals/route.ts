import { NextResponse } from "next/server";
import { getActiveTeamMembers } from "@/lib/team-members";
import { sendTeamNotification } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!body.company || !body.signals || !Array.isArray(body.signals)) {
      return NextResponse.json(
        {
          error: "company and signals array are required",
        },
        { status: 400 },
      );
    }

    const teamMembers = await getActiveTeamMembers();

    if (teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No team members to notify",
        notified: 0,
      });
    }

    await sendTeamNotification({
      teamMembers,
      company: body.company,
      signals: body.signals,
      score: body.score || 0,
      recommendation: body.recommendation || "Monitor closely",
    });

    return NextResponse.json({
      success: true,
      message: `Signal notification sent to ${teamMembers.length} team members`,
      notified: teamMembers.length,
      company: body.company,
    });
  } catch (error) {
    console.error("Error sending team notification:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send notification",
      },
      { status: 500 },
    );
  }
}
