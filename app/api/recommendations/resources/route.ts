import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Resource from "@/models/Resource";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    // Get user with skills and preferred track
    const dbUser = await User.findById(user.userId);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userSkills = dbUser.skills || [];
    const preferredTrack = dbUser.preferredTrack || "";

    // Fetch all resources
    const allResources = await Resource.find({});

    // Calculate match scores for each resource
    const resourcesWithScores = allResources.map((resource) => {
      // Calculate skill overlap
      const resourceSkills = resource.relatedSkills || [];
      const matchedSkills = resourceSkills.filter((skill: string) =>
        userSkills.some(
          (userSkill: string) =>
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
        ? resourceSkills.some((skill: string) =>
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

