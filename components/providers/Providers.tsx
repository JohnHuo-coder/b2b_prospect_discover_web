"use client";

import { type ReactNode } from "react";
import { ConfigVersionProvider } from "@/components/providers/ConfigVersionProvider";
import { UserProvider } from "@/components/providers/UserProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <ConfigVersionProvider>{children}</ConfigVersionProvider>
    </UserProvider>
  );
}
