import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import pool from "./config/db";

import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import boardRoutes from "./routes/boardRoutes";
import taskRoutes from "./routes/taskRoutes";
import columnRoutes from "./routes/columnRoutes";
import teamRoutes from "./routes/teamRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import commentRoutes from "./routes/commentRoutes";
import workflowRoutes from "./routes/workflowRoutes";
import auditRoutes from "./routes/auditRoutes";

dotenv.config();
const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/test', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result') as any;
    res.json({
      message: 'backend is connected to mysql!',
      dbResult: rows[0].result
    });
  } catch (error: any) {
    res.status(500).json({ message: 'database connection failed :(', error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', workflowRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', boardRoutes);
app.use('/api/boards', taskRoutes);
app.use('/api/boards', columnRoutes);
app.use('/api/projects', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks/:taskId/comments', commentRoutes);
app.use('/api/boards', auditRoutes);

const seedAdmin = async () => {
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE emailid = ?', ['admin@workspace.com']) as any;
    if (rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('12345678', 10);
      await pool.query(
        'INSERT INTO users (first_name, surname, emailid, password_hash, global_role) VALUES (?, ?, ?, ?, ?)',
        ['System', 'Admin', 'admin@workspace.com', hash, 'Global Admin']
      );
      console.log('seeded global admin');
    }
  } catch (error) {
    console.error('failed to seed', error);
  }
};

// global 404 handler for api routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Oh no! There's nothing at this endpoint :/" });
});

// global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went poof on the server :(',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3001;
seedAdmin().then(() => {
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Server is running fine :) on http://localhost:${PORT}`);
    });
  }
});

export default app;
