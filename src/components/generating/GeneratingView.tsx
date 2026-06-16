"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { FutureRadar } from "@/components/generating/FutureRadar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildDefaultScript } from "@/lib/prompts/defaultScript";
import { primeSpeechVoices } from "@/lib/tts/clientSpeech";
import { detectCategory } from "@/lib/theme/dreamTheme";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type { GenerateScriptOutput, UserInput } from "@/types";

type StepStatus = "pending" | "active" | "done";

const RETRY_DELAY_MS = 2000;
const COMPLETE_DELAY_MS = 800;

const SCRIPT_MESSAGES: Record<StepStatus, string> = {
  pending: "つぎは、ABCフォーマットで原稿をつくるよ",
  active: "ABCフォーマットで原稿を生成中...",
  done: "原稿、できた！",
};

const TTS_MESSAGES: Record<StepStatus, string> = {
  pending: "つぎは、キャスターの声を準備するよ",
  active: "ABCキャスター風の声でおてほんをじゅんびしています...",
  done: "声の準備、OK！",
};

async function fetchScript(
  userInput: UserInput
): Promise<GenerateScriptOutput | null> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userInput),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GenerateScriptOutput;
  return data;
}

async function fetchAudio(
  scriptText: string
): Promise<{ blob: Blob | null; useBrowserSpeech: boolean }> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: scriptText }),
  });

  if (!response.ok) {
    return { blob: null, useBrowserSpeech: false };
  }

  const useBrowserSpeech =
    response.headers.get("X-Tts-Playback") === "browser-speech";

  if (useBrowserSpeech) {
    return { blob: null, useBrowserSpeech: true };
  }

  return { blob: await response.blob(), useBrowserSpeech: false };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function StatusLine({
  message,
  status,
}: {
  message: string;
  status: StepStatus;
}) {
  return (
    <motion.p
      layout
      className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5 text-base text-abc-charcoal"
      aria-live={status === "active" ? "polite" : undefined}
    >
      {status === "done" ? (
        <span className="text-xl" aria-hidden>
          ✅
        </span>
      ) : status === "active" ? (
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-xl"
          aria-hidden
        >
          ✨
        </motion.span>
      ) : (
        <span className="text-lg text-abc-gray" aria-hidden>
          ⏸️
        </span>
      )}
      <span className="leading-snug">{message}</span>
    </motion.p>
  );
}

function getHeadline(
  _name: string,
  scriptStatus: StepStatus,
  ttsStatus: StepStatus
): string {
  if (scriptStatus !== "done") {
    return `news おかえり 2035年版、\nせいさく中...`;
  }
  if (ttsStatus !== "done") {
    return `もうすこし！\nABCキャスター風の声を\nじゅんびしてるよ…`;
  }
  return `できた！\n放送室へ向かうよ…`;
}

function getEncouragement(progress: number): string {
  if (progress < 30) return "2035年の世界をえがいてるよ…";
  if (progress < 55) return "ABCフォーマットで原稿を整えてるよ…";
  if (progress < 90) return "キャスターのお手本を準備してるよ…";
  return "まもなく完成！";
}

export function GeneratingView() {
  const router = useRouter();
  const userInput = useSessionStore((s) => s.userInput);
  const photoBase64 = useSessionStore((s) => s.photoBase64);
  const setScript = useSessionStore((s) => s.setScript);
  const setDreamCategory = useSessionStore((s) => s.setDreamCategory);
  const setAudio = useSessionStore((s) => s.setAudio);
  const setUseBrowserSpeechForTts = useSessionStore(
    (s) => s.setUseBrowserSpeechForTts
  );

  useEffect(() => {
    primeSpeechVoices();
  }, []);

  const [progress, setProgress] = useState(8);
  const [scriptStatus, setScriptStatus] = useState<StepStatus>("active");
  const [ttsStatus, setTtsStatus] = useState<StepStatus>("pending");
  const [ttsError, setTtsError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const casterName = userInput?.name ?? "きみ";

  useEffect(() => {
    if (scriptStatus !== "active") return;

    const id = setInterval(() => {
      setProgress((current) => Math.min(current + 1, 48));
    }, 350);

    return () => clearInterval(id);
  }, [scriptStatus]);

  useEffect(() => {
    if (ttsStatus !== "active") return;

    const id = setInterval(() => {
      setProgress((current) => Math.min(current + 1, 92));
    }, 400);

    return () => clearInterval(id);
  }, [ttsStatus]);

  useEffect(() => {
    if (hasStarted.current) return;
    if (!userInput || !photoBase64) {
      router.replace("/");
      return;
    }

    hasStarted.current = true;
    setProgress(12);

    const run = async () => {
      let result = await fetchScript(userInput);

      if (!result) {
        setProgress(25);
        await sleep(RETRY_DELAY_MS);
        result = await fetchScript(userInput);
      }

      let script: string;
      if (!result) {
        console.error("[GeneratingView] AI generation failed, using default script");
        script = buildDefaultScript(userInput);
        setDreamCategory(detectCategory(userInput.dream));
      } else {
        script = result.script;
        setDreamCategory(result.category);
      }

      setScript(script);
      setScriptStatus("done");
      setProgress(55);
      setTtsStatus("active");

      const { blob: audioBlob, useBrowserSpeech } = await fetchAudio(script);

      if (!audioBlob && !useBrowserSpeech) {
        setTtsStatus("pending");
        setTtsError(
          "ごめんね、声の準備がうまくいかなかったよ。もう一度やってみてね！"
        );
        return;
      }

      setUseBrowserSpeechForTts(useBrowserSpeech);
      if (audioBlob) {
        setAudio(audioBlob);
      }
      setTtsStatus("done");
      setProgress(100);

      await sleep(COMPLETE_DELAY_MS);
      router.push("/rehearsal");
    };

    void run();
  }, [
    userInput,
    photoBase64,
    router,
    setScript,
    setDreamCategory,
    setAudio,
    setUseBrowserSpeechForTts,
  ]);

  const headline = useMemo(
    () => getHeadline(casterName, scriptStatus, ttsStatus),
    [casterName, scriptStatus, ttsStatus]
  );

  const encouragement = useMemo(() => getEncouragement(progress), [progress]);

  if (ttsError) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="space-y-6 py-10 text-center">
          <p className="text-4xl" aria-hidden>
            😢
          </p>
          <p className="text-base leading-relaxed text-abc-charcoal">
            {ttsError}
          </p>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => router.push("/camera")}
              className="h-12 bg-abc-red text-white hover:bg-abc-red/90"
            >
              もう一度ためす
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="h-12"
            >
              最初からやりなおす
            </Button>
          </div>
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
        <CardContent className="space-y-6 py-8">
          <AnimatePresence mode="wait">
            <motion.h1
              key={headline}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="whitespace-pre-line text-center text-xl font-bold leading-snug text-abc-charcoal sm:text-2xl"
            >
              {headline}
            </motion.h1>
          </AnimatePresence>

          <FutureRadar />

          <div className="space-y-2">
            <Progress value={progress} className="h-4 bg-muted" />
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium text-abc-orange">{encouragement}</p>
              <p className="font-bold text-abc-charcoal">{progress}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <StatusLine message={SCRIPT_MESSAGES[scriptStatus]} status={scriptStatus} />
            <StatusLine message={TTS_MESSAGES[ttsStatus]} status={ttsStatus} />
          </div>

          <p className="text-center text-sm text-abc-gray">
            ちょっと待ってね。できたら自動でつぎへ進むよ 📺
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
