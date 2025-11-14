import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, validatePDF } from "@/lib/pdf-extractor";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { generateText, extractJSON, checkGroqConfiguration } from "@/lib/gemini-client";

interface CVExtractionResult {
  skills: string[];
  tools: string[];
  suggestedRoles: string[];
  summary: string;
}

/**
 * POST /api/extract-cv
 * Extract skills, tools, and roles from CV (PDF or text)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await getAuthenticatedUser(request);
    if (authResult.error) {
      return authResult.error;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const textInput = formData.get("text") as string | null;

    // Validate input
    if (!file && !textInput) {
      return NextResponse.json(
        { error: "Either a PDF file or text input is required" },
        { status: 400 }
      );
    }

    let cvText = "";

    // Extract text from PDF if file is provided
    if (file) {
      // Check file type
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are supported" },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate PDF
      if (!validatePDF(buffer)) {
        return NextResponse.json(
          { error: "Invalid PDF file" },
          { status: 400 }
        );
      }

      // Extract text from PDF
      const extractionResult = await extractTextFromPDF(buffer);
      cvText = extractionResult.text;

      if (!cvText || cvText.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract text from PDF. The PDF might be empty or image-based." },
          { status: 400 }
        );
      }
    } else if (textInput) {
      cvText = textInput.trim();
      if (cvText.length === 0) {
        return NextResponse.json(
          { error: "Text input cannot be empty" },
          { status: 400 }
        );
      }
    }

    // Check if Groq API key is configured
    const groqConfig = checkGroqConfiguration();
    if (!groqConfig.configured) {
      return NextResponse.json(
        { error: groqConfig.error || "Groq API key is not configured" },
        { status: 500 }
      );
    }

    // Prepare prompt for Groq
    const systemPrompt = `You are an expert CV analyzer. Extract skills, tools, and roles from CV text. Always return valid JSON only.`;

    const prompt = `Extract SKILLS, TOOLS, and POSSIBLE ROLES from the following CV text.

Return a JSON object with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "tools": ["tool1", "tool2", ...],
  "suggestedRoles": ["role1", "role2", ...],
  "summary": "Brief professional summary (2-3 sentences)"
}

Requirements:
- Extract only relevant technical and professional skills
- Include programming languages, frameworks, software tools, and technologies
- Suggest 3-5 relevant job roles based on the CV content
- Write a concise professional summary
- Return ONLY valid JSON, no additional text or markdown formatting

CV Text:
${cvText.substring(0, 30000)}${cvText.length > 30000 ? "\n... (truncated)" : ""}`;

    // Generate extraction using Groq
    const extractedText = await generateText(prompt, systemPrompt, {
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 1024,
    });

    // Parse JSON response
    let extractionResult: CVExtractionResult;
    try {
      extractionResult = extractJSON(extractedText);
    } catch (parseError) {
      console.error("Failed to parse Groq response:", extractedText);
      throw new Error("Failed to parse extraction results. Please try again.");
    }

    // Validate and sanitize the result
    const sanitizedResult: CVExtractionResult = {
      skills: Array.isArray(extractionResult.skills)
        ? extractionResult.skills.filter((s) => typeof s === "string" && s.trim().length > 0)
        : [],
      tools: Array.isArray(extractionResult.tools)
        ? extractionResult.tools.filter((t) => typeof t === "string" && t.trim().length > 0)
        : [],
      suggestedRoles: Array.isArray(extractionResult.suggestedRoles)
        ? extractionResult.suggestedRoles.filter((r) => typeof r === "string" && r.trim().length > 0)
        : [],
      summary: typeof extractionResult.summary === "string"
        ? extractionResult.summary.trim()
        : "",
    };

    return NextResponse.json(
      {
        success: true,
        data: sanitizedResult,
        extractedText: cvText.substring(0, 500) + (cvText.length > 500 ? "..." : ""), // Preview
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CV extraction error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to extract CV information",
      },
      { status: 500 }
    );
  }
}

