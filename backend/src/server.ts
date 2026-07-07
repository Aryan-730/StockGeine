import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  await connectDB();
  app.listen(env.PORT, () => {
    logger.info(`StockGenie API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap().catch((error) => {
  logger.error("Failed to start server", { error: (error as Error).message });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason });
});
