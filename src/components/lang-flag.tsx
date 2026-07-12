import GB from "country-flag-icons/react/3x2/GB";
import DE from "country-flag-icons/react/3x2/DE";
import TR from "country-flag-icons/react/3x2/TR";
import PK from "country-flag-icons/react/3x2/PK";
import IN from "country-flag-icons/react/3x2/IN";
import AF from "country-flag-icons/react/3x2/AF";
import SA from "country-flag-icons/react/3x2/SA";
import IQ from "country-flag-icons/react/3x2/IQ";
import RU from "country-flag-icons/react/3x2/RU";
import UA from "country-flag-icons/react/3x2/UA";
import AL from "country-flag-icons/react/3x2/AL";
import SO from "country-flag-icons/react/3x2/SO";
import ER from "country-flag-icons/react/3x2/ER";
import BR from "country-flag-icons/react/3x2/BR";
import BA from "country-flag-icons/react/3x2/BA";
import HR from "country-flag-icons/react/3x2/HR";
import RS from "country-flag-icons/react/3x2/RS";
import VN from "country-flag-icons/react/3x2/VN";
import FR from "country-flag-icons/react/3x2/FR";
import type { LangCode } from "@/i18n/config";
import { cn } from "@/lib/utils";

const MAP: Record<LangCode, React.ComponentType<{ title?: string; className?: string }>> = {
  en: GB, de: DE, tr: TR, ur: PK, hi: IN, pa: IN,
  ps: AF, ar: SA, ku: IQ, ru: RU, uk: UA,
  sq: AL, so: SO, ti: ER, "pt-BR": BR, bs: BA, hr: HR, sr: RS, vi: VN, fr: FR,
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
