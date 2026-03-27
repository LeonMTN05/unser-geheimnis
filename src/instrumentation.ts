export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamischer Import verhindert, dass node-cron in Edge-Runtime-Builds analysiert wird
    const { initCleanupScheduler } = await import('./server/cleanup');
    initCleanupScheduler();
  }
}
