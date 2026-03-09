import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from '../db.js';

dotenv.config();

const ADMIN_EMAIL = 'admin@adventz.com';
const ADMIN_PASSWORD = 'Zuari@54321';

const createAdmin = async () => {
  try {
    // Ensure admins table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [existing] = await pool.query('SELECT email FROM admins WHERE email = ?', [ADMIN_EMAIL]);
    if (existing.length > 0) {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [ADMIN_EMAIL, passwordHash]);

    console.log(`✅ Admin created successfully.`);
    console.log(`   Email   : ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
  } finally {
    process.exit(0);
  }
};

createAdmin();
