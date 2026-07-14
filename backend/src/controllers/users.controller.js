import pool from "../config/db.js";
import bcrypt from "bcrypt";

export async function getAllUsersController(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json({
      success: true,
      message: "All users fetched",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
}

export async function getUserProfileController(req, res) {
  try {
    const userId = req.user?.userId || req.params.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const [rows] = await pool.query(
      "SELECT id, name, username,role, email, address, created_at FROM users WHERE id = ?",
      [userId],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.json({
      success: true,
      message: "User profile fetched",
      data: rows[0],
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
    });
  }
}

export async function registerUserController(req, res) {
  try {
    const { name, username, email, password, address } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (name, username, email, password_hash, address) VALUES (?, ?, ?, ?, ?)",
      [name, username, email, passwordHash, address],
    );
    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
    });
  }
}

export async function adminCreateUserController(req, res) {
  try {
    const { name, username, email, password, address, role } = req.body;

    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    if (username) {
      const [existingUsername] = await pool.query(
        "SELECT id FROM users WHERE username = ?",
        [username],
      );
      if (existingUsername.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (name, username, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?, ?)",
      [name, username || null, email, passwordHash, address, role],
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { userId: result.insertId, role },
    });
  } catch (error) {
    console.error("Error admin-creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
}