export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const fieldPath = firstIssue?.path?.join(".") || "";
    const message = firstIssue?.message || "Invalid request payload";
    return res.status(400).json({
      success: false,
      message: fieldPath ? `${fieldPath}: ${message}` : message,
      fieldErrors: result.error.issues.reduce(
        (acc, issue) => {
          const key = issue.path.join(".") || "form";
          if (!acc[key]) acc[key] = issue.message;
          return acc;
        },
        {},
      ),
    });
  }

  req.body = result.data;
  next();
};
