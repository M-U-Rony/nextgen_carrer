import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { calculateJobMatch } from "@/lib/job-matching";

/**
 * GET /api/jobs/match
 * Get all jobs with match scores calculated for the authenticated user
 * Returns jobs sorted by match score (highest first)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication - this endpoint requires authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    // Fetch user profile
    const dbUser = await User.findById(user.userId).select("-password");
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow job seekers to use this endpoint
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "This endpoint is only available for job seekers" },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const track = searchParams.get("track");
    const location = searchParams.get("location");
    const jobType = searchParams.get("jobType");
    const experienceLevel = searchParams.get("experienceLevel");
    const search = searchParams.get("search");
    const minMatchScore = searchParams.get("minMatchScore"); // Optional: filter by minimum match score
    const limit = searchParams.get("limit"); // Optional: limit number of results

    // Build filter object
    const filter: any = {};

    if (track && track !== "all") {
      filter.track = track;
    }

    if (location && location !== "all") {
      filter.location = location;
    }

    if (jobType && jobType !== "all") {
      filter.jobType = jobType;
    }

    if (experienceLevel && experienceLevel !== "all") {
      filter.experienceLevel = experienceLevel;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { requiredSkills: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Fetch all jobs matching the filter
    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    // Calculate match scores for all jobs
    const jobsWithMatch = jobs.map((job) => {
      const matchResult = calculateJobMatch(dbUser, job);
      return {
        ...job.toObject(),
        matchScore: matchResult.matchScore,
        matchPercentage: matchResult.matchPercentage,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        experienceMatch: matchResult.experienceMatch,
        experienceMatchScore: matchResult.experienceMatchScore,
        trackMatch: matchResult.trackMatch,
        trackMatchScore: matchResult.trackMatchScore,
        skillMatchScore: matchResult.skillMatchScore,
        matchReasons: matchResult.matchReasons,
      };
    });

    // Sort by match score (highest first)
    jobsWithMatch.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // Filter out jobs with 0% match if minMatchScore is specified
    let filteredJobs = jobsWithMatch;
    if (minMatchScore) {
      const minScore = parseInt(minMatchScore, 10);
      if (!isNaN(minScore)) {
        filteredJobs = jobsWithMatch.filter((job) => job.matchScore >= minScore);
      }
    }

    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredJobs = filteredJobs.slice(0, limitNum);
      }
    }

    return NextResponse.json(
      {
        success: true,
        jobs: filteredJobs,
        totalJobs: jobs.length,
        matchedJobs: filteredJobs.length,
        user: {
          name: dbUser.name,
          skills: dbUser.skills || [],
          experienceLevel: dbUser.experienceLevel,
          preferredTrack: dbUser.preferredTrack,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in job matching API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch matched jobs",
      },
      { status: 500 }
    );
  }
}

