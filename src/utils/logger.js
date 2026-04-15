const LEVELS = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR"
};

function serializeMeta(meta = {}) {
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return "";
  }

  return ` ${JSON.stringify(Object.fromEntries(entries))}`;
}

function write(level, message, meta) {
  const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
  const line = `[${new Date().toISOString()}] [${LEVELS[level]}] ${message}${serializeMeta(meta)}`;
  console[method](line);
}

export const logger = {
  debug(message, meta) {
    write("debug", message, meta);
  },
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  }
};
