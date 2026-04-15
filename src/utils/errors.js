export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function createAppError(statusCode, message, details) {
  return new AppError(statusCode, message, details);
}
