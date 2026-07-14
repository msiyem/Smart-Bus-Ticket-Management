export const formatTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const getTodayDateISO = () => new Date().toISOString().split("T")[0];

/**
 * Format a date string (YYYY-MM-DD or ISO) in Bangladesh-friendly
 * DD/MM/YYYY format. If the input is empty/invalid, returns it as-is.
 *
 * Parses the date using UTC components to avoid timezone shifts when the
 * input is a bare YYYY-MM-DD (which is otherwise interpreted as UTC
 * midnight and can roll back to the previous day in non-UTC timezones).
 */
export const formatDateBD = (value?: string | null): string => {
  if (!value) return "—";

  const str = String(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (m) {
    const [, y, mo, d] = m;
    return `${d}/${mo}/${y}`;
  }

  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return str;

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};