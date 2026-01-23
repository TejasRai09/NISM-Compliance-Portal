import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { pingDb, pool } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
const uploadsDir = path.resolve(__dirname, 'uploads');

const otpStore = new Map();
const resetOtpStore = new Map();

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false') === 'true';
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const mailer = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined
});

app.use(cors());
app.use(express.json());

app.use(express.static(frontendDist));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage });

const calculateStatus = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 60) return 'Expiring Soon';
  return 'Compliant';
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nism-backend', time: new Date().toISOString() });
});

app.get('/db/ping', async (req, res) => {
  try {
    await pingDb();
    res.json({ status: 'ok', database: 'reachable' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database unreachable', error: String(error) });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        employee_number AS employeeNumber,
        employee_name AS name,
        designation,
        department,
        location,
        email,
        phone,
        manager_email AS managerEmail,
        manager_employee_no AS managerEmployeeNo,
        manager_employee_name AS managerName
      FROM employees
      ORDER BY employee_name ASC
      `
    );
    res.json({ status: 'ok', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load employees', error: String(error) });
  }
});

app.get('/api/certificates/types', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name FROM certificate_types ORDER BY name ASC');
    res.json({ status: 'ok', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load certificate types', error: String(error) });
  }
});

app.get('/api/certificates', async (req, res) => {
  try {
    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_number VARCHAR(50) NOT NULL,
        module_name VARCHAR(255) NOT NULL,
        cert_number VARCHAR(255) NOT NULL,
        issue_date DATE,
        expiry_date DATE,
        status VARCHAR(50),
        file_name VARCHAR(255),
        file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
    );

    const { employeeNumber, email } = req.query;
    const params = [];
    let sql = `
      SELECT 
        c.id,
        c.employee_number AS employeeNumber,
        e.employee_name AS employeeName,
        c.module_name AS moduleName,
        c.cert_number AS certNumber,
        c.issue_date AS issueDate,
        c.expiry_date AS expiryDate,
        c.status,
        c.file_name AS fileName,
        c.file_path AS filePath
      FROM certificates c
      LEFT JOIN employees e ON e.employee_number = c.employee_number
    `;
    if (employeeNumber) {
      sql += ' WHERE c.employee_number = ?';
      params.push(employeeNumber);
    } else if (email) {
      sql += ' WHERE LOWER(e.email) = ?';
      params.push(String(email).trim().toLowerCase());
    }
    sql += ' ORDER BY c.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ status: 'ok', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load certificates', error: String(error) });
  }
});

app.get('/api/certificates/review', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        c.id,
        c.employee_number AS employeeNumber,
        e.employee_name AS employeeName,
        c.module_name AS moduleName,
        c.cert_number AS certNumber,
        c.issue_date AS issueDate,
        c.expiry_date AS expiryDate,
        c.status,
        c.file_name AS fileName,
        c.file_path AS filePath
      FROM certificates c
      LEFT JOIN employees e ON e.employee_number = c.employee_number
      WHERE c.status = 'Pending Approval'
      ORDER BY c.created_at DESC
      `
    );
    res.json({ status: 'ok', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load review queue', error: String(error) });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_number VARCHAR(50) NOT NULL,
        module_name VARCHAR(255) NOT NULL,
        cert_number VARCHAR(255) NOT NULL,
        issue_date DATE,
        expiry_date DATE,
        status VARCHAR(50),
        file_name VARCHAR(255),
        file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
    );

    const [[{ totalEmployees }]] = await pool.query('SELECT COUNT(*) AS totalEmployees FROM employees');
    const [[{ pendingReviews }]] = await pool.query(
      "SELECT COUNT(*) AS pendingReviews FROM certificates WHERE status = 'Pending Approval'"
    );
    const [[{ criticalExpirations }]] = await pool.query(
      "SELECT COUNT(*) AS criticalExpirations FROM certificates WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status IN ('Compliant','Expiring Soon')"
    );

    const [[{ compliantEmployees }]] = await pool.query(
      `
      SELECT COUNT(DISTINCT employee_number) AS compliantEmployees
      FROM certificates
      WHERE status = 'Compliant'
      `
    );

    const [deptRows] = await pool.query(
      `
      SELECT e.department,
             COUNT(DISTINCT CASE WHEN c.status = 'Compliant' THEN e.employee_number END) AS compliantEmployees,
             COUNT(DISTINCT e.employee_number) AS totalEmployees
      FROM employees e
      LEFT JOIN certificates c ON c.employee_number = e.employee_number
      WHERE e.department IS NOT NULL AND e.department <> ''
      GROUP BY e.department
      ORDER BY e.department ASC
      `
    );

    const complianceRate = totalEmployees
      ? `${Math.round((Number(compliantEmployees || 0) / Number(totalEmployees)) * 100)}%`
      : '—';

    const departmentCompliance = deptRows
      .filter((row) => row.department)
      .map((row) => {
        const total = Number(row.totalEmployees || 0);
        const compliant = Number(row.compliantEmployees || 0);
        return {
          department: row.department,
          percent: total ? Math.round((compliant / total) * 100) : 0,
          compliantEmployees: compliant,
          totalEmployees: total
        };
      });

    res.json({
      status: 'ok',
      data: {
        totalEmployees,
        complianceRate,
        pendingReviews,
        criticalExpirations,
        departmentCompliance
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load admin stats', error: String(error) });
  }
});

app.get('/api/admin/module-stats', async (req, res) => {
  try {
    const [[{ totalCertificates }]] = await pool.query('SELECT COUNT(*) AS totalCertificates FROM certificates');
    const [rows] = await pool.query(
      `
      SELECT module_name AS moduleName, COUNT(*) AS moduleCount
      FROM certificates
      GROUP BY module_name
      ORDER BY moduleCount DESC, module_name ASC
      `
    );

    const data = rows.map((row) => ({
      moduleName: row.moduleName,
      moduleCount: row.moduleCount,
      percent: totalCertificates ? Math.round((Number(row.moduleCount) / Number(totalCertificates)) * 100) : 0
    }));

    res.json({ status: 'ok', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load module stats', error: String(error) });
  }
});

app.post('/api/certificates', upload.single('file'), async (req, res) => {
  try {
    const { employeeNumber, moduleName, certNumber, issueDate, expiryDate } = req.body || {};
    if (!employeeNumber || !moduleName || !certNumber || !issueDate || !expiryDate || !req.file) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields or file.' });
    }

    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_number VARCHAR(50) NOT NULL,
        module_name VARCHAR(255) NOT NULL,
        cert_number VARCHAR(255) NOT NULL,
        issue_date DATE,
        expiry_date DATE,
        status VARCHAR(50),
        file_name VARCHAR(255),
        file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
    );

    const status = 'Pending Approval';
    const fileName = req.file.originalname;
    const filePath = `/uploads/${req.file.filename}`;

    await pool.query(
      `
      INSERT INTO certificates
        (employee_number, module_name, cert_number, issue_date, expiry_date, status, file_name, file_path)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [employeeNumber, moduleName, certNumber, issueDate, expiryDate, status, fileName, filePath]
    );

    res.status(201).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to upload certificate', error: String(error) });
  }
});

app.post('/api/certificates/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT expiry_date FROM certificates WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Certificate not found.' });
    }
    const newStatus = calculateStatus(rows[0].expiry_date);
    await pool.query('UPDATE certificates SET status = ? WHERE id = ?', [newStatus, id]);
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to approve certificate', error: String(error) });
  }
});

app.post('/api/certificates/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('UPDATE certificates SET status = ? WHERE id = ?', ['Rejected', id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Certificate not found.' });
    }
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to reject certificate', error: String(error) });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const {
      employeeNumber,
      name,
      designation,
      department,
      location,
      email,
      phone,
      managerEmail,
      managerEmployeeNo,
      managerName
    } = req.body || {};

    if (!employeeNumber || !name) {
      return res.status(400).json({ status: 'error', message: 'Employee number and name are required.' });
    }

    await pool.query(
      `
      INSERT INTO employees
        (employee_number, employee_name, designation, department, location, email, phone, manager_email, manager_employee_no, manager_employee_name)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        employeeNumber,
        name,
        designation || null,
        department || null,
        location || null,
        email || null,
        phone || null,
        managerEmail || null,
        managerEmployeeNo || null,
        managerName || null
      ]
    );

    res.status(201).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create employee', error: String(error) });
  }
});

app.put('/api/employees/:employeeNumber', async (req, res) => {
  try {
    const { employeeNumber } = req.params;
    const {
      name,
      designation,
      department,
      location,
      email,
      phone,
      managerEmail,
      managerEmployeeNo,
      managerName
    } = req.body || {};

    if (!employeeNumber || !name) {
      return res.status(400).json({ status: 'error', message: 'Employee number and name are required.' });
    }

    const [result] = await pool.query(
      `
      UPDATE employees
      SET
        employee_name = ?,
        designation = ?,
        department = ?,
        location = ?,
        email = ?,
        phone = ?,
        manager_email = ?,
        manager_employee_no = ?,
        manager_employee_name = ?
      WHERE employee_number = ?
      `,
      [
        name,
        designation || null,
        department || null,
        location || null,
        email || null,
        phone || null,
        managerEmail || null,
        managerEmployeeNo || null,
        managerName || null,
        employeeNumber
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Employee not found.' });
    }

    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update employee', error: String(error) });
  }
});

app.delete('/api/employees/:employeeNumber', async (req, res) => {
  try {
    const { employeeNumber } = req.params;
    const [result] = await pool.query('DELETE FROM employees WHERE employee_number = ?', [employeeNumber]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Employee not found.' });
    }

    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete employee', error: String(error) });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    if (!normalizedEmail.includes('adventz')) {
      return res.status(400).json({ status: 'error', message: 'Only Adventz email addresses are allowed.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Passwords do not match.' });
    }

    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
    );

    const [employeeRows] = await pool.query('SELECT email FROM employees WHERE LOWER(email) = ?', [normalizedEmail]);
    if (employeeRows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Email not found in employee records.' });
    }

    const [existingUsers] = await pool.query('SELECT email FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ status: 'error', message: 'User already exists.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const passwordHash = await bcrypt.hash(password, 10);
    otpStore.set(normalizedEmail, { otp, passwordHash, expiresAt: Date.now() + 10 * 60 * 1000 });

    await mailer.sendMail({
      from: smtpUser || 'no-reply@adventz.com',
      to: normalizedEmail,
      subject: 'NISM Portal OTP Verification',
      text: `Your OTP is ${otp}. It expires in 10 minutes.`
    });

    res.json({ status: 'ok', message: 'OTP sent.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to send OTP', error: String(error) });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ status: 'error', message: 'OTP not found. Please request again.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ status: 'error', message: 'OTP expired. Please request again.' });
    }

    if (record.otp !== String(otp)) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP.' });
    }

    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
    );

    await pool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [normalizedEmail, record.passwordHash]);
    otpStore.delete(normalizedEmail);

    res.json({ status: 'ok', message: 'Signup complete.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to verify OTP', error: String(error) });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Passwords do not match.' });
    }

    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
    );

    const [users] = await pool.query('SELECT email FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const passwordHash = await bcrypt.hash(password, 10);
    resetOtpStore.set(normalizedEmail, { otp, passwordHash, expiresAt: Date.now() + 10 * 60 * 1000 });

    await mailer.sendMail({
      from: smtpUser || 'no-reply@adventz.com',
      to: normalizedEmail,
      subject: 'NISM Portal Password Reset OTP',
      text: `Your OTP is ${otp}. It expires in 10 minutes.`
    });

    res.json({ status: 'ok', message: 'OTP sent.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to send OTP', error: String(error) });
  }
});

app.post('/api/auth/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const record = resetOtpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ status: 'error', message: 'OTP not found. Please request again.' });
    }

    if (Date.now() > record.expiresAt) {
      resetOtpStore.delete(normalizedEmail);
      return res.status(400).json({ status: 'error', message: 'OTP expired. Please request again.' });
    }

    if (record.otp !== String(otp)) {
      return res.status(400).json({ status: 'error', message: 'Invalid OTP.' });
    }

    const [result] = await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [record.passwordHash, normalizedEmail]);
    resetOtpStore.delete(normalizedEmail);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    res.json({ status: 'ok', message: 'Password updated.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to reset password', error: String(error) });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `
    );

    const [users] = await pool.query('SELECT email, password_hash FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found. Please sign up first.' });
    }

    const isValid = await bcrypt.compare(password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
    }

    const [employeeRows] = await pool.query(
      `
      SELECT
        employee_number AS employeeNumber,
        employee_name AS name,
        designation,
        department,
        location,
        email,
        phone,
        manager_email AS managerEmail,
        manager_employee_no AS managerEmployeeNo,
        manager_employee_name AS managerName
      FROM employees
      WHERE LOWER(email) = ?
      `,
      [normalizedEmail]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Employee record not found.' });
    }

    res.json({ status: 'ok', role: 'employee', employee: employeeRows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to login', error: String(error) });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const getLocalIp = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

const startServer = (port) => {
  const server = app.listen(port, HOST, () => {
    // eslint-disable-next-line no-console
    const ip = getLocalIp();
    console.log(`Backend running on http://${ip}:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(port) + 1;
      // eslint-disable-next-line no-console
      console.log(`Port ${port} in use. Trying ${nextPort}...`);
      startServer(nextPort);
    } else {
      throw err;
    }
  });
};

startServer(PORT);
