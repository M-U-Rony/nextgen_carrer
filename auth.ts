import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.warn(
    "Warning: NEXTAUTH_SECRET is not set. This is required for production deployments."
  );
}

const nextAuth = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
  // Explicitly set the base URL for production
  trustHost: true, // Trust the host header (important for production)
});

export const { auth, signIn, signOut, handlers } = nextAuth;

