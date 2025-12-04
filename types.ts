
/* =========================================================================
   CORE DOMAIN TYPES — Tối ưu hóa, immutable, strict
   ========================================================================= */

export interface TarotCard {
  readonly id: number | string; // Changed to match implementation (Date.now() + string)
  readonly name: string;
  readonly image: string;
  readonly isReversed: boolean;
}

export interface ChatMessage {
  readonly id: string;
  readonly role: "user" | "model";
  readonly text: string;
  readonly timestamp: number; // ms since epoch
}

export interface QuerentInfo {
  readonly name: string;
  readonly dob: string; // YYYY-MM-DD
  readonly gender: string;
}

export interface ReadingContext {
  readonly spreadName: string;
  readonly interpretationStyle: string;
  readonly positions: readonly string[];
}

export interface VisionConfig {
  readonly size: "1K" | "2K" | "4K";
  readonly aspectRatio: string; // e.g. "1:1", "16:9", ...
}

/* =========================================================================
   MODULE FLAG — Required for TS để tránh global pollution
   ========================================================================= */

export {};
