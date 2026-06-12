"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { FutureRadar } from "@/components/generating/FutureRadar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildDefaultScript } from "@/lib/prompts/defaultScript";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type { GenerateScriptOutput, UserInput } from "@/types";

type StepStatus = "pending" | "active" | "done";

const RETRY_DELAY_MS = 2000;
const COMPLETE_DELAY_MS = 600;

async function fetchScript(userInput: UserInput): Promise<string | null> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userInput),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GenerateScriptOutput;
  return data.script;
}

async function fetchAudio(scriptText: string): Promise<Blob | null> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: scriptText }),
  });

  if (!response.ok) {
    return null;
  }

  return response.blob();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function StatusLine({
  label,
  status,
}: {
  label: string;
  status: StepStatus;
}) {
  return (
    <p className="flex items-center gap-2 text-sm text-abc-charcoal">
      {status === "done" ? (
        <span aria-hidden>✅</span>
      ) : status === "active" ? (
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          aria-hidden
        >
          ⏳
        </motion.span>
      ) : (
        <span className="text-abc-gray" aria-hidden>
          ○
        </span>
      )}
      <span>
        {label}
        {status === "active" ? "生成中・・・" : ""}
      </span>
    </p>
  );
}

export function GeneratingView() {
  const router = useRouter();
  const userInput = useSessionStore((s) => s.userInput);
  const photoBase64 = useSessionStore((s) => s.photoBase64);
  const setScript = useSessionStore((s) => s.setScript);
  const setAudio = useSessionStore((s) => s.setAudio);

  const [progress, setProgress] = useState(0);
  const [scriptStatus, setScriptStatus] = useState<StepStatus>("active");
  const [ttsStatus, setTtsStatus] = useState<StepStatus>("pending");
  const [ttsError, setTtsError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    if (!userInput || !photoBase64) {
      router.replace("/");
      return;
    }

    hasStarted.current = true;

    const run = async () => {
      let script = await fetchScript(userInput);

      if (!script) {
        await sleep(RETRY_DELAY_MS);
        script = await fetchScript(userInput);
      }

      if (!script) {
        console.error("[GeneratingView] AI generation failed, using default script");
        script = buildDefaultScript(userInput);
      }

      setScript(script);
      setScriptStatus("done");
      setProgress(50);
      setTtsStatus("active");

      const audioBlob = await fetchAudio(script);

      if (!audioBlob) {
        setTtsStatus("pending");
        setTtsError("もう一度ためしてね！");
        return;
      }

      setAudio(audioBlob);
      setTtsStatus("done");
      setProgress(100);

      await sleep(COMPLETE_DELAY_MS);
      router.push("/preview");
    };

    void run();
  }, [userInput, photoBase64, router, setScript, setAudio]);

  if (ttsError) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="space-y-6 py-10 text-center">
          <p className="text-base text-abc-charcoal">{ttsError}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
            className="h-12"
          >
            もどる
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border shadow-sm">
        <CardContent className="space-y-8 py-8">
          <h1 className="text-center text-2xl font-bold text-abc-charcoal">
            AIが2035年を予測中...
          </h1>

          <FutureRadar />

          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Progress value={progress} className="h-3 bg-muted" />
            </motion.div>
            <p className="text-center text-sm font-medium text-abc-gray">
              {progress}%
            </p>
          </div>

          <div className="space-y-2">
            <StatusLine label="ニュース原稿を" status={scriptStatus} />
            <StatusLine label="音声を合成" status={ttsStatus} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
