function publicValue(name: string): string {
  return String(import.meta.env[name] ?? "").trim();
}

export const publicLegal = {
  name: publicValue("VITE_PUBLIC_LEGAL_NAME"),
  street: publicValue("VITE_PUBLIC_LEGAL_STREET"),
  postalCity: publicValue("VITE_PUBLIC_LEGAL_POSTAL_CITY"),
  managingDirector: publicValue("VITE_PUBLIC_MANAGING_DIRECTOR"),
  registerCourt: publicValue("VITE_PUBLIC_REGISTER_COURT"),
  registerNumber: publicValue("VITE_PUBLIC_REGISTER_NUMBER"),
  vatId: publicValue("VITE_PUBLIC_VAT_ID"),
  editorialResponsible: publicValue("VITE_PUBLIC_EDITORIAL_RESPONSIBLE"),
  legalEmail: publicValue("VITE_PUBLIC_LEGAL_EMAIL"),
  privacyEmail: publicValue("VITE_PUBLIC_PRIVACY_EMAIL"),
  dpoEmail: publicValue("VITE_PUBLIC_DPO_EMAIL"),
  supportPhone: publicValue("VITE_PUBLIC_SUPPORT_PHONE"),
  supportEmail: publicValue("VITE_PUBLIC_SUPPORT_EMAIL"),
};

export function legalAddressInline(): string {
  return [publicLegal.name, publicLegal.street, publicLegal.postalCity, "Deutschland"]
    .filter(Boolean)
    .join(", ");
}
