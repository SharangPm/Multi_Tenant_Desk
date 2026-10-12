// Optional Redis/Bull integration. The service stays available when Redis is absent.
let queue;
export async function enqueueReminder(data) {
  if (!process.env.REDIS_URL) return false;
  try {
    const Bull = (await import('bull')).default;
    queue ||= new Bull('sla-reminders', process.env.REDIS_URL);
    await queue.add(data, { delay: 60 * 60 * 1000 });
    return true;
  } catch (error) {
    console.warn('SLA queue unavailable:', error.message);
    return false;
  }
}
