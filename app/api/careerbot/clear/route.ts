import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

/**
 * POST /api/careerbot/clear
 * Clear conversation history for the user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const userId = user.userId;

    await connectDB();

    const body = await request.json();
    const { conversationId } = body;

    // Build query
    const query: any = { userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }

    // Delete messages
    const result = await Message.deleteMany(query);

    return NextResponse.json(
      {
        success: true,
        deletedCount: result.deletedCount,
        message: conversationId
          ? "Conversation cleared successfully"
          : "All conversations cleared successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CareerBot clear error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to clear conversation history",
      },
      { status: 500 }
    );
  }
}

