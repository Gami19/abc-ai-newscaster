"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { isResultReady, useSessionStore } from "@/lib/store/useSessionStore";
import type { SessionGuardField } from "@/types";

type SessionGuardProps = {
  require: SessionGuardField;
  children: ReactNode;
};

function useGuardAllowed(require: SessionGuardField): boolean {
  return useSessionStore((state) => {
    switch (require) {
      case "userInput":
        return state.userInput !== null;
      case "photoBase64":
        return state.photoBase64 !== null;
      case "scriptText":
        return state.scriptText !== null;
      case "videoBlob":
        return state.videoBlob !== null;
      case "resultReady":
        return isResultReady(state);
    }
  });
}

export function SessionGuard({ require, children }: SessionGuardProps) {
  const router = useRouter();
  const isAllowed = useGuardAllowed(require);

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
