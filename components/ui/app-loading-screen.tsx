"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type AppLoadingScreenProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function AppLoadingScreen({
  title = "Loading QueryWhisper",
  subtitle = "Preparing your workspace…",
  className,
}: AppLoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background",
        className
      )}
    >
      {/* Soft background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-highlight/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[26rem] w-[26rem] rounded-full bg-alt_color_a/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-foreground_alt/30 blur-xl" />
          <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-foreground_alt/70 bg-background_alt/70 shadow-md">
            <Image
              src="/qlogo.jpg"
              alt="QueryWhisper"
              fill
              sizes="96px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground_alt border-t-accent" />
            <p className="text-base font-semibold tracking-tight text-primary">
              {title}
            </p>
          </div>
          <p className="text-sm text-secondary">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
