import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Resource from "@/models/Resource";

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

