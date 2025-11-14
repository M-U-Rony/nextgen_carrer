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
    const { userType, skills, preferredTrack, education, experienceLevel, companyName, companyWebsite, companyDescription, cvSummary, cvBullets, projects, workExperience } = body;
    
    // Log received skills for debugging
    if (skills !== undefined) {
      console.log("Received skills in request:", JSON.stringify(skills, null, 2));
      console.log("Skills type:", typeof skills, "Is array:", Array.isArray(skills));
    }

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
        updateData.workExperience = [];
        updateData.cvFile = "";
      }
    } else {
      // Always update skills if provided (even if empty array)
      if (skills !== undefined) {
        // Ensure skills is an array and clean it
        updateData.skills = Array.isArray(skills) 
          ? skills.filter((skill: string) => skill && typeof skill === "string" && skill.trim().length > 0).map((skill: string) => skill.trim())
          : [];
        console.log("Updating skills:", JSON.stringify(updateData.skills, null, 2));
      }
      if (preferredTrack !== undefined) updateData.preferredTrack = preferredTrack;
      if (education !== undefined) updateData.education = education;
      if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
      if (cvSummary !== undefined) updateData.cvSummary = cvSummary;
      if (cvBullets !== undefined) updateData.cvBullets = cvBullets;
      if (projects !== undefined) updateData.projects = projects;
      // Always update workExperience if provided (even if empty array)
      if (workExperience !== undefined) {
        // Clean the workExperience data - ensure all required fields are present
        const cleanedWorkExperience = Array.isArray(workExperience)
          ? workExperience
              .filter((exp: any) => exp && exp.jobTitle && exp.company && exp.startDate)
              .map((exp: any) => ({
                jobTitle: exp.jobTitle?.trim() || "",
                company: exp.company?.trim() || "",
                startDate: exp.startDate?.trim() || "",
                endDate: exp.endDate?.trim() || undefined,
                description: Array.isArray(exp.description)
                  ? exp.description.filter((desc: string) => desc && desc.trim() !== "")
                  : [],
              }))
          : [];
        updateData.workExperience = cleanedWorkExperience;
      }
      // Clear employer fields when switching to job seeker
      if (userType && userType !== existingUser.userType) {
        updateData.companyName = "";
        updateData.companyWebsite = "";
        updateData.companyDescription = "";
      }
    }

    // Log update data for debugging (remove in production if needed)
    if (updateData.workExperience !== undefined) {
      console.log("Updating workExperience:", JSON.stringify(updateData.workExperience, null, 2));
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log saved data for debugging
    if (updatedUser.workExperience) {
      console.log("Saved workExperience:", JSON.stringify(updatedUser.workExperience, null, 2));
    }
    if (updatedUser.skills) {
      console.log("Saved skills:", JSON.stringify(updatedUser.skills, null, 2));
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

