import GB from "country-flag-icons/react/3x2/GB";
import DE from "country-flag-icons/react/3x2/DE";
import TR from "country-flag-icons/react/3x2/TR";
import PK from "country-flag-icons/react/3x2/PK";
import IN from "country-flag-icons/react/3x2/IN";
import SA from "country-flag-icons/react/3x2/SA";
import IQ from "country-flag-icons/react/3x2/IQ";
import IR from "country-flag-icons/react/3x2/IR";
import RU from "country-flag-icons/react/3x2/RU";
import UA from "country-flag-icons/react/3x2/UA";
import PL from "country-flag-icons/react/3x2/PL";
import CN from "country-flag-icons/react/3x2/CN";
import type { LangCode } from "@/i18n/config";
import { cn } from "@/lib/utils";

const MAP: Record<LangCode, React.ComponentType<{ title?: string; className?: string }>> = {
  de: DE, en: GB, tr: TR, ur: PK, hi: IN, pa: IN,
  ar: SA, ku: IQ, fa: IR, ru: RU, uk: UA, pl: PL, zh: CN,
};

/**
 * Renders a real SVG country flag for a supported language code.
 * Uses a subtle inner ring so the flag reads as a chip on any surface —
 * no more tofu boxes on browsers without emoji flag glyphs (Chrome/Windows).
 */
export function LangFlag({
  code, className, title,
}: { code: LangCode; className?: string; title?: string }) {
  const Flag = MAP[code];
  if (!Flag) return null;
  return (
    <span
      className={cn(
        "inline-block h-4 w-6 shrink-0 overflow-hidden rounded-[3px] shadow-[inset_0_0_0_1px_oklch(0_0_0/0.08)]",
        className,
      )}
      aria-hidden={title ? undefined : true}
    >
      <Flag title={title} className="h-full w-full object-cover" />
    </span>
  );
}
