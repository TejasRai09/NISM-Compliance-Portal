import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import { pool } from '../db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '..', '..', 'Book20.xlsx');

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_number VARCHAR(50) NOT NULL UNIQUE,
  employee_name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  department VARCHAR(255),
  location VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  manager_email VARCHAR(255),
  manager_employee_no VARCHAR(50),
  manager_employee_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const normalizeHeader = (header) => header?.toString().trim();

const run = async () => {
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  await pool.query(TABLE_SQL);

  const insertSql = `
    INSERT INTO employees
      (employee_number, employee_name, designation, department, location, email, phone, manager_email, manager_employee_no, manager_employee_name)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      employee_name = VALUES(employee_name),
      designation = VALUES(designation),
      department = VALUES(department),
      location = VALUES(location),
      email = VALUES(email),
      phone = VALUES(phone),
      manager_email = VALUES(manager_email),
      manager_employee_no = VALUES(manager_employee_no),
      manager_employee_name = VALUES(manager_employee_name);
  `;

  let inserted = 0;

  for (const row of rows) {
    const employeeNumber = row[normalizeHeader('Employee Number')];
    const employeeName = row[normalizeHeader('Employee Name')];
    const designation = row[normalizeHeader('Curr.Designation')];
    const department = row[normalizeHeader('Curr.Department')];
    const location = row[normalizeHeader('Curr.Location')];
    const email = row[normalizeHeader('Email')];
    const phone = row[normalizeHeader('Phone')];
    const managerEmail = row[normalizeHeader('Manager Email Id')];
    const managerEmployeeNo = row[normalizeHeader('Manager Employee No')];
    const managerEmployeeName = row[normalizeHeader('Manager Employee Name')];

    if (!employeeNumber || !employeeName) {
      continue;
    }

    await pool.query(insertSql, [
      employeeNumber,
      employeeName,
      designation,
      department,
      location,
      email,
      phone,
      managerEmail,
      managerEmployeeNo,
      managerEmployeeName
    ]);
    inserted += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Imported ${inserted} employees from ${excelPath}`);
  await pool.end();
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
