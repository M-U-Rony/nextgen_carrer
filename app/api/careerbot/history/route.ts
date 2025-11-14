import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

/**
 * GET /api/careerbot/history
 * Get user's message history (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const userId = user.userId;

    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }

    // Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: 1 }) // Oldest first
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Message.countDocuments(query);

    // Get unique conversation IDs with metadata
    const conversations = await Message.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $max: "$createdAt" },
          messageCount: { $sum: 1 },
          saved: { $max: "$saved" },
        },
      },
      { $sort: { lastMessage: -1 } },
      { $limit: 20 }, // Get top 20 recent conversations
    ]);

    return NextResponse.json(
      {
        success: true,
        messages,
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CareerBot history error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch message history",
      },
      { status: 500 }
    );
  }
}

