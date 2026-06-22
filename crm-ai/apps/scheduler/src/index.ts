import { ReminderAgent } from "@crm-ai/ai";
import { logger } from "@crm-ai/logger";

const DEADLINE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const REMINDER_PROCESS_INTERVAL_MS = 15 * 60 * 1000;

async function main() {
  const reminderAgent = new ReminderAgent();

  logger.info("Scheduler started");

  const checkDeadlines = async () => {
    try {
      logger.info("Running deadline check...");
      await reminderAgent.checkDeadlines();
      logger.info("Deadline check complete");
    } catch (err) {
      logger.error({ err }, "Deadline check failed");
    }
  };

  const processDueReminders = async () => {
    try {
      logger.info("Processing due reminders...");
      await reminderAgent.processDueReminders();
      logger.info("Due reminders processed");
    } catch (err) {
      logger.error({ err }, "Process due reminders failed");
    }
  };

  await checkDeadlines();
  setInterval(checkDeadlines, DEADLINE_CHECK_INTERVAL_MS);

  await processDueReminders();
  setInterval(processDueReminders, REMINDER_PROCESS_INTERVAL_MS);

  logger.info(
    {
      deadlineCheckIntervalMin: DEADLINE_CHECK_INTERVAL_MS / 60000,
      reminderProcessIntervalMin: REMINDER_PROCESS_INTERVAL_MS / 60000,
    },
    "Scheduler running"
  );

  process.on("SIGTERM", () => {
    logger.info("Scheduler shutting down (SIGTERM)");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    logger.info("Scheduler shutting down (SIGINT)");
    process.exit(0);
  });
}

main();
