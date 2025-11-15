import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import Resource from "@/models/Resource";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { calculateJobMatch } from "@/lib/job-matching";

interface SkillGapAnalysis {
  userSkills: string[];
  preferredTrack?: string;
  experienceLevel?: string;
  overallSkillGaps: Array<{
    skill: string;
    frequency: number; // How many jobs require this skill
    priority: "high" | "medium" | "low"; // Based on frequency and track relevance
    relatedJobs: number; // Number of jobs that require this skill
  }>;
  trackSpecificGaps: Array<{
    skill: string;
    frequency: number;
    priority: "high" | "medium" | "low";
  }>;
  recommendedResources: Array<{
    _id?: string;
    title: string;
    platform: string;
    url: string;
    relatedSkills: string[];
    cost: "Free" | "Paid";
    description?: string;
    duration?: string;
    level?: "Beginner" | "Intermediate" | "Advanced";
    rating?: number;
  }>;
  summary: {
    totalJobsAnalyzed: number;
    totalSkillsRequired: number;
    skillsYouHave: number;
    skillsToLearn: number;
    averageMatchScore: number;
  };
}

/**
 * GET /api/skill-gap/analyze
 * Analyze skill gaps across all jobs or jobs in user's preferred track
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const trackFilter = searchParams.get("track"); // Optional: filter by specific track
    const analyzeAll = searchParams.get("all") === "true"; // Option to analyze all jobs

    await connectDB();

    // Fetch user
    const dbUser = await User.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow job seekers to analyze skill gaps
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "Skill gap analysis is only available for job seekers" },
        { status: 403 }
      );
    }

    const userSkills = (dbUser.skills || []).map((skill: string) =>
      skill.toLowerCase().trim()
    );
    const preferredTrack = dbUser.preferredTrack;
    const experienceLevel = dbUser.experienceLevel;

    // Fetch jobs - only filter by track if explicitly requested, otherwise analyze ALL jobs
    const jobQuery: any = {};
    if (!analyzeAll && trackFilter) {
      // Filter by track only if explicitly specified in query parameter
      jobQuery.track = { $regex: new RegExp(trackFilter, "i") };
    }

    const allJobs = await Job.find(jobQuery);
    
    if (allJobs.length === 0) {
      return NextResponse.json(
        { 
          error: trackFilter 
            ? `No jobs found for track: ${trackFilter}` 
            : "No jobs found in the database"
        },
        { status: 404 }
      );
    }

    // Analyze skill gaps across all jobs
    const skillFrequencyMap = new Map<string, { count: number; jobs: string[] }>();
    let totalMatchScore = 0;
    let jobsAnalyzed = 0;

    allJobs.forEach((job) => {
      const matchResult = calculateJobMatch(dbUser, job);
      totalMatchScore += matchResult.matchScore;
      jobsAnalyzed++;

      // Track missing skills frequency
      matchResult.missingSkills.forEach((skill) => {
        const skillLower = skill.toLowerCase().trim();
        if (!skillFrequencyMap.has(skillLower)) {
          skillFrequencyMap.set(skillLower, { count: 0, jobs: [] });
        }
        const entry = skillFrequencyMap.get(skillLower)!;
        entry.count++;
        if (!entry.jobs.includes(job._id?.toString() || "")) {
          entry.jobs.push(job._id?.toString() || "");
        }
      });
    });

    const averageMatchScore = jobsAnalyzed > 0 ? totalMatchScore / jobsAnalyzed : 0;

    // Convert to array and sort by frequency
    const overallSkillGaps = Array.from(skillFrequencyMap.entries())
      .map(([skill, data]) => {
        // Determine priority based on frequency
        const frequencyPercentage = (data.count / allJobs.length) * 100;
        let priority: "high" | "medium" | "low" = "low";
        if (frequencyPercentage >= 50) {
          priority = "high";
        } else if (frequencyPercentage >= 25) {
          priority = "medium";
        }

        return {
          skill: skill.charAt(0).toUpperCase() + skill.slice(1), // Capitalize first letter
          frequency: data.count,
          priority,
          relatedJobs: data.jobs.length,
        };
      })
      .sort((a, b) => b.frequency - a.frequency);

    // Filter track-specific gaps if user has a preferred track
    const trackSpecificGaps = preferredTrack
      ? overallSkillGaps.filter((gap) => {
          // This is a simplified check - in a real scenario, you'd want to verify
          // that the skill is actually from jobs in the user's track
          return true; // For now, return all gaps
        })
      : [];

    // Get all unique missing skills
    const missingSkills = overallSkillGaps.map((gap) => gap.skill.toLowerCase().trim());

    // Fetch recommended resources
    const recommendedResources: any[] = [];
    if (missingSkills.length > 0) {
      const allResources = await Resource.find({});

      allResources.forEach((resource) => {
        const resourceSkills = (resource.relatedSkills || []).map((skill: string) =>
          skill.toLowerCase().trim()
        );

        // Check if any resource skill matches any missing skill
        const hasMatchingSkill = resourceSkills.some((resourceSkill: string) =>
          missingSkills.some(
            (missingSkill: string) =>
              resourceSkill === missingSkill ||
              resourceSkill.includes(missingSkill) ||
              missingSkill.includes(resourceSkill)
          )
        );

        if (hasMatchingSkill) {
          recommendedResources.push({
            _id: resource._id?.toString(),
            title: resource.title,
            platform: resource.platform,
            url: resource.url,
            relatedSkills: resource.relatedSkills,
            cost: resource.cost,
            description: resource.description,
            duration: resource.duration,
            level: resource.level,
            rating: resource.rating,
          });
        }
      });

      // Remove duplicates and sort by relevance
      const uniqueResources = recommendedResources.filter(
        (resource, index, self) =>
          index === self.findIndex((r) => r._id === resource._id)
      );

      // Sort by number of matching skills
      uniqueResources.sort((a, b) => {
        const aMatches = a.relatedSkills.filter((skill: string) =>
          missingSkills.some(
            (missingSkill: string) =>
              skill.toLowerCase().trim() === missingSkill ||
              skill.toLowerCase().trim().includes(missingSkill) ||
              missingSkill.includes(skill.toLowerCase().trim())
          )
        ).length;

        const bMatches = b.relatedSkills.filter((skill: string) =>
          missingSkills.some(
            (missingSkill: string) =>
              skill.toLowerCase().trim() === missingSkill ||
              skill.toLowerCase().trim().includes(missingSkill) ||
              missingSkill.includes(skill.toLowerCase().trim())
          )
        ).length;

        return bMatches - aMatches;
      });

      // Return top 15 most relevant resources
      const topResources = uniqueResources.slice(0, 15);

      const analysis: SkillGapAnalysis = {
        userSkills: dbUser.skills || [],
        preferredTrack,
        experienceLevel,
        overallSkillGaps,
        trackSpecificGaps: trackSpecificGaps.slice(0, 10), // Top 10 track-specific gaps
        recommendedResources: topResources,
        summary: {
          totalJobsAnalyzed: allJobs.length,
          totalSkillsRequired: new Set(
            allJobs.flatMap((job) => job.requiredSkills || [])
          ).size,
          skillsYouHave: userSkills.length,
          skillsToLearn: overallSkillGaps.length,
          averageMatchScore: Math.round(averageMatchScore),
        },
      };

      return NextResponse.json({ success: true, data: analysis }, { status: 200 });
    } else {
      // No skill gaps found
      const analysis: SkillGapAnalysis = {
        userSkills: dbUser.skills || [],
        preferredTrack,
        experienceLevel,
        overallSkillGaps: [],
        trackSpecificGaps: [],
        recommendedResources: [],
        summary: {
          totalJobsAnalyzed: allJobs.length,
          totalSkillsRequired: new Set(
            allJobs.flatMap((job) => job.requiredSkills || [])
          ).size,
          skillsYouHave: userSkills.length,
          skillsToLearn: 0,
          averageMatchScore: Math.round(averageMatchScore),
        },
      };

      return NextResponse.json({ success: true, data: analysis }, { status: 200 });
    }
  } catch (error) {
    console.error("Skill gap analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze skill gaps",
      },
      { status: 500 }
    );
  }
}

