import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    const dbUser = await User.findById(user.userId).select("-password");

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser }, { status: 200 });
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
    const authResult = await getAuthenticatedUser(request);
    
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    const body = await request.json();
    const { userType, skills, preferredTrack, education, experienceLevel, companyName, companyWebsite, companyDescription } = body;

    // Get user to check current userType
    const existingUser = await User.findById(user.userId);
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate userType if provided
    if (userType && !["job_seeker", "employer"].includes(userType)) {
      return NextResponse.json(
        { error: "Valid user type (job_seeker or employer) is required" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    
    // Update userType if provided
    if (userType !== undefined) {
      updateData.userType = userType;
    }

    // Determine which fields to update based on the new userType (or existing if not changing)
    const targetUserType = userType || existingUser.userType;
    
    if (targetUserType === "employer") {
      if (companyName !== undefined) updateData.companyName = companyName;
      if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;
      if (companyDescription !== undefined) updateData.companyDescription = companyDescription;
      // Clear job seeker fields when switching to employer
      if (userType && userType !== existingUser.userType) {
        updateData.skills = [];
        updateData.preferredTrack = "";
        updateData.education = "";
        updateData.experienceLevel = "";
      }
    } else {
      if (skills !== undefined) updateData.skills = skills;
      if (preferredTrack !== undefined) updateData.preferredTrack = preferredTrack;
      if (education !== undefined) updateData.education = education;
      if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
      // Clear employer fields when switching to job seeker
      if (userType && userType !== existingUser.userType) {
        updateData.companyName = "";
        updateData.companyWebsite = "";
        updateData.companyDescription = "";
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
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

