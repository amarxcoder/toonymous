import { prisma } from "../lib/prisma";

// One-off internal tool: promote an account to moderator or
// complianceOfficer. There is no self-service or API path to acquire a
// role, by design - these are internal-only tools (Phase 5).
async function main() {
  const [, , email, role] = process.argv;
  if (!email || !["user", "moderator", "complianceOfficer"].includes(role ?? "")) {
    console.error("usage: npm run set-role -- <email> <user|moderator|complianceOfficer>");
    process.exitCode = 1;
    return;
  }
  const user = await prisma.user.update({
    where: { email },
    data: { role: role as "user" | "moderator" | "complianceOfficer" },
  });
  console.log(`${user.handle} (${user.email}) is now ${user.role}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
