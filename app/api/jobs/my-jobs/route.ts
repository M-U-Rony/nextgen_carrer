import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

// GET - Get all jobs posted by the current employer
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    // Check if user is an employer
    const dbUser = await User.findById(user.userId);
    if (!dbUser || dbUser.userType !== "employer") {
      return NextResponse.json(
        { error: "Only employers can view their jobs" },
        { status: 403 }
      );
    }

    // Get all jobs posted by this employer
    const jobs = await Job.find({ employerId: dbUser._id.toString() }).sort({ createdAt: -1 });

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

