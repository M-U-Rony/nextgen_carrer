import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password");
        }

        try {
          await connectDB();

          const user = await User.findOne({ email: credentials.email }).select(
            "+password"
          );

          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password as string
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        try {
          await connectDB();

          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user for Google sign-in
            await User.create({
              name: user.name || "User",
              email: user.email,
              image: user.image || undefined,
              emailVerified: new Date(),
            });
          } else {
            // Update user data if needed
            if (user.name && !existingUser.name) {
              existingUser.name = user.name;
            }
            if (user.image && !existingUser.image) {
              existingUser.image = user.image;
            }
            await existingUser.save();
          }

          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - set user data from provider
      if (user) {
        token.id = user.id || token.sub || "";
        token.email = user.email || token.email || "";
        token.name = user.name || token.name || "";
        token.picture = user.image || token.picture || "";
      }

      // For Google OAuth, fetch user from database after first sign-in
      if (account?.provider === "google" && token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            // Update token with database user data if not already set
            if (!token.name && dbUser.name) {
              token.name = dbUser.name;
            }
            if (!token.picture && dbUser.image) {
              token.picture = dbUser.image;
            }
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Ensure session and user objects exist
      if (!session || !session.user) {
        return session;
      }

      // Safely assign token values to session
      if (token) {
        if (token.id) session.user.id = token.id as string;
        if (token.sub && !session.user.id) session.user.id = token.sub as string;
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} satisfies NextAuthConfig;

