import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Resource from "@/models/Resource";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const cost = searchParams.get("cost");
    const level = searchParams.get("level");
    const skill = searchParams.get("skill");
    const search = searchParams.get("search");

    // Build filter object
    const filter: any = {};

    if (platform && platform !== "all") {
      filter.platform = platform;
    }

    if (cost && cost !== "all") {
      filter.cost = cost;
    }

    if (level && level !== "all") {
      filter.level = level;
    }

    if (skill && skill !== "all") {
      filter.relatedSkills = { $in: [skill] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { platform: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { relatedSkills: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ resources }, { status: 200 });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST - Create a new resource (all authenticated users)
export async function POST(request: NextRequest) {
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
    const {
      title,
      platform,
      url,
      relatedSkills,
      cost,
      description,
      duration,
      level,
      rating,
    } = body;

    // Validate required fields
    if (!title || !platform || !url || !relatedSkills || !cost) {
      return NextResponse.json(
        { error: "Missing required fields: title, platform, url, relatedSkills, and cost are required" },
        { status: 400 }
      );
    }

    // Validate relatedSkills is an array and not empty
    const skillsArray = Array.isArray(relatedSkills) ? relatedSkills : [relatedSkills];
    if (skillsArray.length === 0 || skillsArray.every((skill: string) => !skill || skill.trim() === "")) {
      return NextResponse.json(
        { error: "At least one related skill is required" },
        { status: 400 }
      );
    }

    // Validate cost
    if (!["Free", "Paid"].includes(cost)) {
      return NextResponse.json(
        { error: "Invalid cost. Must be 'Free' or 'Paid'" },
        { status: 400 }
      );
    }

    // Validate level if provided
    if (level && !["Beginner", "Intermediate", "Advanced"].includes(level)) {
      return NextResponse.json(
        { error: "Invalid level. Must be 'Beginner', 'Intermediate', or 'Advanced'" },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 0 and 5" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Create resource
    const resource = await Resource.create({
      title: title.trim(),
      platform: platform.trim(),
      url: url.trim(),
      relatedSkills: skillsArray.filter((skill: string) => skill && skill.trim() !== "").map((skill: string) => skill.trim()),
      cost,
      description: description?.trim() || undefined,
      duration: duration?.trim() || undefined,
      level: level || undefined,
      rating: rating !== undefined ? Number(rating) : undefined,
    });

    return NextResponse.json(
      { message: "Resource posted successfully", resource },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error posting resource:", error);
    return NextResponse.json(
      { error: "Failed to post resource" },
      { status: 500 }
    );
  }
}

