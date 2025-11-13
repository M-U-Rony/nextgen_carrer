import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifyRefreshToken, generateAccessToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    await connectDB();

    // Verify user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType,
    });

    return NextResponse.json(
      {
        accessToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "An error occurred during token refresh" },
      { status: 500 }
    );
  }
}

