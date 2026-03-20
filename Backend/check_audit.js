const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAudit() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'workspace_db'
    });
    const [rows] = await connection.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10');
    console.log("--- AUDIT LOGS ---");
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
  } catch (err) {
    console.error("Error connecting to database:", err.message);
  }
}
checkAudit();
