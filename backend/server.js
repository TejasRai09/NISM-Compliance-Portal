import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import cron from 'node-cron';
import xlsx from 'xlsx';
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

const ALL_CERT_TYPES = [
  'NISM-Series-I: Currency Derivatives',
  'NISM-Series-II-A: Registrars to an Issue and Share Transfer Agents - Corporate',
  'NISM-Series-II-B: Registrars to an Issue and Share Transfer Agents - Mutual Fund',
  'NISM-Series-III-A: Securities Intermediaries Compliance (Non-Fund)',
  'NISM-Series-III-C: Securities Intermediaries Compliance (Fund)',
  'NISM-Series-IV: Interest Rate Derivatives',
  'NISM-Series-V-A: Mutual Fund Distributors (English)',
  'NISM-Series-V-A: Mutual Fund Distributors (Hindi)',
  'NISM-Series-V-B: Mutual Fund Foundation',
  'NISM-Series-VI: Depository Operations',
  'NISM-Series-VII: Securities Operations and Risk Management',
  'NISM-Series-VIII: Equity Derivatives',
  'NISM-Series-IX: Merchant Banking',
  'NISM-Series-X-A: Investment Adviser (Level 1)',
  'NISM-Series-X-B: Investment Adviser (Level 2)',
  'NISM-Series-X-C: Investment Adviser Certification (Renewal)',
  'NISM-Series-XIII: Common Derivatives',
  'NISM-Series-XV: Research Analyst',
  'NISM-Series-XV-B: Research Analyst Certification (Renewal)',
  'NISM-Series-XVI: Commodity Derivatives',
  'NISM-Series-XIX-C: Alternative Investment Fund Managers',
  'NISM-Series-XIX-D: Category I and II Alternative Investment Fund Managers',
  'NISM-Series-XIX-E: Category III Alternative Investment Fund Managers',
  'NISM-Series-XXI-A: Portfolio Management Services (PMS) Distributors',
  'NISM-Series-XXI-B: Portfolio Managers',
  'NISM-Series-XVII: Retirement Adviser',
  'NISM-Series-XII: Securities Markets Foundation',
  'NISM-Series-XIX-A: Alternative Investment Funds (Category I and II) Distributors',
  'NISM-Series-XIX-B: Alternative Investment Funds (Category III) Distributors',
  'NISM-Series-XXIII: Social Impact Assessors',
  'NISM-Series-XXIV: AML and CFT Provisions in Securities Markets',
  'SEBI Investor Awareness Test (Available in English, Hindi, Marathi, Telugu,Bengali)',
  'IBBI: Valuation Examination in the Asset class: Land and Building',
  'IBBI: Valuation Examination in the Asset class: Plant and Machinery',
  'IBBI: Valuation Examination in the Asset class: Securities or Financial Assets',
  'IRDAI Individual Insurance Agent Certificate',
  'IRDAI Corporate Agent License',
  'IRDAI Insurance Broker License',
  'IRDAI Insurance Surveyor & Loss Assessor License',
  'IRDAI Third Party Administrator (TPA) License',
  'IRDAI Point of Sales Person (POSP) Certificate',
  'IRDAI Web Aggregator License',
  'IRDAI Appointed Person / Specified Person Certificate',
  'NCFM: Capital Market (Dealers) Module',
  'NCFM: Derivatives Market (Dealers) Module',
  'NCFM: Currency Derivatives: A Beginner\'s Module',
  'NCFM: Commodities Market Module',
  'NCFM: FIMMDA-NSE Debt Market (Basic) Module',
  'NCFM: Investment Analysis and Portfolio Management Module',
  'NCFM: Compliance Officers (Brokers) Module',
  'NCFM: Algorithmic Trading Module',
  'BCFM: Securities Market Basic Module',
  'BCFM: Equity Derivatives Basic Module',
  'BCFM: Currency and Interest Rate Derivatives Basic Module',
  'BCFM: Mutual Fund Basic Module'
];

const envValue = (value = '') => String(value).trim().replace(/^"|"$/g, '');
const smtpHost = 'smtpout.secureserver.net';
const smtpPort = 587;
const smtpSecure = false;
const smtpUser = envValue(process.env.OUTLOOK_USER) || envValue(process.env.SMTP_USER) || '';
const smtpPass = envValue(process.env.OUTLOOK_PASS) || envValue(process.env.SMTP_PASS) || '';

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

// ─── Expiry Reminder Logic ───────────────────────────────────────────────────

const getReminderType = (daysToExpiry, mode) => {
  if (mode === 'scheduled') {
    if (daysToExpiry === 90) return '90-day';
    if (daysToExpiry === 60) return '60-day';
    if (daysToExpiry === 30) return '30-day';
    if (daysToExpiry === 0) return 'expired';
    return null;
  }

  if (daysToExpiry <= 0) return 'expired';
  if (daysToExpiry <= 30) return '30-day';
  if (daysToExpiry <= 60) return '60-day';
  if (daysToExpiry <= 90) return '90-day';
  return null;
};

const ensureReminderTrackingTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_reminders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      certificate_id INT NOT NULL,
      reminder_type VARCHAR(20) NOT NULL,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_cert_reminder (certificate_id, reminder_type)
    )
  `);
};

const ensureMandatoryTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      UNIQUE KEY uniq_name (name)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_mandatory_certificates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_number VARCHAR(50) NOT NULL,
      certificate_type VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_emp_cert (employee_number, certificate_type)
    )
  `);
  for (const name of ALL_CERT_TYPES) {
    await pool.query('INSERT IGNORE INTO certificate_types (name) VALUES (?)', [name]);
  }
};

const getReminderPreview = async ({ mode = 'scheduled' } = {}) => {
  const dueClause = mode === 'scheduled'
    ? 'DATEDIFF(c.expiry_date, CURDATE()) IN (90, 60, 30, 0)'
    : 'DATEDIFF(c.expiry_date, CURDATE()) <= 90';

  await ensureReminderTrackingTable();

  const [rows] = await pool.query(
    `
    SELECT
      c.id                      AS certificateId,
      c.module_name             AS moduleName,
      c.cert_number             AS certNumber,
      c.expiry_date             AS expiryDate,
      DATEDIFF(c.expiry_date, CURDATE()) AS daysToExpiry,
      c.status                  AS certificateStatus,
      e.employee_name           AS employeeName,
      e.email                   AS employeeEmail,
      e.manager_email           AS managerEmail
    FROM certificates c
    JOIN employees e ON e.employee_number = c.employee_number
    WHERE
      ${dueClause}
      AND c.status IN ('Compliant', 'Expiring Soon', 'Expired')
      AND e.email IS NOT NULL
      AND e.email <> ''
    ORDER BY c.expiry_date ASC
    `
  );

  const items = [];
  for (const row of rows) {
    const daysToExpiry = Number(row.daysToExpiry);
    const reminderType = getReminderType(daysToExpiry, mode);
    if (!reminderType) continue;

    let alreadySent = false;
    if (mode === 'scheduled') {
      const [existing] = await pool.query(
        'SELECT id, sent_at AS sentAt FROM certificate_reminders WHERE certificate_id = ? AND reminder_type = ? LIMIT 1',
        [row.certificateId, reminderType]
      );
      alreadySent = existing.length > 0;
    }

    items.push({
      certificateId: row.certificateId,
      employeeName: row.employeeName,
      employeeEmail: row.employeeEmail,
      managerEmail: row.managerEmail,
      moduleName: row.moduleName,
      certNumber: row.certNumber,
      expiryDate: row.expiryDate,
      daysToExpiry,
      certificateStatus: row.certificateStatus,
      reminderType,
      alreadySent,
      sendable: mode === 'manual' ? true : !alreadySent
    });
  }

  const byType = {
    '90-day': items.filter((x) => x.reminderType === '90-day').length,
    '60-day': items.filter((x) => x.reminderType === '60-day').length,
    '30-day': items.filter((x) => x.reminderType === '30-day').length,
    expired: items.filter((x) => x.reminderType === 'expired').length
  };

  return {
    mode,
    totalCandidates: items.length,
    sendableCandidates: items.filter((x) => x.sendable).length,
    alreadySentCandidates: items.filter((x) => x.alreadySent).length,
    byType,
    items
  };
};

const sendExpiryReminders = async ({ mode = 'scheduled' } = {}) => {
  let totalSent = 0;
  const errors = [];

  // ── Step 1: Mark all past-due certificates as Expired ─────────────────────
  try {
    const [expiredResult] = await pool.query(
      `UPDATE certificates SET status = 'Expired'
       WHERE expiry_date < CURDATE()
         AND status IN ('Compliant', 'Expiring Soon')`
    );
    if (expiredResult.affectedRows > 0) {
      // eslint-disable-next-line no-console
      console.log(`[Reminders] Marked ${expiredResult.affectedRows} past-due certificate(s) as Expired.`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Reminders] Error updating expired statuses:', String(err));
    errors.push(`Status sweep error: ${String(err)}`);
  }

  // ── Step 2: Track sent reminders to avoid duplicate auto-notifications ────
  try {
    await ensureReminderTrackingTable();
  } catch (err) {
    const msg = `[Reminders] Failed to initialize certificate_reminders table: ${String(err)}`;
    // eslint-disable-next-line no-console
    console.error(msg);
    errors.push(msg);
  }

  // ── Step 3: Select candidate certificates and send reminders ──────────────
  const dueClause = mode === 'scheduled'
    ? 'DATEDIFF(c.expiry_date, CURDATE()) IN (90, 60, 30, 0)'
    : 'DATEDIFF(c.expiry_date, CURDATE()) <= 90';

  try {
    const [rows] = await pool.query(
      `
      SELECT
        c.id                      AS certificateId,
        c.module_name             AS moduleName,
        c.cert_number             AS certNumber,
        c.expiry_date             AS expiryDate,
        DATEDIFF(c.expiry_date, CURDATE()) AS daysToExpiry,
        e.employee_name           AS employeeName,
        e.email                   AS employeeEmail,
        e.manager_email           AS managerEmail
      FROM certificates c
      JOIN employees e ON e.employee_number = c.employee_number
      WHERE
        ${dueClause}
        AND c.status IN ('Compliant', 'Expiring Soon', 'Expired')
        AND e.email IS NOT NULL
        AND e.email <> ''
      ORDER BY c.expiry_date ASC
      `
    );

    for (const row of rows) {
      const daysToExpiry = Number(row.daysToExpiry);
      const reminderType = getReminderType(daysToExpiry, mode);
      if (!reminderType) continue;

      if (mode === 'scheduled') {
        const [alreadySent] = await pool.query(
          'SELECT id FROM certificate_reminders WHERE certificate_id = ? AND reminder_type = ? LIMIT 1',
          [row.certificateId, reminderType]
        );
        if (alreadySent.length > 0) continue;
      }

      const formattedExpiry = new Date(row.expiryDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
      });

      let subject;
      let body;

      if (reminderType === 'expired') {
        const expiredDays = Math.abs(daysToExpiry);
        const timingText = daysToExpiry === 0
          ? `has expired today (${formattedExpiry})`
          : `expired ${expiredDays} day(s) ago on ${formattedExpiry}`;

        subject = 'Certificate Expired - Immediate Action Required';
        body = `Dear ${row.employeeName},\n\nThis is an automated notification from Z-PRISM (Zuari Professional Records & Information System for Management).\n\nYour certificate for the module "${row.moduleName}" (Certificate No: ${row.certNumber}) ${timingText}.\n\nPlease renew your certification immediately and upload the updated document on the Z-PRISM portal.\n\nRegards,\nZ-PRISM Compliance System\nZuari Finserv Ltd`;
      } else {
        subject = `Certificate Expiry Reminder - ${daysToExpiry} Days Remaining`;
        body = `Dear ${row.employeeName},\n\nThis is an automated reminder from Z-PRISM (Zuari Professional Records & Information System for Management).\n\nYour certificate for the module "${row.moduleName}" (Certificate No: ${row.certNumber}) is due to expire on ${formattedExpiry}, which is ${daysToExpiry} day(s) from today.\n\nPlease initiate your renewal process in advance to avoid a lapse in compliance.\n\nRegards,\nZ-PRISM Compliance System\nZuari Finserv Ltd`;
      }

      const recipients = [row.employeeEmail];
      if (row.managerEmail && row.managerEmail !== row.employeeEmail) {
        recipients.push(row.managerEmail);
      }

      await mailer.sendMail({
        from: smtpUser || 'no-reply@adventz.com',
        to: recipients.join(','),
        subject,
        text: body
      });

      if (mode === 'scheduled') {
        await pool.query(
          'INSERT INTO certificate_reminders (certificate_id, reminder_type) VALUES (?, ?)',
          [row.certificateId, reminderType]
        );
      }

      totalSent++;
    }

    // eslint-disable-next-line no-console
    console.log(`[Reminders] ${mode} run completed. ${totalSent} email(s) sent.`);
  } catch (err) {
    const msg = `[Reminders] Error while sending reminders in ${mode} mode: ${String(err)}`;
    // eslint-disable-next-line no-console
    console.error(msg);
    errors.push(msg);
  }

  // ── Step 4: Notify employees who have not uploaded mandatory certificates ──
  try {
    const [missingRows] = await pool.query(`
      SELECT
        emc.employee_number       AS employeeNumber,
        e.employee_name           AS employeeName,
        e.email                   AS employeeEmail,
        e.manager_email           AS managerEmail,
        GROUP_CONCAT(emc.certificate_type ORDER BY emc.certificate_type SEPARATOR '||') AS missingCerts
      FROM employee_mandatory_certificates emc
      JOIN employees e ON e.employee_number = emc.employee_number
      WHERE NOT EXISTS (
        SELECT 1 FROM certificates c
        WHERE c.employee_number = emc.employee_number
          AND c.module_name = emc.certificate_type
          AND c.status IN ('Compliant', 'Expiring Soon', 'Pending Approval')
      )
      AND e.email IS NOT NULL AND e.email <> ''
      GROUP BY emc.employee_number, e.employee_name, e.email, e.manager_email
    `);

    for (const row of missingRows) {
      const certList = row.missingCerts.split('||').map((c, i) => `  ${i + 1}. ${c}`).join('\n');
      const subject = 'Action Required: Mandatory Certificate(s) Not Uploaded';
      const body = `Dear ${row.employeeName},\n\nThis is an automated notification from Z-PRISM (Zuari Professional Records & Information System for Management).\n\nThe following mandatory certificate(s) have not been uploaded on the portal:\n\n${certList}\n\nPlease complete the required certification(s) and upload the documents on the Z-PRISM portal at your earliest convenience.\n\nRegards,\nZ-PRISM Compliance System\nZuari Finserv Ltd`;

      const recipients = [row.employeeEmail];
      if (row.managerEmail && row.managerEmail !== row.employeeEmail) {
        recipients.push(row.managerEmail);
      }

      await mailer.sendMail({
        from: smtpUser || 'no-reply@adventz.com',
        to: recipients.join(','),
        subject,
        text: body
      });

      totalSent++;
    }

    // eslint-disable-next-line no-console
    console.log(`[Reminders] Missing mandatory cert notifications: ${missingRows.length} employee(s) notified.`);
  } catch (err) {
    const msg = `[Reminders] Error sending missing mandatory cert notifications: ${String(err)}`;
    // eslint-disable-next-line no-console
    console.error(msg);
    errors.push(msg);
  }

  return { totalSent, errors };
};

// Run daily at 9:00 AM server time
cron.schedule('0 9 * * *', async () => {
  // eslint-disable-next-line no-console
  console.log('[Reminders] Running scheduled expiry reminder job...');
  await sendExpiryReminders({ mode: 'scheduled' });
});

// ─────────────────────────────────────────────────────────────────────────────

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

    // Critical expirations: mandatory certs expiring in next 30 days
    const [[{ criticalExpirations }]] = await pool.query(`
      SELECT COUNT(*) AS criticalExpirations
      FROM certificates c
      JOIN employee_mandatory_certificates emc
        ON emc.employee_number = c.employee_number AND emc.certificate_type = c.module_name
      WHERE c.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND c.status IN ('Compliant','Expiring Soon')
    `);

    // Compliance based on mandatory certs: employees who have ALL their mandatory certs done
    const [[{ totalWithMandatory }]] = await pool.query(
      'SELECT COUNT(DISTINCT employee_number) AS totalWithMandatory FROM employee_mandatory_certificates'
    );

    const [[{ fullCompliant }]] = await pool.query(`
      SELECT COUNT(*) AS fullCompliant FROM (
        SELECT emc.employee_number
        FROM employee_mandatory_certificates emc
        GROUP BY emc.employee_number
        HAVING SUM(
          CASE WHEN EXISTS (
            SELECT 1 FROM certificates c
            WHERE c.employee_number = emc.employee_number
              AND c.module_name = emc.certificate_type
              AND c.status IN ('Compliant', 'Expiring Soon')
          ) THEN 0 ELSE 1 END
        ) = 0
      ) AS t
    `);

    const complianceRate = Number(totalWithMandatory)
      ? `${Math.round((Number(fullCompliant) / Number(totalWithMandatory)) * 100)}%`
      : '—';

    // Department compliance based on mandatory certs
    const [deptRows] = await pool.query(`
      SELECT
        e.department,
        COUNT(DISTINCT e.employee_number) AS totalEmployees,
        SUM(CASE WHEN NOT EXISTS (
          SELECT 1 FROM employee_mandatory_certificates emc2
          WHERE emc2.employee_number = e.employee_number
            AND NOT EXISTS (
              SELECT 1 FROM certificates c
              WHERE c.employee_number = emc2.employee_number
                AND c.module_name = emc2.certificate_type
                AND c.status IN ('Compliant', 'Expiring Soon')
            )
        ) THEN 1 ELSE 0 END) AS compliantEmployees
      FROM employees e
      WHERE e.department IS NOT NULL AND e.department <> ''
        AND EXISTS (SELECT 1 FROM employee_mandatory_certificates WHERE employee_number = e.employee_number)
      GROUP BY e.department
      ORDER BY e.department ASC
    `);

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
    const [[{ totalCertificates }]] = await pool.query(
      "SELECT COUNT(*) AS totalCertificates FROM certificates WHERE status IN ('Compliant','Expiring Soon')"
    );
    const [rows] = await pool.query(
      `
      SELECT module_name AS moduleName, COUNT(*) AS moduleCount
      FROM certificates
      WHERE status IN ('Compliant','Expiring Soon')
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

app.get('/api/admin/master-report', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        e.employee_number   AS "Employee ID",
        e.employee_name     AS "Employee Name",
        e.designation       AS "Designation",
        e.department        AS "Department",
        e.location          AS "Location",
        e.email             AS "Email",
        e.phone             AS "Phone",
        e.manager_employee_name AS "Manager Name",
        e.manager_email     AS "Manager Email",
        c.module_name       AS "Certificate Type",
        c.cert_number       AS "Certificate Number",
        c.issue_date        AS "Issue Date",
        c.expiry_date       AS "Expiry Date",
        c.status            AS "Status"
      FROM employees e
      LEFT JOIN certificates c ON c.employee_number = e.employee_number
      ORDER BY e.employee_name ASC, c.expiry_date ASC
      `
    );

    // Format dates to readable strings
    const formatted = rows.map((row) => ({
      ...row,
      'Issue Date': row['Issue Date']
        ? new Date(row['Issue Date']).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '',
      'Expiry Date': row['Expiry Date']
        ? new Date(row['Expiry Date']).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : ''
    }));

    const wb = xlsx.utils.book_new();

    // Sheet 1: Master Report
    const wsMaster = xlsx.utils.json_to_sheet(formatted);
    // Auto column widths
    const colWidths = Object.keys(formatted[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...formatted.map((r) => String(r[key] ?? '').length)) + 2
    }));
    wsMaster['!cols'] = colWidths;
    xlsx.utils.book_append_sheet(wb, wsMaster, 'Master Report');

    // Sheet 2: Summary by Department
    const [deptRows] = await pool.query(
      `
      SELECT
        e.department                                                              AS "Department",
        COUNT(DISTINCT e.employee_number)                                         AS "Total Employees",
        SUM(CASE WHEN c.status = 'Compliant' THEN 1 ELSE 0 END)                  AS "Compliant",
        SUM(CASE WHEN c.status = 'Expiring Soon' THEN 1 ELSE 0 END)              AS "Expiring Soon",
        SUM(CASE WHEN c.status = 'Expired' THEN 1 ELSE 0 END)                   AS "Expired",
        SUM(CASE WHEN c.status = 'Pending Approval' THEN 1 ELSE 0 END)           AS "Pending Approval",
        SUM(CASE WHEN c.status = 'Rejected' THEN 1 ELSE 0 END)                  AS "Rejected"
      FROM employees e
      LEFT JOIN certificates c ON c.employee_number = e.employee_number
      WHERE e.department IS NOT NULL AND e.department <> ''
      GROUP BY e.department
      ORDER BY e.department ASC
      `
    );
    const wsSummary = xlsx.utils.json_to_sheet(deptRows);
    const summaryWidths = Object.keys(deptRows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...deptRows.map((r) => String(r[key] ?? '').length)) + 2
    }));
    wsSummary['!cols'] = summaryWidths;
    xlsx.utils.book_append_sheet(wb, wsSummary, 'Department Summary');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `ZPRISM_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to generate master report', error: String(error) });
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
      managerName,
      mandatoryCertificates
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

    if (Array.isArray(mandatoryCertificates) && mandatoryCertificates.length > 0) {
      for (const certType of mandatoryCertificates) {
        await pool.query(
          'INSERT IGNORE INTO employee_mandatory_certificates (employee_number, certificate_type) VALUES (?, ?)',
          [employeeNumber, certType]
        );
      }
    }

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
      managerName,
      mandatoryCertificates
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

    if (Array.isArray(mandatoryCertificates)) {
      await pool.query('DELETE FROM employee_mandatory_certificates WHERE employee_number = ?', [employeeNumber]);
      for (const certType of mandatoryCertificates) {
        await pool.query(
          'INSERT IGNORE INTO employee_mandatory_certificates (employee_number, certificate_type) VALUES (?, ?)',
          [employeeNumber, certType]
        );
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update employee', error: String(error) });
  }
});

app.delete('/api/employees/:employeeNumber', async (req, res) => {
  try {
    const { employeeNumber } = req.params;
    await pool.query('DELETE FROM employee_mandatory_certificates WHERE employee_number = ?', [employeeNumber]);
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

    // ── Check admins table first ───────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [admins] = await pool.query('SELECT email, password_hash FROM admins WHERE email = ?', [normalizedEmail]);
    if (admins.length > 0) {
      const isValid = await bcrypt.compare(password, admins[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
      }
      return res.json({ status: 'ok', role: 'admin' });
    }

    // ── Check employees / users table ─────────────────────────────────────
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

app.post('/api/admin/send-reminders', async (req, res) => {
  try {
    const result = await sendExpiryReminders({ mode: 'manual' });
    res.json({
      status: 'ok',
      message: result.errors.length > 0
        ? `Reminder job completed with errors. ${result.totalSent} email(s) sent.`
        : `Reminder job completed. ${result.totalSent} email(s) sent.`,
      totalSent: result.totalSent,
      errors: result.errors
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to send reminders', error: String(error) });
  }
});

app.get('/api/admin/reminder-preview', async (req, res) => {
  try {
    const mode = req.query.mode === 'scheduled' ? 'scheduled' : 'manual';
    const data = await getReminderPreview({ mode });
    res.json({ status: 'ok', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to generate reminder preview', error: String(error) });
  }
});

app.get('/api/admin/compliance-matrix', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.employee_number   AS employeeNumber,
        e.employee_name     AS employeeName,
        e.department,
        e.email,
        e.manager_email     AS managerEmail,
        emc.certificate_type AS certificateType,
        COALESCE(c.status, 'Not Uploaded') AS certStatus
      FROM employees e
      JOIN employee_mandatory_certificates emc ON emc.employee_number = e.employee_number
      LEFT JOIN certificates c ON c.id = (
        SELECT id FROM certificates
        WHERE employee_number = emc.employee_number
          AND module_name = emc.certificate_type
          AND status NOT IN ('Rejected')
        ORDER BY created_at DESC
        LIMIT 1
      )
      ORDER BY e.employee_name ASC, emc.certificate_type ASC
    `);

    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.employeeNumber)) {
        map.set(row.employeeNumber, {
          employeeNumber: row.employeeNumber,
          employeeName: row.employeeName,
          department: row.department,
          email: row.email,
          managerEmail: row.managerEmail,
          certs: []
        });
      }
      map.get(row.employeeNumber).certs.push({
        certType: row.certificateType,
        status: row.certStatus
      });
    }

    res.json({ status: 'ok', data: Array.from(map.values()) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load compliance matrix', error: String(error) });
  }
});

app.post('/api/admin/send-reminder/:employeeNumber', async (req, res) => {
  try {
    const { employeeNumber } = req.params;

    const [rows] = await pool.query(`
      SELECT
        e.employee_name AS employeeName,
        e.email         AS employeeEmail,
        e.manager_email AS managerEmail,
        GROUP_CONCAT(emc.certificate_type ORDER BY emc.certificate_type SEPARATOR '||') AS missingCerts
      FROM employee_mandatory_certificates emc
      JOIN employees e ON e.employee_number = emc.employee_number
      WHERE emc.employee_number = ?
        AND NOT EXISTS (
          SELECT 1 FROM certificates c
          WHERE c.employee_number = emc.employee_number
            AND c.module_name = emc.certificate_type
            AND c.status IN ('Compliant', 'Expiring Soon', 'Pending Approval')
        )
      GROUP BY e.employee_name, e.email, e.manager_email
    `, [employeeNumber]);

    if (rows.length === 0) {
      return res.json({ status: 'ok', message: 'No missing mandatory certificates for this employee.' });
    }

    const row = rows[0];
    const certList = row.missingCerts.split('||').map((c, i) => `  ${i + 1}. ${c}`).join('\n');
    const subject = 'Action Required: Mandatory Certificate(s) Not Uploaded';
    const body = `Dear ${row.employeeName},\n\nThis is a reminder from Z-PRISM (Zuari Professional Records & Information System for Management).\n\nThe following mandatory certificate(s) have not been uploaded on the portal:\n\n${certList}\n\nPlease complete the required certification(s) and upload the documents on the Z-PRISM portal at your earliest convenience.\n\nRegards,\nZ-PRISM Compliance System\nZuari Finserv Ltd`;

    const recipients = [row.employeeEmail];
    if (row.managerEmail && row.managerEmail !== row.employeeEmail) recipients.push(row.managerEmail);

    await mailer.sendMail({
      from: smtpUser || 'no-reply@adventz.com',
      to: recipients.join(','),
      subject,
      text: body
    });

    res.json({ status: 'ok', message: `Reminder sent to ${row.employeeName}.` });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to send reminder', error: String(error) });
  }
});

app.get('/api/employees/:employeeNumber/mandatory-certificates', async (req, res) => {
  try {
    const { employeeNumber } = req.params;
    const [rows] = await pool.query(
      'SELECT certificate_type AS certificateType FROM employee_mandatory_certificates WHERE employee_number = ? ORDER BY certificate_type ASC',
      [employeeNumber]
    );
    res.json({ status: 'ok', data: rows.map((r) => r.certificateType) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load mandatory certificates', error: String(error) });
  }
});

app.get('/api/employees/:employeeNumber/mandatory-status', async (req, res) => {
  try {
    const { employeeNumber } = req.params;
    const [rows] = await pool.query(
      `
      SELECT
        emc.certificate_type AS certificateType,
        c.id,
        c.cert_number       AS certNumber,
        c.issue_date        AS issueDate,
        c.expiry_date       AS expiryDate,
        c.status,
        c.file_path         AS filePath
      FROM employee_mandatory_certificates emc
      LEFT JOIN certificates c ON c.id = (
        SELECT id FROM certificates
        WHERE employee_number = emc.employee_number
          AND module_name = emc.certificate_type
          AND status NOT IN ('Rejected')
        ORDER BY created_at DESC
        LIMIT 1
      )
      WHERE emc.employee_number = ?
      ORDER BY emc.certificate_type ASC
      `,
      [employeeNumber]
    );
    const data = rows.map((row) => ({
      certificateType: row.certificateType,
      id: row.id || null,
      certNumber: row.certNumber || null,
      issueDate: row.issueDate || null,
      expiryDate: row.expiryDate || null,
      status: row.status || 'Not Uploaded',
      filePath: row.filePath || null
    }));
    res.json({ status: 'ok', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to load mandatory cert status', error: String(error) });
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
  ensureMandatoryTables().catch((err) => console.error('[Startup] ensureMandatoryTables failed:', String(err)));

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
