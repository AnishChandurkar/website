const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const boardRoutes = require('./routes/boardRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();
const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // Vite dev ports
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        res.json({
            message: 'Backend is connected to MySQL!',
            dbResult: rows[0].result
        });
    } catch (error) {
        res.status(500).json({ message: 'Database connection failed', error: error.message });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', boardRoutes);
app.use('/api/boards', taskRoutes);
app.use('/api/projects', teamRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running fine :) on http://localhost:${PORT}`);
});