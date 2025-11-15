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

    const prompt = `Create a comprehensive ${timeline} career roadmap for a job seeker based on their CURRENT TECH STACK and career goals.

**CRITICAL: Build the roadmap around the user's existing tech stack and fill gaps to reach the target role.**

CURRENT TECH STACK (SKILLS YOU ALREADY HAVE): ${skillsText}
EXPERIENCE LEVEL: ${userExperience}
EDUCATION: ${userEducation}
PREFERRED TRACK/CAREER PATH: ${preferredTrack}
TARGET ROLE: ${targetRole}
TIMELINE: ${timeline}
DAILY LEARNING HOURS: ${dailyHoursText}

ROADMAP REQUIREMENTS:

1. **Tech Stack Analysis**: 
   - Acknowledge and build upon the user's existing skills from their tech stack
   - Identify gaps between current tech stack and target role requirements
   - Create a learning path that enhances existing skills and adds missing ones
   - For 6-month roadmap: Go deeper into each technology, include advanced concepts, best practices, and real-world applications

2. **Structure the roadmap**:
   - For 6-month: Divide into 24 weeks (6 months) organized into 4-6 major phases
   - For 3-month: Divide into 12 weeks (3 months) organized into 3-4 major phases
   - Each phase should build on the previous one and leverage existing tech stack knowledge

3. **For each week/phase, include**:
   - **Learning Topics**: Specific technologies, concepts, or skills to master (prioritize missing skills, then advanced concepts in existing stack)
   - **Projects**: 2-3 practical project ideas that use BOTH existing tech stack AND new skills being learned
   - **Practice Tasks**: Daily or weekly exercises that reinforce learning
   - **Resources**: Learning platforms and resource types (NO specific URLs - just mention types like "online courses", "official documentation", "YouTube tutorials", "coding challenges", etc.)
   - **Checkpoints**: Clear success criteria to verify learning progress

4. **Tech Stack Integration**:
   - Show how existing skills connect with new skills
   - Suggest projects that combine multiple technologies from the user's stack
   - Provide learning paths that are synergistic (e.g., if they know JavaScript, recommend Node.js before Python)
   - Include exercises that strengthen existing skills while learning new ones

5. **For 6-month roadmap specifically**:
   - Include deeper dives into each technology
   - Add advanced topics and best practices
   - Include performance optimization, testing, deployment, and production-ready concepts
   - Cover system design, architecture patterns, and scalability considerations
   - Include portfolio-building projects of increasing complexity

6. **Include a dedicated section on "When to Start Applying"**:
   - Specific timing (e.g., "Start applying in Week 18-20" for 6-month, or "Week 10-12" for 3-month)
   - What skills/projects should be completed before applying (minimum viable skillset)
   - Portfolio requirements (3-5 projects showcasing tech stack)
   - Resume preparation tips tailored to the tech stack

7. **Format the output using Markdown**:
   - Use # for main title (e.g., "# 6-Month Career Roadmap: ${targetRole}")
   - Use ## for major phases (e.g., "## Phase 1: Building on Your Tech Stack (Weeks 1-4)")
   - Use ### for weekly sections (e.g., "### Week 1: [Topic] - Leveraging ${skillsText.split(',')[0]} and Learning [New Skill]")
   - Use #### for subsections (Learning Topics, Projects, Practice Tasks, etc.)
   - Use bullet points (- or •) for lists
   - Use **bold** for emphasis on key terms and technologies

8. **Make it motivating and realistic**:
   - Acknowledge their existing tech stack as a strong foundation
   - Show how their current skills are valuable and will accelerate learning
   - Provide encouragement throughout
   - Include tips for staying motivated over 6 months
   - End with an inspiring conclusion

9. **Be extremely specific and actionable**:
   - Instead of "Learn JavaScript", say "Master JavaScript fundamentals: variables, functions, arrays, objects, ES6+ features (let/const, arrow functions, destructuring, async/await, promises)"
   - Instead of "Build a project", say "Build a Full-Stack Todo App: Frontend with React (using your existing ${skillsText.includes('React') ? 'React' : 'JavaScript'} knowledge), Backend with Node.js/Express, Database with MongoDB, Authentication with JWT"
   - List specific concepts, methods, patterns, and tools to learn each week

10. **Tech Stack Progression**:
    - Week 1-4: Strengthen existing skills + foundational new skills
    - Week 5-12: Integrate existing and new skills in projects
    - Week 13-18: Advanced concepts and production-ready applications
    - Week 19-24: Portfolio completion, interview preparation, and job application

IMPORTANT: 
- Focus heavily on building from the existing tech stack: ${skillsText}
- Make the roadmap personalized to bridge gaps between current stack and ${targetRole} requirements
- Return ONLY the roadmap text in Markdown format
- Do NOT include code blocks, JSON, or any other wrapper
- Start directly with the roadmap title and content`;

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

