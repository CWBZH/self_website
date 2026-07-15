"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function ConditionalNavbar({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/everyday_plan" || pathname === "/studio") {
    return null;
  }

  return <>{children}</>;
}
