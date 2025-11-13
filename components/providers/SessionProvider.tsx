"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { AuthProvider } from "@/hooks/useAuth";
import { ReactNode } from "react";

export default function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <NextAuthSessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </NextAuthSessionProvider>
  );
}

