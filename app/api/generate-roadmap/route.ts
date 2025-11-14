import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Roadmap from "@/models/Roadmap";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { generateText } from "@/lib/gemini-client";

/**
 * POST /api/generate-roadmap
 * Generate AI-powered career roadmap using Gemini
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
    const { userId, targetRole, timeline, dailyHours } = body;

    // Validate input
    if (!targetRole || !timeline) {
      return NextResponse.json(
        { error: "Target role and timeline are required" },
        { status: 400 }
      );
    }

    // Validate timeline
    if (!["3-month", "6-month"].includes(timeline)) {
      return NextResponse.json(
        { error: "Timeline must be either '3-month' or '6-month'" },
        { status: 400 }
      );
    }

    // Use authenticated user's ID if userId is not provided or doesn't match
    const targetUserId = userId && userId === user.userId ? userId : user.userId;

    await connectDB();

    // Fetch user
    const dbUser = await User.findById(targetUserId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow job seekers to generate roadmaps
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "Career roadmap is only available for job seekers" },
        { status: 403 }
      );
    }

    // Check if Gemini API key is configured
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    // Get user skills and profile information
    const userSkills = dbUser.skills || [];
    const skillsText = userSkills.length > 0 
      ? userSkills.join(", ") 
      : "No specific skills listed yet";
    
    const userExperience = dbUser.experienceLevel || "Not specified";
    const userEducation = dbUser.education || "Not specified";
    const preferredTrack = dbUser.preferredTrack || "Not specified";

    // Prepare prompt for Gemini
    const dailyHoursText = dailyHours 
      ? `${dailyHours} hours per day` 
      : "flexible (user will determine based on availability)";

    const systemPrompt = `You are a senior career mentor with 20+ years of experience in tech and career development. You create highly detailed, actionable, and motivating career roadmaps that help users achieve their career goals. Your roadmaps are practical, realistic, and broken down into clear phases with specific deliverables.`;

    const prompt = `Create a comprehensive career roadmap for a job seeker with the following details:

CURRENT SKILLS: ${skillsText}
EXPERIENCE LEVEL: ${userExperience}
EDUCATION: ${userEducation}
PREFERRED TRACK: ${preferredTrack}
TARGET ROLE: ${targetRole}
TIMELINE: ${timeline}
DAILY LEARNING HOURS: ${dailyHoursText}

ROADMAP REQUIREMENTS:
1. Structure the roadmap into clear phases (for 3-month: 12 weeks, for 6-month: 24 weeks)
2. For each week/phase, include:
   - **Learning Topics**: Specific technologies, concepts, or skills to master
   - **Projects**: 1-2 practical project ideas to build (describe what to build, not just the name)
   - **Practice Tasks**: Daily or weekly exercises to reinforce learning
   - **Resources**: Learning platforms and resource types (NO specific URLs - just mention types like "online courses", "documentation", "YouTube tutorials", etc.)
   - **Checkpoints**: Clear success criteria to verify learning

3. Include a dedicated section on "When to Start Applying" with:
   - Specific timing (e.g., "Start applying in Week X")
   - What skills/projects should be completed before applying
   - Portfolio requirements
   - Resume preparation tips

4. Format the output using Markdown:
   - Use # for main title
   - Use ## for major sections (e.g., "Phase 1: Foundation", "Phase 2: Intermediate")
   - Use ### for weekly sections (e.g., "Week 1: Introduction to...")
   - Use #### for subsections (Learning Topics, Projects, etc.)
   - Use bullet points (- or •) for lists
   - Use **bold** for emphasis on key terms

5. Make it motivating and realistic:
   - Acknowledge the journey ahead
   - Provide encouragement throughout
   - Include tips for staying motivated
   - End with an inspiring conclusion

6. Be specific and actionable:
   - Instead of "Learn JavaScript", say "Learn JavaScript fundamentals: variables, functions, arrays, objects, ES6 features (let/const, arrow functions, destructuring)"
   - Instead of "Build a project", say "Build a Todo List app with add, delete, edit, and filter functionality using vanilla JavaScript"

IMPORTANT: Return ONLY the roadmap text in Markdown format. Do NOT include code blocks, JSON, or any other wrapper. Start directly with the roadmap content.`;

    // Generate roadmap using Gemini
    let roadmapText = await generateText(prompt, systemPrompt, {
      temperature: 0.8,
      maxOutputTokens: 4096,
    });

    // Clean up the response - remove any code blocks if present
    roadmapText = roadmapText
      .replace(/```markdown\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Save roadmap to Roadmap collection (upsert - update if exists, create if not)
    const roadmapData = {
      userId: dbUser._id,
      targetRole,
      timeline,
      dailyHours: dailyHours || undefined,
      roadmapText,
    };

    await Roadmap.findOneAndUpdate(
      { userId: dbUser._id, targetRole, timeline },
      roadmapData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also save to user profile for backward compatibility (optional)
    dbUser.roadmap = roadmapText;
    await dbUser.save();

    return NextResponse.json(
      {
        success: true,
        roadmapText,
        message: "Roadmap generated and saved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate roadmap",
      },
      { status: 500 }
    );
  }
}

