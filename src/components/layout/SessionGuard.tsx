"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useSessionStore } from "@/lib/store/useSessionStore";
import type { SessionGuardField } from "@/types";

type SessionGuardProps = {
  require: SessionGuardField;
  children: ReactNode;
};

function useGuardValue(require: SessionGuardField) {
  return useSessionStore((state) => {
    switch (require) {
      case "userInput":
        return state.userInput;
      case "photoBase64":
        return state.photoBase64;
      case "scriptText":
        return state.scriptText;
      case "videoBlob":
        return state.videoBlob;
    }
  });
}

export function SessionGuard({ require, children }: SessionGuardProps) {
  const router = useRouter();
  const value = useGuardValue(require);
  const isAllowed = value !== null;

  useEffect(() => {
    if (!isAllowed) {
      router.replace("/");
    }
  }, [isAllowed, router]);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}
