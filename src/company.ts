function publicValue(name: string): string {
  const values = import.meta.env as Record<string, string | undefined>;
  return values[name]?.trim() ?? "";
}

export const company = {
  legalName: publicValue("VITE_PUBLIC_LEGAL_NAME"),
  streetAddress: publicValue("VITE_PUBLIC_LEGAL_STREET"),
  postalCity: publicValue("VITE_PUBLIC_LEGAL_POSTAL_CITY"),
  managingDirector: publicValue("VITE_PUBLIC_MANAGING_DIRECTOR"),
  registerCourt: publicValue("VITE_PUBLIC_REGISTER_COURT"),
  registerNumber: publicValue("VITE_PUBLIC_REGISTER_NUMBER"),
  vatId: publicValue("VITE_PUBLIC_VAT_ID"),
  editorialResponsible: publicValue("VITE_PUBLIC_EDITORIAL_RESPONSIBLE"),
  supportPhone: publicValue("VITE_PUBLIC_SUPPORT_PHONE"),
  legalEmail: publicValue("VITE_PUBLIC_LEGAL_EMAIL") || "legal@beistandplus.de",
  privacyEmail: publicValue("VITE_PUBLIC_PRIVACY_EMAIL") || "privacy@beistandplus.de",
  dpoEmail: publicValue("VITE_PUBLIC_DPO_EMAIL"),
};

export const missingLegalIdentityFields = [
  ["legal company name", company.legalName],
  ["registered street address", company.streetAddress],
  ["postal code and city", company.postalCity],
  ["managing director", company.managingDirector],
  ["register court", company.registerCourt],
  ["register number", company.registerNumber],
  ["editorially responsible person", company.editorialResponsible],
]
  .filter(([, value]) => !value)
  .map(([label]) => label);

export function legalOperatorLabel(): string {
  return company.legalName || "the operator identified in the Impressum";
}
