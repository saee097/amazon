import { NextRequest } from "next/server";
import { jsonError } from "./response";

export function validateJson<T extends Record<string, unknown>>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<{ data: T | null; error: ReturnType<typeof jsonError> | null }> {
  return new Promise((resolve) => {
    request
      .json()
      .then((body) => {
        try {
          const data = schema.parse(body);
          resolve({ data, error: null });
        } catch (err) {
          const message =
            err instanceof Error && err.message
              ? err.message
              : "Validation failed";
          resolve({ data: null, error: jsonError(message, 400) });
        }
      })
      .catch(() => {
        resolve({ data: null, error: jsonError("Invalid JSON body", 400) });
      });
  });
}
