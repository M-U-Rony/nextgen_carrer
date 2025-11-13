import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
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

    // Fetch all jobs
    const allJobs = await Job.find({});

    // Calculate match scores for each job
    const jobsWithScores = allJobs.map((job) => {
      // Calculate skill overlap
      const jobSkills = job.requiredSkills || [];
      const matchedSkills = jobSkills.filter((skill: string) =>
        userSkills.some(
          (userSkill: string) =>
            userSkill.toLowerCase() === skill.toLowerCase() ||
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );

      // Calculate match score (percentage of job skills that match user skills)
      const skillMatchScore =
        jobSkills.length > 0
          ? (matchedSkills.length / jobSkills.length) * 100
          : 0;

      // Track match bonus
      const trackMatch = preferredTrack
        ? job.track?.toLowerCase() === preferredTrack.toLowerCase()
        : false;

      // Total match score (skill match + track bonus)
      const totalScore = trackMatch
        ? Math.min(100, skillMatchScore + 20)
        : skillMatchScore;

      // Determine match reason
      let matchReason = "";
      if (trackMatch && matchedSkills.length > 0) {
        matchReason = `Matches your track (${job.track}) and skills: ${matchedSkills.join(", ")}`;
      } else if (trackMatch) {
        matchReason = `Recommended because it fits your track: ${job.track}`;
      } else if (matchedSkills.length > 0) {
        matchReason = `Matches your skills: ${matchedSkills.join(", ")}`;
      } else {
        matchReason = "General recommendation";
      }

      return {
        ...job.toObject(),
        matchScore: Math.round(totalScore),
        matchedSkills,
        matchReason,
        trackMatch,
      };
    });

    // Sort by match score (highest first) and take top 6
    const recommendedJobs = jobsWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6)
      .filter((job) => job.matchScore > 0); // Only show jobs with some match

    return NextResponse.json({ jobs: recommendedJobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recommended jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended jobs" },
      { status: 500 }
    );
  }
}

