/**
 * Utility to extract clean, user-friendly error messages from API / Axios errors
 * Supports Django REST Framework format ({ field: [ "error" ] }, { non_field_errors: [...] }, { detail: "..." })
 */
export function formatApiError(error: unknown): string {
  if (!error) return "An unexpected error occurred.";

  const err = error as {
    response?: {
      data?: unknown;
      status?: number;
    };
    message?: string;
  };

  const data = err.response?.data;

  // If response data is a plain string
  if (typeof data === "string") {
    return data;
  }

  // If response data is an object
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;

    // Check common DRF error fields
    if (typeof dataObj.detail === "string") return dataObj.detail;
    if (typeof dataObj.message === "string") return dataObj.message;
    if (typeof dataObj.error === "string") return dataObj.error;

    if (Array.isArray(dataObj.non_field_errors) && dataObj.non_field_errors.length > 0) {
      return String(dataObj.non_field_errors[0]);
    }

    // Handle field-level errors like { password: ["This password is too short..."] }
    const messages: string[] = [];
    for (const [, val] of Object.entries(dataObj)) {
      if (Array.isArray(val) && val.length > 0) {
        messages.push(String(val[0]));
      } else if (typeof val === "string") {
        messages.push(val);
      }
    }

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  // Fallback by status code
  if (err.response?.status === 400) {
    return "Invalid input data. Please check your details.";
  }
  if (err.response?.status === 401) {
    return "Invalid email or password.";
  }
  if (err.response?.status === 403) {
    return "Access denied.";
  }
  if (err.response?.status === 500) {
    return "Server error. Please try again later.";
  }

  return err.message || "An unexpected error occurred. Please try again.";
}

/**
 * Extracts individual field errors mapping field name to error message
 * e.g. { password: "This password is too short..." }
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!error) return fieldErrors;

  const err = error as {
    response?: {
      data?: unknown;
    };
  };

  const data = err.response?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (Array.isArray(val) && val.length > 0) {
        fieldErrors[key] = String(val[0]);
      } else if (typeof val === "string") {
        fieldErrors[key] = val;
      }
    }
  }

  return fieldErrors;
}
