import app from "./app.js";
import { logger } from "./utils/logger.js";

const port = Number(process.env.PORT) || 5000;

app.listen(port, "0.0.0.0", () => {
  logger.info("Server started.", { port });
});
