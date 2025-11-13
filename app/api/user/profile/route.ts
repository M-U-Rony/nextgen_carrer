import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/auth";

// GET user profile
export async function GET() {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email }).select(
      "-password"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// UPDATE user profile
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { skills, preferredTrack, education, experienceLevel, companyName, companyWebsite, companyDescription } = body;

    // Get user to check userType
    const existingUser = await User.findOne({ email: session.user.email });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update object based on user type
    const updateData: any = {};
    if (existingUser.userType === "employer") {
      if (companyName !== undefined) updateData.companyName = companyName;
      if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;
      if (companyDescription !== undefined) updateData.companyDescription = companyDescription;
    } else {
      if (skills !== undefined) updateData.skills = skills;
      if (preferredTrack !== undefined) updateData.preferredTrack = preferredTrack;
      if (education !== undefined) updateData.education = education;
      if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Profile updated successfully", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

