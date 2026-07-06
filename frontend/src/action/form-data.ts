// This module is a shared helper used by Server Actions and by client-side
// react-hook-form adapters. It intentionally has NO "use server" directive
// because `formatZodErrors` is a synchronous pure helper and Next.js requires
// every export from a "use server" file to be an async function.
import { z, ZodTypeAny } from "zod";

/**
 * Convert a FormData payload into a plain object using a Zod schema.
 *
 * For each key in the schema's shape, the corresponding FormData value is
 * retrieved. Arrays are supported by repeating the same key (e.g. multiple
 * `<input name="seatNumbers">`). Empty strings are converted to undefined so
 * optional fields behave correctly.
 */
export async function parseFormData<T extends z.ZodTypeAny>(
  formData: FormData,
  schema: T,
): Promise<z.infer<T>> {
  const shape =
    schema instanceof z.ZodObject
      ? (schema.shape as Record<string, ZodTypeAny>)
      : null;

  if (!shape) {
    throw new Error("parseFormData requires a z.object schema");
  }

  const raw: Record<string, unknown> = {};

  for (const key of Object.keys(shape)) {
    const values = formData.getAll(key);
    if (values.length === 0) {
      raw[key] = undefined;
      continue;
    }
    if (values.length === 1) {
      const v = values[0];
      raw[key] = typeof v === "string" && v === "" ? undefined : v;
    } else {
      raw[key] = values.map((v) =>
        typeof v === "string" && v === "" ? undefined : v,
      );
    }
  }

  return schema.parse(raw);
}

/**
 * Format a Zod error into a flat, human-readable message list. The result
 * mirrors what react-hook-form displays under each field.
 */
export function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
    .join("; ");
}
