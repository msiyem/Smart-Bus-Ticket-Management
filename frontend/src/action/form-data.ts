import { z, ZodTypeAny } from "zod";

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

export function formatZodErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
    .join("; ");
}
