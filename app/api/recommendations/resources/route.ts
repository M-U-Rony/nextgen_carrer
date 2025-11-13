import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Resource from "@/models/Resource";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with skills and preferred track
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userSkills = user.skills || [];
    const preferredTrack = user.preferredTrack || "";

    // Fetch all resources
    const allResources = await Resource.find({});

    // Calculate match scores for each resource
    const resourcesWithScores = allResources.map((resource) => {
      // Calculate skill overlap
      const resourceSkills = resource.relatedSkills || [];
      const matchedSkills = resourceSkills.filter((skill) =>
        userSkills.some(
          (userSkill) =>
            userSkill.toLowerCase() === skill.toLowerCase() ||
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );

      // Calculate match score
      const skillMatchScore =
        resourceSkills.length > 0
          ? (matchedSkills.length / resourceSkills.length) * 100
          : 0;

      // Track match bonus (if resource skills relate to user's track)
      const trackMatch = preferredTrack
        ? resourceSkills.some((skill) =>
            preferredTrack.toLowerCase().includes(skill.toLowerCase())
          ) || resource.title.toLowerCase().includes(preferredTrack.toLowerCase())
        : false;

      // Total match score
      const totalScore = trackMatch
        ? Math.min(100, skillMatchScore + 15)
        : skillMatchScore;

      // Determine match reason
      let matchReason = "";
      if (trackMatch && matchedSkills.length > 0) {
        matchReason = `Matches your track (${preferredTrack}) and skills: ${matchedSkills.join(", ")}`;
      } else if (trackMatch) {
        matchReason = `Recommended because it fits your track: ${preferredTrack}`;
      } else if (matchedSkills.length > 0) {
        matchReason = `Matches your skills: ${matchedSkills.join(", ")}`;
      } else {
        matchReason = "General recommendation";
      }

      return {
        ...resource.toObject(),
        matchScore: Math.round(totalScore),
        matchedSkills,
        matchReason,
        trackMatch,
      };
    });

    // Sort by match score (highest first) and take top 6
    const recommendedResources = resourcesWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6)
      .filter((resource) => resource.matchScore > 0); // Only show resources with some match

    return NextResponse.json(
      { resources: recommendedResources },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching recommended resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended resources" },
      { status: 500 }
    );
  }
}

