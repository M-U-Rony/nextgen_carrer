import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { IWorkExperience } from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { generateText } from "@/lib/gemini-client";

/**
 * POST /api/generate-cv
 * Generate general CV content (summary + bullet points) using Gemini AI
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { user } = authResult;
    await connectDB();

    // Fetch user profile
    const dbUser = await User.findById(user.userId).select("-password");
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow job seekers to generate CVs
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "CV generation is only available for job seekers" },
        { status: 403 }
      );
    }

    // Build user context
    const userSkills = dbUser.skills || [];
    const education = dbUser.education || "Not specified";
    const experienceLevel = dbUser.experienceLevel || "Not specified";
    const preferredTrack = dbUser.preferredTrack || "Not specified";
    const workExperience = dbUser.workExperience || [];
    const projects = dbUser.projects || [];

    const userContext = `
User Profile:
- Name: ${dbUser.name}
- Email: ${dbUser.email}
- Experience Level: ${experienceLevel}
- Preferred Track: ${preferredTrack}
- Education: ${education}

Skills: ${userSkills.length > 0 ? userSkills.join(", ") : "None listed"}

Work Experience:
${workExperience.length > 0
  ? workExperience
      .map(
        (exp: IWorkExperience) => `
- ${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.endDate || "Present"})
  ${exp.description.map((desc: string) => `  • ${desc}`).join("\n")}`
      )
      .join("\n")
  : "No work experience listed"}

Projects:
${projects.length > 0 ? projects.map((p: string) => `- ${p}`).join("\n") : "No projects listed"}
`;

    const systemInstruction = `You are an expert CV/resume writer specializing in creating compelling professional summaries and achievement-focused bullet points.

Your task is to generate:
1. A professional summary (2-3 sentences) that highlights the candidate's key qualifications, experience level, and career focus
2. 5-8 achievement-focused bullet points that showcase the candidate's skills and accomplishments
3. 3-5 suggested job titles that match the candidate's profile

Guidelines:
- Use action-oriented language
- Quantify achievements where possible (numbers, percentages, timeframes)
- Highlight relevant skills and experience
- Make the summary compelling and concise
- Focus on achievements, not just responsibilities
- Use professional, confident tone
- Match the language style to the experience level (junior = eagerness to learn, senior = leadership and expertise)

Return the response in JSON format:
{
  "summary": "2-3 sentence professional summary",
  "bullets": ["bullet point 1", "bullet point 2", ...],
  "suggestedTitles": ["Job Title 1", "Job Title 2", ...]
}`;

    const prompt = `${userContext}

Generate a professional CV summary and achievement-focused bullet points based on the user profile above.`;

    // Generate CV content using Gemini
    const responseText = await generateText(prompt, systemInstruction, {
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    // Parse JSON response (Gemini may wrap in markdown code blocks)
    let cvData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      cvData = JSON.parse(jsonText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract structured data manually
      console.warn("Failed to parse JSON, attempting manual extraction");
      
      // Extract summary (look for "summary" or first paragraph)
      const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]+)"/) ||
                          responseText.match(/summary[:\-]\s*(.+?)(?:\n|"bullets")/i);
      
      // Extract bullets (look for array or bullet points)
      const bulletsMatch = responseText.match(/"bullets"\s*:\s*\[([\s\S]*?)\]/) ||
                          responseText.match(/(?:bullet|achievement)[\s\S]{0,50}[:]\s*(.+)/i);
      
      // Extract suggested titles
      const titlesMatch = responseText.match(/"suggestedTitles"\s*:\s*\[([\s\S]*?)\]/);

      cvData = {
        summary: summaryMatch?.[1]?.trim() || 
                 "Experienced professional with strong skills and dedication to continuous learning.",
        bullets: bulletsMatch?.[1] 
          ? bulletsMatch[1]
              .split(",")
              .map((b: string) => b.trim().replace(/^["']|["']$/g, ""))
              .filter((b: string) => b.length > 0)
          : [
              "Demonstrated ability to work effectively in team environments",
              "Strong problem-solving skills with attention to detail",
              "Committed to continuous learning and professional development",
            ],
        suggestedTitles: titlesMatch?.[1]
          ? titlesMatch[1]
              .split(",")
              .map((t: string) => t.trim().replace(/^["']|["']$/g, ""))
              .filter((t: string) => t.length > 0)
          : [],
      };
    }

    // Validate and ensure required fields
    if (!cvData.summary || !cvData.bullets || !Array.isArray(cvData.bullets)) {
      throw new Error("Invalid response format from AI");
    }

    // Ensure bullets array has at least 3 items
    if (cvData.bullets.length < 3) {
      // Generate additional generic bullets if needed
      const additionalBullets = [
        "Strong communication and collaboration skills",
        "Detail-oriented with excellent time management abilities",
        "Adaptable to fast-paced work environments",
      ];
      cvData.bullets = [...cvData.bullets, ...additionalBullets].slice(0, 8);
    }

    // Ensure suggested titles array
    if (!cvData.suggestedTitles || !Array.isArray(cvData.suggestedTitles)) {
      cvData.suggestedTitles = [];
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: cvData.summary,
          bullets: cvData.bullets.slice(0, 8), // Limit to 8 bullets
          suggestedTitles: cvData.suggestedTitles.slice(0, 5), // Limit to 5 titles
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating CV:", error);
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

