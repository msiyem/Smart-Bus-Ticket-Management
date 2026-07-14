import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_EXPIRES_IN || "1d",
    },
  );
};