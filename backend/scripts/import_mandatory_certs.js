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
  : path.resolve(__dirname, '..', '..', 'Book2.xlsx');

// Cert columns in Book2.xlsx and the corresponding cert type names in the DB
const CERT_COLUMNS = ['NISM 5A', 'NISM 6', 'NISM 8', 'NISM 16', 'PMS'];

const run = async () => {
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  // Clear existing mandatory cert assignments so re-running is idempotent
  await pool.query('DELETE FROM employee_mandatory_certificates');
  console.log('Cleared existing employee_mandatory_certificates entries.');

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const employeeNumber = row['Employee Number']?.toString().trim();
    if (!employeeNumber) continue;

    for (const col of CERT_COLUMNS) {
      const certType = row[col]?.toString().trim();
      if (!certType) continue;

      // Verify the cert type exists in certificate_types
      const [existing] = await pool.query(
        'SELECT name FROM certificate_types WHERE name = ?',
        [certType]
      );
      if (existing.length === 0) {
        console.warn(`  WARN: cert type not found in DB: "${certType}" — skipping`);
        skipped++;
        continue;
      }

      await pool.query(
        'INSERT IGNORE INTO employee_mandatory_certificates (employee_number, certificate_type) VALUES (?, ?)',
        [employeeNumber, certType]
      );
      inserted++;
    }
  }

  console.log(`Done. Inserted ${inserted} mandatory cert assignments (${skipped} skipped — type not in DB).`);
  await pool.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
