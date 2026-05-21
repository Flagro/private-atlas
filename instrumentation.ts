export async function register() {
  // `next build` can invoke this hook with NODE_ENV=production before deploy-time env is present
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionEnv } = await import("@/lib/env");
    assertProductionEnv();
  }
}
