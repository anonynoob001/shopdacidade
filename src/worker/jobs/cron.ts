// Shop Carajás - Scheduled Automated Tasks (Cloudflare Cron Triggers compatible)
import { DatabaseAdapter } from '../db';

export async function runCronTasks(db: DatabaseAdapter): Promise<{ expiredQuotes: number; expiredSessions: number; updatedSubscriptions: number }> {
  console.log('[Shop Carajás Cron] Running scheduled marketplace automation tasks...');

  // 1. Expire unaddressed quote requests older than 7 days
  const quoteResult = await db.prepare(`
    UPDATE quote_requests
    SET status = 'expired', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'pending' AND created_at < datetime('now', '-7 days')
  `).run();

  // 2. Cleanup expired authentication sessions
  const sessionResult = await db.prepare(`
    DELETE FROM sessions
    WHERE expires_at < CURRENT_TIMESTAMP
  `).run();

  // 3. Mark expired user subscriptions as 'past_due'
  const subResult = await db.prepare(`
    UPDATE user_subscriptions
    SET status = 'past_due'
    WHERE status = 'active' AND expires_at < CURRENT_TIMESTAMP
  `).run();

  // 4. Deactivate outdated promotional banners
  await db.prepare(`
    UPDATE promotional_banners
    SET is_active = 0
    WHERE end_date IS NOT NULL AND end_date < date('now')
  `).run();

  console.log('[Shop Carajás Cron] Completed scheduled tasks successfully.');
  return {
    expiredQuotes: quoteResult.meta?.changes || 0,
    expiredSessions: sessionResult.meta?.changes || 0,
    updatedSubscriptions: subResult.meta?.changes || 0
  };
}
