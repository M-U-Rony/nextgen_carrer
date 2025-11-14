import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Job from "@/models/Job";
import Resource from "@/models/Resource";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

/**
 * GET /api/dashboard
 * Get aggregated dashboard data for the user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    const userId = user.userId;

    await connectDB();

    // Fetch user profile
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only for job seekers
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "Dashboard data is only available for job seekers" },
        { status: 403 }
      );
    }

    const userSkills = dbUser.skills || [];
    const preferredTrack = dbUser.preferredTrack || "";

    // Calculate stats
    const skillsCount = userSkills.length;
    
    // For now, savedCourses and savedJobs are placeholders (could be implemented later)
    const savedCourses = 0; // TODO: Implement saved courses/bookmarks
    const savedJobs = 0; // TODO: Implement saved jobs/bookmarks
    
    // Calculate missing skills count from best job match
    let missingSkillsCount = 0;
    
    // Get best matched jobs
    const allJobs = await Job.find({});
    const jobsWithScores = allJobs.map((job) => {
      const jobSkills = job.requiredSkills || [];
      const matchedSkills = jobSkills.filter((skill: string) =>
        userSkills.some(
          (userSkill: string) =>
            userSkill.toLowerCase() === skill.toLowerCase() ||
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      
      const skillMatchScore =
        jobSkills.length > 0
          ? (matchedSkills.length / jobSkills.length) * 100
          : 0;
      
      const trackMatch = preferredTrack
        ? job.track?.toLowerCase() === preferredTrack.toLowerCase()
        : false;
      
      const totalScore = trackMatch
        ? Math.min(100, skillMatchScore + 20)
        : skillMatchScore;
      
      const missingSkills = jobSkills.filter(
        (skill: string) =>
          !matchedSkills.some(
            (ms: string) =>
              ms.toLowerCase() === skill.toLowerCase() ||
              ms.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(ms.toLowerCase())
          )
      );
      
      return {
        ...job.toObject(),
        matchScore: Math.round(totalScore),
        matchedSkills,
        missingSkills,
      };
    });
    
    // Get top 3 best jobs
    const bestJobs = jobsWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .filter((job) => job.matchScore > 0);
    
    // Set missing skills count from best job (if any)
    if (bestJobs.length > 0 && bestJobs[0].missingSkills) {
      missingSkillsCount = bestJobs[0].missingSkills.length;
    }
    
    // Get roadmap preview (first 2 weeks)
    let roadmapPreview = "";
    if (dbUser.roadmap) {
      const roadmapLines = dbUser.roadmap.split("\n");
      let weekCount = 0;
      let previewLines: string[] = [];
      
      for (const line of roadmapLines) {
        if (line.match(/^##?\s*Week\s*\d+/i)) {
          weekCount++;
          if (weekCount > 2) break;
        }
        if (weekCount > 0 && weekCount <= 2) {
          previewLines.push(line);
        }
      }
      
      roadmapPreview = previewLines.join("\n");
    }
    
    // Get recommended courses (top 3)
    const allResources = await Resource.find({});
    const resourcesWithScores = allResources.map((resource) => {
      const resourceSkills = resource.relatedSkills || [];
      const matchedSkills = resourceSkills.filter((skill: string) =>
        userSkills.some(
          (userSkill: string) =>
            userSkill.toLowerCase() === skill.toLowerCase() ||
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      
      const skillMatchScore =
        resourceSkills.length > 0
          ? (matchedSkills.length / resourceSkills.length) * 100
          : 0;
      
      const trackMatch = preferredTrack
        ? resourceSkills.some((skill: string) =>
            preferredTrack.toLowerCase().includes(skill.toLowerCase())
          ) || resource.title.toLowerCase().includes(preferredTrack.toLowerCase())
        : false;
      
      const totalScore = trackMatch
        ? Math.min(100, skillMatchScore + 15)
        : skillMatchScore;
      
      return {
        ...resource.toObject(),
        matchScore: Math.round(totalScore),
        matchedSkills,
      };
    });
    
    const recommendedCourses = resourcesWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .filter((resource) => resource.matchScore > 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            _id: dbUser._id?.toString(),
            name: dbUser.name,
            email: dbUser.email,
            image: dbUser.image,
            skills: dbUser.skills,
            preferredTrack: dbUser.preferredTrack,
            experienceLevel: dbUser.experienceLevel,
            education: dbUser.education,
          },
          stats: {
            skillsCount,
            savedCourses,
            savedJobs,
            missingSkillsCount,
          },
          bestJobs: bestJobs.map((job) => ({
            _id: job._id?.toString(),
            title: job.title,
            company: job.company,
            location: job.location,
            requiredSkills: job.requiredSkills,
            experienceLevel: job.experienceLevel,
            jobType: job.jobType,
            track: job.track,
            salary: job.salary,
            matchScore: job.matchScore,
            missingSkills: job.missingSkills || [],
            matchedSkills: job.matchedSkills || [],
          })),
          roadmapPreview,
          recommendedCourses: recommendedCourses.map((resource) => ({
            _id: resource._id?.toString(),
            title: resource.title,
            platform: resource.platform,
            url: resource.url,
            relatedSkills: resource.relatedSkills,
            cost: resource.cost,
            description: resource.description,
            level: resource.level,
            matchScore: resource.matchScore,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data",
      },
      { status: 500 }
    );
  }
}

