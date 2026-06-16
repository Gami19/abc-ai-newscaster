export type UserInput = {
  name: string;
  grade: string;
  dream: string;
  hobby: string;
};

export type GenerateRequestBody = UserInput;

export type GenerateScriptInput = UserInput;

export type DreamCategory =
  | "sports"
  | "space"
  | "creative"
  | "care"
  | "food"
  | "default";

export type GenerateScriptOutput = {
  script: string;
  category: DreamCategory;
};

export type GenerateScriptResult = GenerateScriptOutput;

export type AIProvider = "openai" | "azure" | "bedrock";

export type AIProviderInterface = {
  generateScript(input: GenerateScriptInput): Promise<GenerateScriptResult>;
};

export type TtsProvider = "openai" | "azure";

export type TtsSynthesisResult = {
  audio: ArrayBuffer;
  contentType: string;
  /** browser-speech: 固定音声ではなくブラウザ読み上げを使う（モック用） */
  playback?: "blob" | "browser-speech";
};

export type TtsProviderInterface = {
  synthesizeSpeech(text: string): Promise<TtsSynthesisResult>;
};

export type TtsRequestBody = {
  text: string;
};

export type ApiErrorResponse = {
  error: string;
};

export const GRADE_OPTIONS = [
  { label: "小1", value: "小学1年生" },
  { label: "小2", value: "小学2年生" },
  { label: "小3", value: "小学3年生" },
  { label: "小4", value: "小学4年生" },
  { label: "小5", value: "小学5年生" },
  { label: "小6", value: "小学6年生" },
] as const;

export const GRADES = GRADE_OPTIONS.map((g) => g.value);

export type GradeValue = (typeof GRADE_OPTIONS)[number]["value"];

export type RecordingMode = "solo" | "together";

export type SessionGuardField =
  | "userInput"
  | "photoBase64"
  | "scriptText"
  | "userVoiceVideoBlob";

export type ExperienceStep = 1 | 2 | 3 | 4 | 5 | 6;

export type BroadcastPhase =
  | "standby"
  | "choosing"
  | "countdown"
  | "onair"
  | "review"
  | "ended";

export type ScriptSegment = {
  text: string;
  startRatio: number;
  endRatio: number;
};

export type DrawFrameCallback = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement
) => void;
