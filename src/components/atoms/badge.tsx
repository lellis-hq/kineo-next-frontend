import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { BadgeTone } from "@/lib/ui-tokens";

export type BadgeSize = "sm" | "md" | "lg";

/** Tones map to the `.badge-*` classes of `globals.css`: only danger and success tint the label. */
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "badge",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  info: "badge badge-info",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "badge-sm",
  md: "badge-md",
  lg: "badge-lg",
};

export function Badge({
  tone = "neutral",
  size = "sm",
  variant = "boxed",
  className,
  children,
}: {
  tone?: BadgeTone;
  /** `sm` is the original tag, `md` the card's, `lg` a panel figure. */
  size?: BadgeSize;
  /** `plain` drops the box and keeps the label (table status, dense rows). */
  variant?: "boxed" | "plain";
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        TONE_CLASSES[tone],
        variant === "plain" ? "badge-plain" : SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
