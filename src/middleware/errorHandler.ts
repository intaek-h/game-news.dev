import { Context, Next } from "@hono/hono";

// Custom error class for application errors
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error("Error caught in middleware:", error);

    if (error instanceof AppError) {
      return c.json({ error: error.message, statusCode: error.statusCode });
    }

    // Default error handling
    return c.json({ error: "Internal server error" }, 500);
  }
}
