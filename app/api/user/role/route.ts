import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userType } = body;

    // Validate userType
    if (!userType || !["job_seeker", "employer"].includes(userType)) {
      return NextResponse.json(
        { error: "Valid user type (job_seeker or employer) is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update userType
    user.userType = userType;
    await user.save();

    return NextResponse.json(
      {
        message: "User role updated successfully",
        user: {
          id: user._id.toString(),
          email: user.email,
          userType: user.userType,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "An error occurred while updating user role" },
      { status: 500 }
    );
  }
}

