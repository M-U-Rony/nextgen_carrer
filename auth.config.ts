import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const providers: Provider[] = [
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
          userType: user.userType,
        };
      } catch (error) {
        console.error("Authorization error:", error);
        throw error;
      }
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    })
  );
} else {
  console.warn(
    "Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET"
  );
}

export const authConfig = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        try {
          await connectDB();

          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
  
            await User.create({
              name: user.name || "User",
              email: user.email,
              image: user.image || undefined,
              emailVerified: new Date(),
              userType: "job_seeker", 
            });
          } else {
            
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
        // Set userType from user object if available (from credentials provider)
        if (user.userType) {
          token.userType = user.userType;
        }
        // Role selection removed
      }

      // Always ensure userType is set by fetching from database if missing
      if (!token.userType && token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser?.userType) {
            token.userType = dbUser.userType;
          } else {
            // Default to job_seeker if not set
            token.userType = "job_seeker";
          }
        } catch (error) {
          console.error("Error fetching userType in JWT callback:", error);
          // Default to job_seeker on error
          token.userType = "job_seeker";
        }
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
            // Always update userType from database for Google OAuth
            if (dbUser.userType) {
              token.userType = dbUser.userType;
            }
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      // Role selection removed - users default to job_seeker and can change in profile

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
        
        // Always ensure userType is set in session
        if (token.userType) {
          session.user.userType = token.userType as "job_seeker" | "employer";
        } else if (token.email) {
          // Fallback: fetch userType from database if not in token
          try {
            await connectDB();
            const dbUser = await User.findOne({ email: token.email });
            if (dbUser?.userType) {
              session.user.userType = dbUser.userType;
            } else {
              session.user.userType = "job_seeker"; // Default fallback
            }
          } catch (error) {
            console.error("Error fetching userType in session callback:", error);
            session.user.userType = "job_seeker"; // Default fallback on error
          }
        } else {
          session.user.userType = "job_seeker"; // Default fallback
        }
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

