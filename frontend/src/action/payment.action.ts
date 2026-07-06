"use server";

import { serverRequest } from "@/action/server-request.action";
import { parseFormData, formatZodErrors } from "@/action/form-data";
import {
  createPaymentSchema,
  CreatePaymentData,
} from "@/lib/validations/payment";

export type CreatePaymentResponse = {
  success: boolean;
  message?: string;
  data?: unknown;
};

type FormActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; message: string; fieldErrors?: Record<string, string> };

function toFieldErrors(error: unknown): Record<string, string> | undefined {
  if (error && typeof error === "object" && "issues" in (error as Record<string, unknown>)) {
    const issues = (error as { issues: { path: (string | number)[]; message: string }[] }).issues;
    const out: Record<string, string> = {};
    for (const issue of issues) {
      const key = issue.path.join(".");
      if (key && !out[key]) out[key] = issue.message;
    }
    return out;
  }
  return undefined;
}

export const createPayment = async (payload: {
  booking_id: number;
  amount: number;
  payment_method: string;
  transaction_id: string;
}): Promise<CreatePaymentResponse> => {
  try {
    const response = await serverRequest("payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { success: true, data: response };
  } catch (error) {
    console.error("Error creating payment:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create payment",
    };
  }
};

/**
 * Server action that validates a FormData payload against the Zod
 * create-payment schema before forwarding to the API.
 */
export const createPaymentFormAction = async (
  _prev: FormActionResult<CreatePaymentResponse> | undefined,
  formData: FormData,
): Promise<FormActionResult<CreatePaymentResponse>> => {
  let parsed: CreatePaymentData;
  try {
    parsed = (await parseFormData(
      formData,
      createPaymentSchema,
    )) as CreatePaymentData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  const result = await createPayment({
    booking_id: parsed.booking_id,
    amount: parsed.amount,
    payment_method: parsed.payment_method,
    transaction_id: parsed.transaction_id,
  });
  if (!result.success) {
    return { success: false, message: result.message || "Payment failed" };
  }
  return { success: true, data: result };
};
