import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyAccessToken } from "./jwt";
import connectDB from "./mongodb";
import User from "@/models/User";
import { auth } from "@/auth";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    userType?: "job_seeker" | "employer";
  };
}

// Middleware to verify JWT token and attach user to request
export async function verifyToken(
  request: NextRequest
): Promise<{ user: any; error: null } | { user: null; error: NextResponse }> {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Authentication token required" },
        { status: 401 }
      ),
    };
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  // Optionally verify user still exists in database
  try {
    await connectDB();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "User not found" },
          { status: 401 }
        ),
      };
    }

    return {
      user: {
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType || user.userType,
        dbUser: user, // Include full user object if needed
      },
      error: null,
    };
  } catch (error) {
    console.error("Error verifying user:", error);
    return {
      user: null,
      error: NextResponse.json(
        { error: "Error verifying user" },
        { status: 500 }
      ),
    };
  }
}

// Helper to get user from request (for use in API routes)
// Checks both JWT tokens and NextAuth sessions
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ user: any; error: null } | { user: null; error: NextResponse }> {
  // First try to get NextAuth session (for Google OAuth users)
  try {
    const session = await auth();
    if (session?.user?.id) {
      await connectDB();
      const dbUser = await User.findById(session.user.id);
      
      if (dbUser) {
        return {
          user: {
            userId: dbUser._id.toString(),
            email: dbUser.email,
            userType: dbUser.userType || session.user.userType || "job_seeker",
            dbUser: dbUser,
          },
          error: null,
        };
      }
    }
  } catch (error) {
    // If NextAuth session check fails, fall through to JWT token check
    console.log("NextAuth session check failed, trying JWT token");
  }

  // Fallback to JWT token verification (for email/password users)
  return verifyToken(request);
}

