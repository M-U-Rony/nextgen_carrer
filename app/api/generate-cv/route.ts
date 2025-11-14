import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { generateText, extractJSON, checkGroqConfiguration } from "@/lib/gemini-client";

interface CVGenerationResult {
  summary: string;
  bullets: string[];
  suggestedTitles: string[];
}

/**
 * POST /api/generate-cv
 * Generate AI-powered CV summary and bullet points
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
    const { userId } = body;

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

    // Only allow job seekers to generate CV
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "CV builder is only available for job seekers" },
        { status: 403 }
      );
    }

    // Check if Groq API key is configured
    const groqConfig = checkGroqConfiguration();
    if (!groqConfig.configured) {
      return NextResponse.json(
        { error: groqConfig.error || "Groq API key is not configured" },
        { status: 500 }
      );
    }

    // Gather user information
    const userName = dbUser.name || "User";
    const userSkills = dbUser.skills || [];
    const education = dbUser.education || "Not specified";
    const experienceLevel = dbUser.experienceLevel || "Not specified";
    const preferredTrack = dbUser.preferredTrack || "Not specified";
    const projects = dbUser.projects || [];

    // Build user context for prompt
    const userContext = `
User Information:
- Name: ${userName}
- Education: ${education}
- Experience Level: ${experienceLevel}
- Preferred Career Track: ${preferredTrack}
- Skills: ${userSkills.length > 0 ? userSkills.join(", ") : "No specific skills listed"}
${projects.length > 0 ? `- Projects: ${projects.join(", ")}` : ""}
`;

    // System instruction for professional résumé tone
    const systemInstruction = `You are a professional résumé writer specializing in creating concise, achievement-oriented CV content.

Guidelines:
- Use professional, confident language
- Focus on achievements and impact, not just responsibilities
- Keep summary to 1-3 sentences, compelling and targeted
- Create 5-8 bullet points that are action-oriented (start with verbs like "Developed", "Implemented", "Led", etc.)
- Make bullets quantifiable where possible (mention numbers, percentages, timeframes)
- Suggest 3 relevant job titles based on the user's profile
- Keep all content concise and impactful

Return ONLY valid JSON in this exact format:
{
  "summary": "Professional summary (1-3 sentences)",
  "bullets": ["Bullet point 1", "Bullet point 2", ...],
  "suggestedTitles": ["Job Title 1", "Job Title 2", "Job Title 3"]
}

Do not include any markdown formatting, explanations, or additional text.`;

    // Build prompt
    const prompt = `${userContext}

Based on the above information, generate:
1. A concise professional summary (1-3 sentences) that highlights the candidate's key strengths and career focus.
2. 5-8 bullet points suitable for a CV, action-oriented, starting with verbs, and quantifiable where possible.
3. 3 suggested job titles that align with the candidate's skills and track.

Return the response as JSON only.`;

    // Combine system instruction with prompt for Groq
    const fullPrompt = `${systemInstruction}\n\n${prompt}`;

    // Generate CV content using Groq
    const generatedText = await generateText(fullPrompt, undefined, {
      temperature: 0.7,
      max_tokens: 1024,
    });

    // Parse JSON response
    let cvResult: CVGenerationResult;
    try {
      cvResult = extractJSON(generatedText);
    } catch (parseError) {
      console.error("Failed to parse Groq response:", generatedText);
      throw new Error("Failed to parse CV generation results. Please try again.");
    }

    // Validate and sanitize the result
    const sanitizedResult: CVGenerationResult = {
      summary:
        typeof cvResult.summary === "string"
          ? cvResult.summary.trim()
          : "Professional candidate with strong technical skills and a passion for continuous learning.",
      bullets: Array.isArray(cvResult.bullets)
        ? cvResult.bullets
            .filter((bullet) => typeof bullet === "string" && bullet.trim().length > 0)
            .slice(0, 8) // Limit to 8 bullets max
            .map((bullet) => bullet.trim())
        : [],
      suggestedTitles: Array.isArray(cvResult.suggestedTitles)
        ? cvResult.suggestedTitles
            .filter(
              (title) => typeof title === "string" && title.trim().length > 0
            )
            .slice(0, 3)
            .map((title) => title.trim())
        : [],
    };

    // Ensure we have at least 5 bullets (pad if needed)
    if (sanitizedResult.bullets.length < 5) {
      while (sanitizedResult.bullets.length < 5) {
        sanitizedResult.bullets.push(
          `Demonstrated strong ${preferredTrack !== "Not specified" ? preferredTrack.toLowerCase() : "technical"} skills and problem-solving abilities`
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: sanitizedResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CV generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate CV content",
      },
      { status: 500 }
    );
  }
}

