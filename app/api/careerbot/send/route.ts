import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import User from "@/models/User";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { ChatbotMentor } from "@/lib/gemini-client";

// In-memory store for chat sessions per user (in production, use a database)
const chatSessions = new Map<string, ChatbotMentor>();

/**
 * POST /api/careerbot/send
 * Send a message to CareerBot and get response
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
    const { text, conversationId } = body;

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // Sanitize user input (basic sanitization)
    const sanitizedText = text.trim().substring(0, 2000); // Limit length

    // Use authenticated user's ID
    const userId = user.userId;

    await connectDB();

    // Fetch user profile for context
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
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

    // Generate conversation ID if not provided
    const currentConversationId =
      conversationId || `conv_${userId}_${Date.now()}`;

    // Fetch last 12 messages for this user (recent conversation)
    const recentMessages = await Message.find({
      userId,
      ...(conversationId ? { conversationId } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    // Reverse to get chronological order
    const messagesInOrder = recentMessages.reverse();

    // Build system prompt with user context
    const userSkills = dbUser.skills || [];
    const preferredTrack = dbUser.preferredTrack || "Not specified";
    const experienceLevel = dbUser.experienceLevel || "Not specified";
    
    // Get comprehensive skill gap analysis
    let skillGapsInfo = "";
    try {
      // Only analyze skill gaps for job seekers
      if (dbUser.userType === "job_seeker") {
        const Job = (await import("@/models/Job")).default;
        const Resource = (await import("@/models/Resource")).default;
        const { calculateJobMatch } = await import("@/lib/job-matching");
        
        // Fetch jobs (filter by preferred track if available)
        const jobQuery: any = {};
        if (preferredTrack && preferredTrack !== "Not specified") {
          jobQuery.track = { $regex: new RegExp(preferredTrack, "i") };
        }
        const allJobs = await Job.find(jobQuery).limit(20);
        
        if (allJobs.length > 0) {
          // Analyze skill gaps
          const skillFrequencyMap = new Map<string, { count: number; jobs: string[] }>();
          let totalMatchScore = 0;
          
          allJobs.forEach((job) => {
            const matchResult = calculateJobMatch(dbUser, job);
            totalMatchScore += matchResult.matchScore;
            
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
          
          const averageMatchScore = Math.round(totalMatchScore / allJobs.length);
          
          // Convert to array and determine priority
          const skillGaps = Array.from(skillFrequencyMap.entries())
            .map(([skill, data]) => {
              const frequencyPercentage = (data.count / allJobs.length) * 100;
              let priority: "high" | "medium" | "low" = "low";
              if (frequencyPercentage >= 50) {
                priority = "high";
              } else if (frequencyPercentage >= 25) {
                priority = "medium";
              }
              
              return {
                skill: skill.charAt(0).toUpperCase() + skill.slice(1),
                frequency: data.count,
                priority,
              };
            })
            .sort((a, b) => b.frequency - a.frequency);
          
          const highPriorityGaps = skillGaps
            .filter((gap) => gap.priority === "high")
            .slice(0, 5)
            .map((gap) => gap.skill);
          
          const mediumPriorityGaps = skillGaps
            .filter((gap) => gap.priority === "medium")
            .slice(0, 3)
            .map((gap) => gap.skill);
          
          if (highPriorityGaps.length > 0 || mediumPriorityGaps.length > 0) {
            skillGapsInfo = `\n\nSKILL GAP ANALYSIS:\n`;
            skillGapsInfo += `- High Priority Skills to Learn: ${highPriorityGaps.join(", ")}\n`;
            if (mediumPriorityGaps.length > 0) {
              skillGapsInfo += `- Medium Priority Skills: ${mediumPriorityGaps.join(", ")}\n`;
            }
            skillGapsInfo += `- Total Skills You Have: ${userSkills.length}\n`;
            skillGapsInfo += `- Skills to Learn: ${skillGaps.length}\n`;
            skillGapsInfo += `- Average Job Match Score: ${averageMatchScore}%\n`;
            
            // Check for recommended resources
            const missingSkills = skillGaps.map((gap) => gap.skill.toLowerCase().trim());
            const allResources = await Resource.find({}).limit(50);
            const relevantResources = allResources.filter((resource) => {
              const resourceSkills = (resource.relatedSkills || []).map((skill: string) =>
                skill.toLowerCase().trim()
              );
              return resourceSkills.some((resourceSkill: string) =>
                missingSkills.some(
                  (missingSkill: string) =>
                    resourceSkill === missingSkill ||
                    resourceSkill.includes(missingSkill) ||
                    missingSkill.includes(resourceSkill)
                )
              );
            });
            
            if (relevantResources.length > 0) {
              skillGapsInfo += `- Available Learning Resources: ${relevantResources.length} resources found\n`;
            }
          }
        }
      }
    } catch (error) {
      // If skill gap analysis fails, continue without it
      console.log("Could not analyze skill gaps for CareerBot context:", error);
    }

    const systemPrompt = `You are CareerBot — a friendly, practical career mentor focused on helping users identify and bridge skill gaps. Your primary mission is to guide users on which skills they need to develop to advance their careers.

IMPORTANT DISCLAIMER: All advice provided is for guidance purposes only. CareerBot provides suggestions and recommendations, not guarantees. Job placement, career advancement, and skill development outcomes depend on various factors including market conditions, individual effort, and opportunity availability.

User Context:
- Current Skills: ${userSkills.length > 0 ? userSkills.join(", ") : "No skills listed yet"}
- Preferred Track/Career Path: ${preferredTrack}
- Experience Level: ${experienceLevel}
${skillGapsInfo || ""}

Your Primary Focus - Skill Gap Guidance:
1. **Identify Skill Gaps**: When users ask about their career, skills, or job readiness, always reference the skill gap analysis provided above. Highlight the most critical skills they're missing.

2. **Prioritize Recommendations**: 
   - Start with HIGH PRIORITY skills (those required by many jobs in their field)
   - Then suggest MEDIUM PRIORITY skills (nice to have)
   - Explain WHY each skill is important for their career path

3. **Provide Actionable Steps**:
   - For each skill gap, suggest specific learning resources (courses, tutorials, projects)
   - Recommend practical projects they can build to practice the skill
   - Suggest a learning timeline (e.g., "Spend 2-3 weeks learning React basics")
   - Guide them on how to demonstrate the skill (portfolio projects, certifications)

4. **Context-Aware Responses**:
   - If user asks "What skills should I learn?", provide a prioritized list based on the skill gap analysis
   - If user asks "Am I ready for jobs?", compare their current skills with job requirements
   - If user asks "What's my biggest gap?", identify the highest priority missing skill
   - If user asks about a specific skill, explain if it's a gap and how important it is

5. **Encouragement & Realism**:
   - Acknowledge their existing skills positively
   - Be realistic about the time and effort needed to learn new skills
   - Break down complex skills into smaller, manageable learning steps
   - Celebrate progress and encourage continuous learning

Guidelines:
- Always reference the skill gap analysis when providing guidance
- Prioritize high-priority skills over medium/low priority ones
- Suggest specific, actionable learning paths (not just "learn X")
- Recommend projects that combine multiple skills
- Guide users to use the platform's resources and job matching features
- Keep responses focused and practical (2-4 paragraphs)
- Ask clarifying questions if the user's goal is unclear
- NEVER promise job offers or guaranteed outcomes
- Be encouraging but realistic about career advancement timelines

Response Format:
- Start with a brief acknowledgment of their question
- Highlight 2-3 most critical skill gaps (if any)
- Provide specific, actionable recommendations for each gap
- End with encouragement and next steps

Remember: Your main role is to help users understand their skill gaps and provide clear, actionable guidance on how to bridge them. Focus on empowering users through knowledge and specific recommendations.`;

    // Save user message to database first
    const userMessage = await Message.create({
      userId,
      role: "user",
      text: sanitizedText,
      conversationId: currentConversationId,
    });

    // Get or create chat session for this conversation
    const sessionKey = `${userId}_${currentConversationId}`;
    let chatSession = chatSessions.get(sessionKey);

    if (!chatSession) {
      // Create a new chat session with career persona
      chatSession = new ChatbotMentor('career');
      
      // Add the comprehensive system prompt with user context and skill gaps
      chatSession.addSystemMessage(systemPrompt);
      
      // Load existing conversation history from database (excluding system messages)
      if (messagesInOrder.length > 0) {
        const historyMessages = messagesInOrder
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
            text: msg.text
          }));
        
        if (historyMessages.length > 0) {
          chatSession.loadHistory(historyMessages);
        }
      }
      
      chatSessions.set(sessionKey, chatSession);
    }

    // Generate response using Gemini
    const assistantText = await chatSession.sendMessage(sanitizedText);

    // Save assistant response to database
    const assistantMessage = await Message.create({
      userId,
      role: "assistant",
      text: assistantText,
      conversationId: currentConversationId,
    });

    // Fetch updated conversation (last 12 messages)
    const updatedMessages = await Message.find({
      userId,
      conversationId: currentConversationId,
    })
      .sort({ createdAt: 1 })
      .limit(50) // Get more for display
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: assistantMessage,
        conversationId: currentConversationId,
        messages: updatedMessages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CareerBot send error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send message to CareerBot",
      },
      { status: 500 }
    );
  }
}

