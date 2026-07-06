import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
import ms from "ms";
import bcrypt from "bcrypt";

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
      expiresIn: "15m",
    },
  );
};

export const generateRefreshToken = async (user) => {
  const token = uuidv4();
  const session_id = uuidv4();
  const hashedToken = await bcrypt.hash(token, 12);
  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token, expires_at, max_age, session_id) VALUES (?, ?, ?, ?, ?)",
    [
      user.id,
      hashedToken,
      new Date(Date.now() + ms(process.env.EXPIRES_IN)),
      new Date(Date.now() + ms(process.env.MAX_AGE)),
      session_id,
    ],
  );
  return [token, session_id];
};

//
export const findRefreshTokenBySessionId = async (sessionId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM refresh_tokens WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
    [sessionId],
  );
  return rows[0];
};

export const generateNewRefreshToken = async (user, sessionId) => {
  const token = uuidv4();
  const hashedToken = await bcrypt.hash(token, 12);
  const oldToken = await findRefreshTokenBySessionId(sessionId);
  if (!oldToken) {
    throw new Error("Session not found");
  }
  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token, expires_at, max_age, session_id) VALUES (?, ?, ?, ?, ?)",
    [
      user.id,
      hashedToken,
      new Date(Date.now() + ms(process.env.EXPIRES_IN)),
      new Date(Date.now() + ms(process.env.MAX_AGE)),
      sessionId,
    ],
  );
  return [token, hashedToken];
};

export const revokeToken = async (sessionId, token, newToken = null) => {
  const [rows] = await pool.execute(
    "SELECT * FROM refresh_tokens WHERE session_id = ? AND is_revoked = FALSE",
    [sessionId],
  );
  for (const row of rows) {
    const isMatch = await bcrypt.compare(token, row.token);
    if (isMatch) {
      await pool.execute(
        "UPDATE refresh_tokens SET is_revoked = TRUE, replace_by_token = ? WHERE id = ?",
        [newToken, row.id],
      );
      return;
    }
  }
};

export const findRefreshToken = async (token, sessionId) => {
  if (!sessionId) {
    return null;
  }

  const [rows] = await pool.execute(
    "SELECT * FROM refresh_tokens WHERE session_id = ?",
    [sessionId],
  );

  if (!rows.length) return null;

  for (const row of rows) {
    const isMatch = await bcrypt.compare(token, row.token);
    if (isMatch) {
      return row;
    }
  }

  return null;
};

export const deleteRefreshToken = async (token, sessionId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM refresh_tokens WHERE session_id = ? AND is_revoked = FALSE",
    [sessionId],
  );
  for (const row of rows) {
    const isMatch = await bcrypt.compare(token, row.token);
    if (isMatch) {
      await pool.execute("DELETE FROM refresh_tokens WHERE id = ?", [row.id]);
      return;
    }
  }
};

export const revokedRefreshTokenByUserId = async (id) => {
  await pool.execute(
    "UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ? AND is_revoked = FALSE",
    [id],
  );
};

export const revokedRefreshTokenBySessionId = async (sessionId) => {
  await pool.execute(
    "UPDATE refresh_tokens SET is_revoked = TRUE WHERE session_id = ? AND is_revoked = FALSE",
    [sessionId],
  );
};
