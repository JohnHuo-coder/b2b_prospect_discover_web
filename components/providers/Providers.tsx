"use client";

import { type ReactNode } from "react";
import { UserProvider } from "@/components/providers/UserProvider";

export function Providers({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
