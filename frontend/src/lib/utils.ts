import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// export function extractErrorMessage(errorData: unknown) {
//   if (!errorData?.detail) return "Unknown error";

//   if (typeof errorData.detail === "string") {
//     return errorData.detail;
//   }

//   if (Array.isArray(errorData.detail)) {
//     // Validation errors
//     return errorData.detail.map((e: unknown) => e.msg).join(", ");
//   }

//   return "Unknown error format";
// }
