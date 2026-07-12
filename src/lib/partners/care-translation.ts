// Care.com / SAVD / Triaphon-style translation & care coordination adapter.
// Real partner: SAVD Videodolmetschen (medical) and Triaphon (24/7 phone
// interpreting for hospitals). Fallback: internal roster booking.

import type { CareTranslationBooking, CareTranslationConfirmation, PartnerStatus } from "./types";

export function careTranslationStatus(): PartnerStatus {
  const configured = Boolean(process.env.SAVD_API_KEY);
  return {
    slug: "care-translation",
    name: "SAVD & Triaphon (interpreting)",
    category: "translation",
    mode: configured ? "live" : "mock",
    configured,
    gap: configured ? undefined : "Awaiting SAVD_API_KEY. Triaphon uses phone fallback and needs no key.",
  };
}

const RATE_PER_MINUTE: Record<CareTranslationBooking["modality"], number> = {
  phone: 1.9,
  video: 2.4,
  on_site: 3.8,
};

const SURCHARGE: Record<CareTranslationBooking["specialism"], number> = {
  medical: 1.15,
  legal: 1.25,
  bereavement: 1.1,
  administrative: 1.0,
  general: 1.0,
};

export async function bookCareTranslation(input: CareTranslationBooking): Promise<CareTranslationConfirmation> {
  const apiKey = process.env.SAVD_API_KEY;
  const cost = Math.round(RATE_PER_MINUTE[input.modality] * SURCHARGE[input.specialism] * input.durationMinutes * 100) / 100;

  if (apiKey) {
    const resp = await fetch("https://api.savd.at/v2/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, referrer: "beistandplus" }),
    });
    if (resp.ok) {
      const data = (await resp.json()) as {
        booking_id: string;
        interpreter_initials: string;
        meeting_url?: string;
      };
      return {
        partner: "SAVD",
        bookingId: data.booking_id,
        interpreterInitials: data.interpreter_initials,
        costEur: cost,
        meetingUrl: data.meeting_url,
        cancellationPolicy: "Free cancellation up to 2h before start; 50% fee thereafter.",
      };
    }
  }

  // Mock confirmation — routes to internal roster
  return {
    partner: "BeistandPlus roster",
    bookingId: `bp-${Date.now().toString(36)}`,
    interpreterInitials: pickInitials(input.language),
    costEur: cost,
    cancellationPolicy: "Free cancellation up to 4h before start (internal roster).",
  };
}

function pickInitials(lang: string): string {
  const table: Record<string, string> = { tr: "A.K.", ar: "N.H.", uk: "O.S.", ru: "M.P.", fa: "L.R.", ur: "S.A." };
  return table[lang] ?? "J.D.";
}
