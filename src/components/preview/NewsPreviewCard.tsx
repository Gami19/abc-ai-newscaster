"use client";

import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";

type NewsPreviewCardProps = {
  scriptText: string;
  photoBase64: string;
};

export function NewsPreviewCard({
  scriptText,
  photoBase64,
}: NewsPreviewCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-abc-orange/30 shadow-sm">
      <CardContent className="space-y-4 p-4">
        <div className="rounded-lg bg-abc-orange px-3 py-2 text-center text-sm font-bold text-white">
          news おかえり 2035
        </div>

        <div className="relative mx-auto size-24 overflow-hidden rounded-full border-2 border-abc-orange">
          <Image
            src={photoBase64}
            alt="撮影した顔写真"
            fill
            unoptimized
            className="object-cover"
          />
        </div>

        <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/40 p-3 text-left text-base leading-relaxed text-abc-charcoal">
          {scriptText}
        </div>
      </CardContent>
    </Card>
  );
}
