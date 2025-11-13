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
            userType: user.userType,
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
            // Create new user for Google sign-in (default to job_seeker)
            // New Google users will be prompted to select their role
            const newUser = await User.create({
              name: user.name || "User",
              email: user.email,
              image: user.image || undefined,
              emailVerified: new Date(),
              userType: "job_seeker", // Default for Google OAuth, can be changed
            });
            // Store flag in user object to indicate new Google user
            (user as any).isNewGoogleUser = true;
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
        // Set userType from user object if available (from credentials provider)
        if (user.userType) {
          token.userType = user.userType;
        }
        // Track if this is a new Google user who needs role selection
        if ((user as any).isNewGoogleUser) {
          (token as any).needsRoleSelection = true;
        }
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

      // Always check if user needs role selection (for both initial sign-in and token refresh)
      if (token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            // Check if user needs role selection (new Google user with default job_seeker role)
            // Only set needsRoleSelection if:
            // 1. User was created recently (within last 10 minutes)
            // 2. User has no password (indicating Google OAuth)
            // 3. User has default job_seeker role
            // 4. User hasn't updated their profile since creation (meaning they haven't selected a role yet)
            if (dbUser.createdAt && !dbUser.password) {
              const createdAt = new Date(dbUser.createdAt);
              const updatedAt = dbUser.updatedAt ? new Date(dbUser.updatedAt) : createdAt;
              const now = new Date();
              const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
              
              // Check if user has been updated since creation (indicates they've selected a role)
              // If updatedAt is more than 10 seconds after createdAt, user has made changes
              const hasBeenUpdated = updatedAt.getTime() > createdAt.getTime() + 10000; // 10 seconds buffer
              
              // Only set needsRoleSelection for new Google users who:
              // - Were created recently (within 10 minutes)
              // - Have the default job_seeker role
              // - Haven't updated their profile yet (meaning they haven't visited role selection page)
              if (
                minutesSinceCreation < 10 && 
                dbUser.userType === "job_seeker" && 
                !hasBeenUpdated
              ) {
                (token as any).needsRoleSelection = true;
              } else {
                // Clear the flag if:
                // - User has updated their profile (selected a role)
                // - User is an employer (explicitly selected employer)
                // - User is not a new user
                (token as any).needsRoleSelection = false;
              }
            } else {
              // Clear the flag if user has a password (not a Google OAuth user)
              (token as any).needsRoleSelection = false;
            }
          }
        } catch (error) {
          console.error("Error checking needsRoleSelection in JWT callback:", error);
          // Default to false on error
          (token as any).needsRoleSelection = false;
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

        // Pass needsRoleSelection flag to session
        if ((token as any).needsRoleSelection) {
          (session.user as any).needsRoleSelection = true;
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

