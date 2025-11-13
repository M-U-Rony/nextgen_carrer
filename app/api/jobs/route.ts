import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const track = searchParams.get("track");
    const location = searchParams.get("location");
    const jobType = searchParams.get("jobType");
    const experienceLevel = searchParams.get("experienceLevel");
    const search = searchParams.get("search");

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

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

