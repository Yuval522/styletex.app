/**
 * The only two people allowed to have a Styletex Kitchens login. Shared
 * between the seed script (prisma/seed.ts) and the sign-up flow
 * (actions/auth.ts) so there is exactly one place that defines who is
 * authorized to register an account.
 */
export const TEAM_ACCOUNTS = [
  { name: "Yuval", email: "yuvalro123@gmail.com" },
  { name: "Itamar", email: "itamarknaan@gmail.com" },
] as const;

export function findTeamAccount(email: string) {
  const normalized = email.trim().toLowerCase();
  return TEAM_ACCOUNTS.find((a) => a.email === normalized);
}
