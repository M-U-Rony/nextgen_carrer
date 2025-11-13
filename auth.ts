import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const nextAuth = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
});

export const { auth, signIn, signOut, handlers } = nextAuth;

