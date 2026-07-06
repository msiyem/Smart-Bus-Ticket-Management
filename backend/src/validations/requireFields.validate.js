export const requireFields = (data, ...fields) => {
  const missing = fields.filter(
    field => data[field] === undefined || data[field] === null
  );

  if (missing.length > 0) {
    const error = new Error(
      `Missing required fields: ${missing.join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }
};