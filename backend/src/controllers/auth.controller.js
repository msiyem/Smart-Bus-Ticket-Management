import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyGoogleToken } from "../utils/google.js";
import {
  deleteRefreshToken,
  findRefreshToken,
  generateAccessToken,
  generateNewRefreshToken,
  generateRefreshToken,
  revokedRefreshTokenBySessionId,
  revokedRefreshTokenByUserId,
  revokeToken,
} from "../services/token.service.js";
import { requireFields } from "../validations/requireFields.validate.js";
import ms from "ms";

//auth/me endpoint to get current user info
export const me = (req, res) => {
  return res.json({
    success: true,
    user: {
      userId: req.user.userId,
      role: req.user.role,
    },
  });
};

//============== LOGIN LOGIC ===============
export const login = async (req, res) => {
  try {
    requireFields(req.body, "email", "password");
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  const { email, password } = req.body;

  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);

  const user = rows[0];

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "User not found!",
    });
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    return res.status(400).json({
      success: false,
      message: "Invalid password!",
    });
  }

  const accessToken = generateAccessToken(user);
  const [refreshToken, sessionId] = await generateRefreshToken(user);

  return res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: ms("15m"),
      path: "/",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: ms(process.env.MAX_AGE), // e.g. 7d
      path: "/",
    })
    .cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: ms(process.env.MAX_AGE),
      path: "/",
    })
    .json({
      success: true,
      message: "Login successful",
    });
};

//============== GOOGLE LOGIN LOGIC ==============
export const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  const payload = await verifyGoogleToken(idToken);

  const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
    payload.email,
  ]);

  let user = rows[0];

  if (!user) {
    const [result] = await pool.execute(
      "INSERT INTO users (name, provider, provider_id, email) VALUES (?, ?, ?, ?)",
      [payload.name, "google", payload.sub, payload.email],
    );
    user = { id: result.insertId, name: payload.name, email: payload.email };
  }

  const accessToken = generateAccessToken(user);
  const [refreshToken, sessionId] = await generateRefreshToken(user);

  return res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: ms("15m"),
      path: "/",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: ms(process.env.MAX_AGE),
      path: "/",
    })
    .cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: ms(process.env.MAX_AGE),
      path: "/",
    })
    .json({
      success: true,
      message: "Google login successful",
    });
};

//============== REFRESH TOKEN LOGIC ===============
export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    const sessionId = req.cookies?.sessionId;

    if (!token || !sessionId) {
      return res.status(401).json({
        success: false,
        message: "No refresh token or session provided",
      });
    }

    const stored = await findRefreshToken(token, sessionId);

    if (!stored) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (
      (stored.expires_at && new Date(stored.expires_at) < new Date()) ||
      (stored.max_age && new Date(stored.max_age) < new Date())
    ) {
      await revokedRefreshTokenBySessionId(sessionId);

      return res
        .clearCookie("refreshToken")
        .clearCookie("accessToken")
        .clearCookie("sessionId")
        .status(401)
        .json({
          success: false,
          message: "Refresh token expired",
        });
    }

    if (stored.is_revoked) {
      await revokedRefreshTokenByUserId(stored.user_id);

      return res
        .clearCookie("refreshToken")
        .clearCookie("accessToken")
        .clearCookie("sessionId")
        .status(403)
        .json({
          success: false,
          message: "Refresh token revoked",
        });
    }

    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      stored.user_id,
    ]);

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔁 ROTATE REFRESH TOKEN
    const [newRefreshToken, newHashedToken] = await generateNewRefreshToken(
      user,
      sessionId,
    );

    await revokeToken(sessionId, token, newHashedToken);

    const accessToken = generateAccessToken(user);

    return res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: ms("15m"),
        path: "/",
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: ms(process.env.MAX_AGE),
        path: "/",
      })
      .json({
        success: true,
        message: "Token refreshed",
      });
  } catch (error) {
    console.error("REFRESH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error in refresh",
    });
  }
};

//============== LOGOUT LOGIC ===============
export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  const sessionId = req.cookies?.sessionId;

  if (token) {
    const stored = await findRefreshToken(token, sessionId);
    if (stored) {
      await revokedRefreshTokenBySessionId(sessionId);
    }
  }

  return res
    .clearCookie("refreshToken")
    .clearCookie("accessToken")
    .clearCookie("sessionId")
    .json({
      success: true,
      message: "Logged out successfully",
    });
};
