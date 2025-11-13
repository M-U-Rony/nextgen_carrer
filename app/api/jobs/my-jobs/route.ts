import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import { auth } from "@/auth";

// GET - Get all jobs posted by the current employer
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is an employer
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.userType !== "employer") {
      return NextResponse.json(
        { error: "Only employers can view their jobs" },
        { status: 403 }
      );
    }

    // Get all jobs posted by this employer
    const jobs = await Job.find({ employerId: user._id.toString() }).sort({ createdAt: -1 });

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

