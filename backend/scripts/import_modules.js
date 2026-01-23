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
  : path.resolve(__dirname, '..', '..', 'Book22.xlsx');

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS certificate_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
`;

const run = async () => {
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  await pool.query(TABLE_SQL);

  const insertSql = `
    INSERT INTO certificate_types (name)
    VALUES (?)
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `;

  let inserted = 0;
  for (const row of rows) {
    const name = row['Type of Certificates'];
    if (!name) continue;
    await pool.query(insertSql, [name]);
    inserted += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Imported ${inserted} certificate types from ${excelPath}`);
  await pool.end();
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
