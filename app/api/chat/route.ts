import { NextResponse } from 'next/server';
import { ChatbotMentor, type MentorPersona } from '@/lib/gemini-client';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// In-memory store for chat sessions (in production, use a database)
const chatSessions = new Map<string, ChatbotMentor>();

// Get Gemini API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  throw new Error('Missing required environment variable: GEMINI_API_KEY');
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    // if (!session?.user?.email) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const { message, sessionId, persona = 'career' } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Validate persona
    if (!['career', 'technical', 'general'].includes(persona)) {
      return NextResponse.json(
        { error: 'Invalid persona' },
        { status: 400 }
      );
    }

    // Get or create chat session
    let chatSession = chatSessions.get(sessionId);

    if (!chatSession) {
      // Create a new chat session
      chatSession = new ChatbotMentor(persona as MentorPersona);

      // Get user details from database for context (if session exists)
      if (session?.user?.email) {
        try {
          await connectDB();
          const user = await User.findOne({ email: session.user.email });

          if (user) {
            // Add user context to the first message
            const userContext = `User details:\n` +
              `Name: ${user.name || 'Not provided'}\n` +
              `Skills: ${user.skills?.join(', ') || 'Not provided'}\n` +
              `Experience: ${user.experience?.length || 0} years\n` +
              `Education: ${user.education?.map((e: any) => e.degree).join(', ') || 'Not provided'}`;

            // Add user context as a system message
            chatSession.addSystemMessage(userContext);
          }
        } catch (dbError) {
          console.error('Error fetching user context:', dbError);
          // Continue without user context if DB fetch fails
        }
      }

      if (sessionId) {
        chatSessions.set(sessionId, chatSession);
      }
    } else {
      // Update persona if changed
      chatSession.changePersona(persona as MentorPersona);
    }

    // Get response from the chatbot
    const response = await chatSession.sendMessage(message);

    return NextResponse.json({
      response,
      sessionId: sessionId || 'new-session',
      persona
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
