import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { type IWorkExperience } from "@/models/User";
import Job from "@/models/Job";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { generateText, checkGroqConfiguration } from "@/lib/gemini-client";

/**
 * POST /api/generate-customized-cv
 * Generate a job-specific customized CV using user's profile and job requirements
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
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch user profile
    const dbUser = await User.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only allow job seekers to generate customized CV
    if (dbUser.userType !== "job_seeker") {
      return NextResponse.json(
        { error: "Customized CV is only available for job seekers" },
        { status: 403 }
      );
    }

    // Fetch job details
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
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
    const userEmail = dbUser.email || "";
    const userSkills = dbUser.skills || [];
    const education = dbUser.education || "Not specified";
    const experienceLevel = dbUser.experienceLevel || "Not specified";
    const preferredTrack = dbUser.preferredTrack || "Not specified";
    const projects = dbUser.projects || [];
    const workExperience = dbUser.workExperience || [];

    // Build work experience section
    let workExperienceText = "";
    if (workExperience.length > 0) {
      workExperienceText = workExperience
        .map((exp: IWorkExperience) => {
          const dateRange = exp.endDate
            ? `${exp.startDate} - ${exp.endDate}`
            : `${exp.startDate} - Present`;
          const descriptionBullets =
            exp.description && exp.description.length > 0
              ? exp.description.map((desc) => `  • ${desc}`).join("\n")
              : "";
          return `${exp.jobTitle}\n${exp.company}\n${dateRange}\n${descriptionBullets}`;
        })
        .join("\n\n");
    } else {
      workExperienceText = "No work experience listed";
    }

    // Build user context
    const userContext = `
CANDIDATE PROFILE:
- Name: ${userName}
- Email: ${userEmail}
- Education: ${education}
- Experience Level: ${experienceLevel}
- Preferred Career Track: ${preferredTrack}
- Skills: ${userSkills.length > 0 ? userSkills.join(", ") : "No specific skills listed"}
${projects.length > 0 ? `- Projects: ${projects.join(", ")}` : ""}

WORK EXPERIENCE:
${workExperienceText}
`;

    // Build job context
    const jobContext = `
JOB REQUIREMENTS:
- Job Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Experience Level Required: ${job.experienceLevel}
- Job Type: ${job.jobType}
- Required Skills: ${job.requiredSkills.join(", ")}
- Job Description: ${job.description}
`;

    // System instruction for job-specific CV generation
    const systemInstruction = `You are an expert CV writer specializing in creating job-specific, customized resumes that match job requirements.

Your task is to create a professional CV that:
1. Matches the candidate's skills and experience to the job requirements
2. Highlights relevant achievements and experiences that align with the job
3. Emphasizes skills that match the job's required skills
4. Formats the CV in a clear, professional structure
5. Uses action-oriented language and quantifiable achievements where possible
6. Tailors work experience descriptions to emphasize relevance to the job

CV Structure:
- Header: Name, Email, Location (if available)
- Professional Summary: 2-3 sentences highlighting key qualifications matching the job
- Skills: List relevant skills, prioritizing those mentioned in job requirements
- Work Experience: For each role, include job title, company, dates, and tailored description bullets that highlight achievements relevant to the job
- Education: Include education details
- Projects: Include relevant projects if they align with job requirements

Guidelines:
- Focus on matching the candidate's experience to the job requirements
- Highlight transferable skills and experiences
- Use keywords from the job description
- Keep descriptions concise and impactful
- Use bullet points for easy readability
- Quantify achievements with numbers, percentages, or timeframes where possible
- If the candidate lacks direct experience, emphasize transferable skills and relevant projects

Return the CV as formatted text, ready to use. Do not include markdown code blocks or explanations.`;

    // Build prompt
    const prompt = `${userContext}

${jobContext}

Create a customized CV that matches the candidate's profile to the job requirements above. 
Focus on highlighting the candidate's relevant skills, experiences, and achievements that align with this specific job.
Format the CV professionally and make it compelling for this particular role.`;

    // Generate customized CV using Groq
    const customizedCV = await generateText(prompt, systemInstruction, {
      temperature: 0.7,
      max_tokens: 2048,
    }).then((text) => {
      // Clean up the response - remove markdown code blocks if present
      return text
        .replace(/```\w*\n?/g, "")
        .replace(/```/g, "")
        .trim();
    });

    return NextResponse.json(
      {
        success: true,
        cv: customizedCV,
        message: "Customized CV generated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating customized CV:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to generate customized CV";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check if it's an API key error
      if (error.message.includes("API key") || error.message.includes("401") || error.message.includes("403")) {
        errorMessage = "Invalid or missing Groq API key. Please check your GROQ_API_KEY environment variable.";
      }
      // Check if it's a rate limit error
      if (error.message.includes("rate limit") || error.message.includes("429")) {
        errorMessage = "Groq API rate limit exceeded. Please try again in a moment.";
      }
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}

