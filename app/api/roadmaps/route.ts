import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Roadmap from "@/models/Roadmap";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

/**
 * GET /api/roadmaps
 * Get all saved roadmaps for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    // Fetch all roadmaps for the user
    const roadmaps = await Roadmap.find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        roadmaps,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch roadmaps",
      },
      { status: 500 }
    );
  }
}

