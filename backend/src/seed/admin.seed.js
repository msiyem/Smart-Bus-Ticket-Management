import bcrypt from 'bcrypt';
import pool from '../config/db.js';

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const [existingAdmin] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.query('INSERT INTO users (name,email, password_hash, role) VALUES (?,?, ?, ?)', ['Admin', email, hashedPassword, 'admin']);
    console.log("Admin user created successfully");
    process.exit(0);

  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
  
}

createAdmin();