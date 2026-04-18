import "dotenv/config";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import leadRoutes from "./routes/leadRoutes.js";
import { AppError } from "./utils/errors.js";
import { logger } from "./utils/logger.js";

function buildCorsOptions() {
  const origins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return { origin: true, credentials: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || origins.includes(origin) || origin.includes("invoaura-crm.web.app") || origin.includes("invoaura-crm.firebaseapp.com")) {
        callback(null, true);
        return;
      }

      callback(new AppError(403, `Origin not allowed by CORS: ${origin}`));
    },
    credentials: true
  };
}

const app = express();

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("x-request-id", req.requestId);

  const startedAt = Date.now();
  logger.info("Incoming request.", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl
  });

  res.on("finish", () => {
    logger.info("Request completed.", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
});

app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ai-lead-generation-engine-backend",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", leadRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found."
  });
});

app.use((error, req, res, next) => {
  const isJsonParseError =
    error?.type === "entity.parse.failed" ||
    (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, "body"));

  const normalizedError = isJsonParseError
    ? new AppError(400, "Invalid JSON request body.")
    : error;

  const statusCode = normalizedError instanceof AppError ? normalizedError.statusCode : 500;

  logger.error("Unhandled request error.", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: normalizedError.message
  });

  res.status(statusCode).json({
    status: "error",
    message:
      statusCode >= 500 && !(normalizedError instanceof AppError)
        ? "Internal server error."
        : normalizedError.message,
    details: normalizedError instanceof AppError ? normalizedError.details : undefined,
    requestId: req.requestId
  });
});

export default app;
