import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { calculateJobMatch } from "@/lib/job-matching";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const track = searchParams.get("track");
    const location = searchParams.get("location");
    const jobType = searchParams.get("jobType");
    const experienceLevel = searchParams.get("experienceLevel");
    const search = searchParams.get("search");
    const includeMatch = searchParams.get("includeMatch") === "true";

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

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    // If includeMatch is true and user is authenticated, calculate match scores
    if (includeMatch) {
      try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult.error && authResult.user) {
          const dbUser = await User.findById(authResult.user.userId).select("-password");
          if (dbUser && dbUser.userType === "job_seeker") {
            const jobsWithMatch = jobs.map((job) => {
              const matchResult = calculateJobMatch(dbUser, job);
              return {
                ...job.toObject(),
                matchScore: matchResult.matchScore,
                matchPercentage: matchResult.matchPercentage,
                matchedSkills: matchResult.matchedSkills,
                missingSkills: matchResult.missingSkills,
                experienceMatch: matchResult.experienceMatch,
                trackMatch: matchResult.trackMatch,
                matchReasons: matchResult.matchReasons,
              };
            });

            // Sort by match score (highest first)
            jobsWithMatch.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

            return NextResponse.json({ jobs: jobsWithMatch }, { status: 200 });
          }
        }
      } catch (authError) {
        // If auth fails, just return jobs without match scores
        console.log("Auth check failed, returning jobs without match scores");
      }
    }

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST - Create a new job (employers only)
export async function POST(request: NextRequest) {
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
        { error: "Only employers can post jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      company,
      location,
      requiredSkills,
      experienceLevel,
      jobType,
      track,
      description,
      salary,
      applicationLink,
    } = body;

    // Validate required fields
    if (!title || !company || !location || !requiredSkills || !experienceLevel || !jobType || !track || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate requiredSkills is an array and not empty
    const skillsArray = Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills];
    if (skillsArray.length === 0 || skillsArray.every((skill: string) => !skill || skill.trim() === "")) {
      return NextResponse.json(
        { error: "At least one skill is required" },
        { status: 400 }
      );
    }

    // Validate experienceLevel
    if (!["Fresher", "Junior", "Mid"].includes(experienceLevel)) {
      return NextResponse.json(
        { error: "Invalid experience level" },
        { status: 400 }
      );
    }

    // Validate jobType
    if (!["Internship", "Part-time", "Full-time", "Freelance"].includes(jobType)) {
      return NextResponse.json(
        { error: "Invalid job type" },
        { status: 400 }
      );
    }

    // Create job
    const job = await Job.create({
      title: title.trim(),
      company: (company || dbUser.companyName || dbUser.name).trim(),
      location: location.trim(),
      requiredSkills: skillsArray.filter((skill: string) => skill && skill.trim() !== "").map((skill: string) => skill.trim()),
      experienceLevel,
      jobType,
      track: track.trim(),
      description: description.trim(),
      salary: salary?.trim() || undefined,
      applicationLink: applicationLink?.trim() || undefined,
      employerId: dbUser._id.toString(),
      postedDate: new Date(),
    });

    return NextResponse.json(
      { message: "Job posted successfully", job },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error posting job:", error);
    return NextResponse.json(
      { error: "Failed to post job" },
      { status: 500 }
    );
  }
}

