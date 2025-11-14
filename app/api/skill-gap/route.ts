import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Job from "@/models/Job";
import User from "@/models/User";
import Resource from "@/models/Resource";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

interface SkillGapResult {
  job: any;
  matchedSkills: string[];
  missingSkills: string[];
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
}

/**
 * POST /api/skill-gap
 * Analyze skill gap between user and job requirements
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const body = await request.json();
    const { jobId, userId } = body;

    // Validate input
    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Use authenticated user's ID if userId is not provided or doesn't match
    const targetUserId = userId && userId === user.userId ? userId : user.userId;

    await connectDB();

    // Fetch job
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Fetch user
    const dbUser = await User.findById(targetUserId);
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
    const jobSkills = (job.requiredSkills || []).map((skill: string) =>
      skill.toLowerCase().trim()
    );

    // Determine matched and missing skills
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    jobSkills.forEach((jobSkill: string) => {
      // Check for exact match or partial match
      const isMatched = userSkills.some((userSkill: string) => {
        return (
          userSkill === jobSkill ||
          userSkill.includes(jobSkill) ||
          jobSkill.includes(userSkill)
        );
      });

      if (isMatched) {
        // Find the original casing from job skills
        const originalSkill = job.requiredSkills.find(
          (s: string) => s.toLowerCase().trim() === jobSkill
        );
        if (originalSkill && !matchedSkills.includes(originalSkill)) {
          matchedSkills.push(originalSkill);
        }
      } else {
        // Find the original casing from job skills
        const originalSkill = job.requiredSkills.find(
          (s: string) => s.toLowerCase().trim() === jobSkill
        );
        if (originalSkill && !missingSkills.includes(originalSkill)) {
          missingSkills.push(originalSkill);
        }
      }
    });

    // Fetch recommended resources based on missing skills
    const recommendedResources: any[] = [];

    if (missingSkills.length > 0) {
      // Convert missing skills to lowercase for matching
      const missingSkillsLower = missingSkills.map((skill) =>
        skill.toLowerCase().trim()
      );

      // Find resources whose relatedSkills intersect with missingSkills
      const allResources = await Resource.find({});

      allResources.forEach((resource) => {
        const resourceSkills = (resource.relatedSkills || []).map((skill: string) =>
          skill.toLowerCase().trim()
        );

        // Check if any resource skill matches any missing skill
        const hasMatchingSkill = resourceSkills.some((resourceSkill: string) =>
          missingSkillsLower.some(
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

      // Remove duplicates and sort by relevance (more matching skills = higher priority)
      const uniqueResources = recommendedResources.filter(
        (resource, index, self) =>
          index === self.findIndex((r) => r._id === resource._id)
      );

      // Sort by number of matching skills (descending)
      uniqueResources.sort((a, b) => {
        const aMatches = a.relatedSkills.filter((skill: string) =>
          missingSkillsLower.some(
            (missingSkill: string) =>
              skill.toLowerCase().trim() === missingSkill ||
              skill.toLowerCase().trim().includes(missingSkill) ||
              missingSkill.includes(skill.toLowerCase().trim())
          )
        ).length;

        const bMatches = b.relatedSkills.filter((skill: string) =>
          missingSkillsLower.some(
            (missingSkill: string) =>
              skill.toLowerCase().trim() === missingSkill ||
              skill.toLowerCase().trim().includes(missingSkill) ||
              missingSkill.includes(skill.toLowerCase().trim())
          )
        ).length;

        return bMatches - aMatches;
      });

      // Return top 10 most relevant resources
      const topResources = uniqueResources.slice(0, 10);

      const result: SkillGapResult = {
        job: {
          _id: job._id?.toString(),
          title: job.title,
          company: job.company,
          location: job.location,
          requiredSkills: job.requiredSkills,
          experienceLevel: job.experienceLevel,
          jobType: job.jobType,
          track: job.track,
          description: job.description,
          salary: job.salary,
          applicationLink: job.applicationLink,
          postedDate: job.postedDate,
        },
        matchedSkills,
        missingSkills,
        recommendedResources: topResources,
      };

      return NextResponse.json({ success: true, data: result }, { status: 200 });
    } else {
      // No missing skills, return empty recommended resources
      const result: SkillGapResult = {
        job: {
          _id: job._id?.toString(),
          title: job.title,
          company: job.company,
          location: job.location,
          requiredSkills: job.requiredSkills,
          experienceLevel: job.experienceLevel,
          jobType: job.jobType,
          track: job.track,
          description: job.description,
          salary: job.salary,
          applicationLink: job.applicationLink,
          postedDate: job.postedDate,
        },
        matchedSkills,
        missingSkills: [],
        recommendedResources: [],
      };

      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }
  } catch (error) {
    console.error("Skill gap analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze skill gap",
      },
      { status: 500 }
    );
  }
}

