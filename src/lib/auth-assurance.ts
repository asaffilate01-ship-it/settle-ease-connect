export type AuthClaims = Record<string, unknown> | null | undefined;

export function hasAal2(claims: AuthClaims): boolean {
  return claims?.aal === "aal2";
}
