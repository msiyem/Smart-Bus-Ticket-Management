import pool from "../config/db.js";
import bcrypt from "bcrypt";
import ms from "ms";
import { verifyGoogleToken } from "../utils/google.js";
import { generateAccessToken } from "../services/token.service.js";
import { requireFields } from "../validations/requireFields.validate.js";

const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || "1d";

const cookieDefaults = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

const setAuthCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    ...cookieDefaults(),
    maxAge: ms(ACCESS_EXPIRES_IN),
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie("accessToken", cookieDefaults());
};

const buildUserResponse = (user) => ({
  userId: user.id,
  role: user.role,
  name: user.name,
  email: user.email,
  username: user.username,
  phone: user.phone,
});

export const me = (req, res) => {
  return res.json({
    success: true,
    user: {
      userId: req.user.userId,
      role: req.user.role,
    },
  });
};

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
  setAuthCookie(res, accessToken);

  return res.json({
    success: true,
    message: "Login successful",
    user: buildUserResponse(user),
  });
};

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    const payload = await verifyGoogleToken(idToken);

    if (!payload?.email) {
      return res.status(400).json({
        success: false,
        message: "Google account has no email",
      });
    }

    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      payload.email,
    ]);

    let user = rows[0];

    if (!user) {
      const randomHash = await bcrypt.hash(
        `google-${payload.sub}-${Date.now()}-${Math.random()}`,
        12,
      );

      const [result] = await pool.execute(
        "INSERT INTO users (name, email, password_hash, provider, provider_id, role) VALUES (?, ?, ?, ?, ?, ?)",
        [
          payload.name || payload.email.split("@")[0],
          payload.email,
          randomHash,
          "google",
          payload.sub,
          "user",
        ],
      );

      const [createdRows] = await pool.execute(
        "SELECT * FROM users WHERE id = ?",
        [result.insertId],
      );
      user = createdRows[0];
    } else if (user.provider === "local") {
      await pool.execute(
        "UPDATE users SET provider = ?, provider_id = ? WHERE id = ?",
        ["google", payload.sub, user.id],
      );
      user.provider = "google";
      user.provider_id = payload.sub;
    }

    const accessToken = generateAccessToken(user);
    setAuthCookie(res, accessToken);

    return res.json({
      success: true,
      message: "Google login successful",
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    return res.status(401).json({
      success: false,
      message:
        error?.message || "Google login failed - token could not be verified",
    });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
      req.user.userId,
    ]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (newPassword) {
      const passwordMatches = await bcrypt.compare(
        currentPassword,
        user.password_hash,
      );
      if (!passwordMatches) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    if (newPassword) {
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await pool.execute(
        "UPDATE users SET name = ?, password_hash = ? WHERE id = ?",
        [name, passwordHash, user.id],
      );
    } else {
      await pool.execute("UPDATE users SET name = ? WHERE id = ?", [
        name,
        user.id,
      ]);
    }

    const [updatedRows] = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [user.id],
    );
    return res.json({
      success: true,
      message: "Account settings updated",
      user: buildUserResponse(updatedRows[0]),
    });
  } catch (error) {
    console.error("UPDATE ACCOUNT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update account settings",
    });
  }
};

export const logout = async (_req, res) => {
  clearAuthCookie(res);
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
};
