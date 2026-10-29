import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// hosted mysql (aiven, tidb) needs ssl; DB_SSL_CA is the CA cert contents if the provider gives one
const ssl = process.env.DB_SSL === "true"
  ? {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, "\n") } : {})
    }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
