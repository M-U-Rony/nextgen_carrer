import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  parts: string;
}

export type MentorPersona = 'career' | 'technical' | 'general';

export class ChatbotMentor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any;
  private chatHistory: ChatMessage[] = [];
  private persona: MentorPersona = 'career';
  private systemPrompt: string = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chatInstance: any = null;

  constructor(persona: MentorPersona = 'career') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.setPersona(persona);
  }

  private setPersona(persona: MentorPersona): void {
    this.persona = persona;
    const personaPrompts = {
      career: "You are a career advisor with 20+ years of experience. Provide concise, actionable advice on career growth, job search, and professional development.",
      technical: "You are a senior technical mentor. Provide clear, code-focused guidance on programming, system design, and technical career growth.",
      general: "You are a wise life coach. Provide thoughtful, empathetic advice on work-life balance, productivity, and personal development."
    };

    this.systemPrompt = personaPrompts[persona];
    this.chatHistory = [];
    this.chatInstance = null; // Reset chat instance when persona changes
  }

  public addSystemMessage(content: string): void {
    // Add to system prompt instead of chat history
    // Multiple system messages will be combined
    if (this.systemPrompt && this.systemPrompt !== content) {
      this.systemPrompt += '\n\n' + content;
    } else if (!this.systemPrompt) {
      this.systemPrompt = content;
    }
    // Reset chat instance to apply new system instruction
    this.chatInstance = null;
  }

  public async sendMessage(message: string): Promise<string> {
    try {
      // Initialize or reuse chat instance
      if (!this.chatInstance) {
        // Format chat history (previous exchanges only, excluding current message)
        const history = this.chatHistory
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.parts }]
          }));

        // Start chat with system instruction and history
        // systemInstruction must be a Content object with parts, not a plain string
        const startChatConfig: {
          history: Array<{ role: string; parts: Array<{ text: string }> }>;
          systemInstruction?: { parts: Array<{ text: string }> };
          generationConfig: { maxOutputTokens: number; temperature: number };
        } = {
          history: history,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        };

        // Only add systemInstruction if we have a system prompt
        if (this.systemPrompt) {
          startChatConfig.systemInstruction = {
            parts: [{ text: this.systemPrompt }]
          };
        }

        this.chatInstance = this.model.startChat(startChatConfig);
      }

      // Send the current message
      const result = await this.chatInstance.sendMessage(message);
      const response = await result.response;
      const responseText = response.text();

      // Add user message and model response to history
      this.chatHistory.push({
        role: 'user',
        parts: message
      });

      this.chatHistory.push({
        role: 'model',
        parts: responseText
      });

      return responseText;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      // Log the actual error details
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        throw new Error(`Failed to get response from the AI mentor: ${error.message}`);
      }
      throw new Error('Failed to get response from the AI mentor: Unknown error');
    }
  }

  public changePersona(persona: MentorPersona): void {
    // Only change persona if it's actually different
    if (this.persona !== persona) {
      this.setPersona(persona);
    }
  }

  public clearHistory(): void {
    this.chatHistory = [];
    this.chatInstance = null; // Reset chat instance
  }

  public loadHistory(messages: Array<{ role: 'user' | 'assistant' | 'model'; text: string }>): void {
    // Clear existing history
    this.chatHistory = [];
    // Reset chat instance so history will be reloaded
    this.chatInstance = null;
    
    // Load messages into history
    messages.forEach((msg) => {
      this.chatHistory.push({
        role: msg.role === 'assistant' ? 'model' : (msg.role === 'model' ? 'model' : 'user'),
        parts: msg.text
      });
    });
  }

  public getHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }
}

/**
 * Generate text using Gemini API (for one-off text generation)
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
  }
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const generationConfig = {
      temperature: options?.temperature ?? 0.8,
      maxOutputTokens: options?.maxOutputTokens ?? 2048,
    };

    const config: {
      contents: Array<{ role: string; parts: Array<{ text: string }> }>;
      systemInstruction?: string | { role: string; parts: Array<{ text: string }> };
      generationConfig: typeof generationConfig;
    } = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    };

    // Add system instruction if provided (as string or Content object)
    if (systemInstruction) {
      // Use string format for systemInstruction (Gemini API accepts strings)
      config.systemInstruction = systemInstruction;
    }

    const result = await model.generateContent(config);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in generateText:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate text: ${error.message}`);
    }
    throw new Error('Failed to generate text: Unknown error');
  }
}

// The ChatbotMentor class is now ready to be used in your application
// Example usage in a Next.js API route:
/*
async function handleChat(message: string, persona: MentorPersona = 'career') {
  const mentor = new ChatbotMentor(persona);
  try {
    return await mentor.sendMessage(message);
  } catch (error) {
    console.error('Error in chat:', error);
    throw error;
  }
}
*/
