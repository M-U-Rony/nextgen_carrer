import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { IWorkExperience } from "@/models/User";
import Job from "@/models/Job";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { generateText } from "@/lib/gemini-client";

/**
 * POST /api/generate-customized-cv
 * Generate job-specific customized CV using Gemini AI
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

    // Parse request body
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

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

    // Fetch job details
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Build user context
    const userSkills = dbUser.skills || [];
    const education = dbUser.education || "Not specified";
    const experienceLevel = dbUser.experienceLevel || "Not specified";
    const preferredTrack = dbUser.preferredTrack || "Not specified";
    const workExperience = dbUser.workExperience || [];
    const projects = dbUser.projects || [];

    // Identify matched and missing skills
    const jobSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase().trim());
    const matchedSkills = userSkills.filter((skill: string) =>
      jobSkills.some(
        (js: string) =>
          js === skill.toLowerCase().trim() ||
          js.includes(skill.toLowerCase().trim()) ||
          skill.toLowerCase().trim().includes(js)
      )
    );
    const missingSkills = jobSkills.filter(
      (js: string) =>
        !matchedSkills.some(
          (ms: string) =>
            ms.toLowerCase().trim() === js ||
            ms.toLowerCase().trim().includes(js) ||
            js.includes(ms.toLowerCase().trim())
        )
    );

    const userContext = `
CANDIDATE PROFILE:
Name: ${dbUser.name}
Email: ${dbUser.email || "Not provided"}
Location: ${dbUser.location || "Not provided"}
Experience Level: ${experienceLevel}
Preferred Track/Career Focus: ${preferredTrack}
Education: ${education}

Skills (${userSkills.length} total): ${userSkills.length > 0 ? userSkills.join(", ") : "None listed"}
Matched Skills for this Job: ${matchedSkills.length > 0 ? matchedSkills.join(", ") : "None"}
Skills to Emphasize: ${matchedSkills.length > 0 ? matchedSkills.join(", ") : userSkills.slice(0, 5).join(", ")}

Work Experience:
${workExperience.length > 0
  ? workExperience
      .map(
        (exp: IWorkExperience) => `
• ${exp.jobTitle} at ${exp.company}
  Period: ${exp.startDate} - ${exp.endDate || "Present"}
  Achievements:
${exp.description.map((desc) => `    - ${desc}`).join("\n")}`
      )
      .join("\n")
  : "No work experience listed"}

Projects:
${projects.length > 0 ? projects.map((p: string) => `- ${p}`).join("\n") : "No projects listed"}
`;

    const jobContext = `
TARGET JOB:
Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Job Type: ${job.jobType}
Experience Level Required: ${job.experienceLevel}
Track: ${job.track}

Required Skills: ${job.requiredSkills?.join(", ") || "None specified"}
Job Description:
${job.description || "No description provided"}
`;

    const systemInstruction = `You are an expert CV/resume writer specializing in creating job-specific, customized resumes that match job requirements.

Your task is to create a professional, complete CV that:
1. Matches the candidate's skills and experience to the job requirements
2. Highlights relevant achievements and experiences that align with the job
3. Emphasizes skills that match the job's required skills
4. Formats the CV in a clear, professional structure
5. Uses action-oriented language and quantifiable achievements where possible
6. Tailors work experience descriptions to emphasize relevance to the job

CV Structure:
- Header: Name, Email, Location (if available)
- Professional Summary: 2-3 sentences highlighting key qualifications matching the job, emphasizing matched skills
- Skills: List relevant skills, prioritizing those mentioned in job requirements at the top
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
- Emphasize matched skills prominently
- Tailor each work experience bullet to show relevance to the job

Return the CV as formatted text, ready to use. Do not include markdown code blocks or explanations. Use this exact structure:

[NAME]
[Email] | [Location] | [Phone if available]

PROFESSIONAL SUMMARY
[2-3 sentences tailored to the job]

SKILLS
[Prioritize matched skills first, then other relevant skills]

WORK EXPERIENCE

[Job Title] | [Company] | [Date Range]
• [Achievement-focused bullet relevant to job]
• [Another achievement bullet]
...

EDUCATION
[Degree] | [Institution] | [Date/Graduation Year]

PROJECTS (if relevant)
[Project Name]
[Brief description relevant to job]`;

    // Build prompt
    const prompt = `${userContext}

${jobContext}

Create a customized CV that matches the candidate's profile to the job requirements above. 
Focus on highlighting the candidate's relevant skills, experiences, and achievements that align with this specific job.
Format the CV professionally and make it compelling for this particular role at ${job.company}.`;

    // Generate customized CV using Gemini
    const customizedCV = await generateText(prompt, systemInstruction, {
      temperature: 0.7,
      maxOutputTokens: 4096,
    }).then((text) => {
      // Clean up the response - remove markdown code blocks if present
      return text.replace(/```\w*\n?/g, "").replace(/```/g, "").trim();
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate customized CV",
      },
      { status: 500 }
    );
  }
}

