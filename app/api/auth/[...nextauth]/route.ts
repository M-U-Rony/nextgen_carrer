import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Ensure Node.js runtime for NextAuth (avoids Edge runtime issues)
export const runtime = "nodejs";

