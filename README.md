# Workspace Project

This project is a full-stack web application designed for project management.

**Authors:**
- Anish Chandurkar (C006)
- Nishitia Halankar (C022)
- Smita Kanojia (C027)
- Devanshi Kashyap (C030)

## Live Deployment

**https://website-alpha-five-23.vercel.app/login**

- Frontend: hosted on Vercel (`Frontend/`), which proxies `/api/*` requests to the backend (see `Frontend/vercel.json`)
- Backend: hosted on Render at https://website-b0a3.onrender.com (`Backend/`)
- Database: MySQL hosted on Aiven

Note: the backend is on Render's free tier, so the first request after a period of inactivity can take 30-60 seconds while it wakes up.

File Structrue:-

website/
├── README.md               
├── Backend/
│   ├── config/             
│   ├── controllers/
│   ├── middleware/         
│   ├── routes/             
│   ├── uploads/            
│   ├── jest.config.js      
│   ├── package.json        
│   ├── package-lock.json    
│   ├── schema.sql          
│   ├── server.ts            
│   ├── tests/              
│   └── tsconfig.json       
└── Frontend/
    ├── public/             
    ├── src/                        
    ├── eslint.config.js    
    ├── index.html          
    ├── package.json        
    ├── package-lock.json    
    ├── tsconfig.json       
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    └── vite.config.ts 
    
## Global Admin Credentials

admin@workspace.com
12345678


## Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript, MySQL
- **Database**: MySQL

---

## Prerequisites
Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MySQL](https://www.mysql.com/)

---

## Setup Instructions

### 1. Database Setup (MySQL)

1. Ensure your MySQL server is running.
2. Create the database and import the schema using the provided SQL file:

```bash
# Navigate to the project root
cd website

# Log in to MySQL (enter password when prompted)
mysql -u root -p

# Create the database
CREATE DATABASE workspace_db;
USE workspace_db;

# Import the schema
SOURCE Backend/schema.sql;

EXIT;
```

Alternatively, you can use a GUI tool like MySQL Workbench or phpMyAdmin to create a database named `workspace_db` and import `Backend/schema.sql`.

---

### 2. Backend Setup

1. Open a new terminal and navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Create a `.env` file in the `Backend` directory.
   - Add the following configuration (adjust `DB_USER` and `DB_PASSWORD` as needed for your local setup):

   ```env
   PORT=3001
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=workspace_db
   JWT_SECRET=SuperSecretKey123!
   JWT_REFRESH_SECRET=RefreshSecretKey456!
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   The server should be running at `http://localhost:3001`.

---

### 3. Frontend Setup

1. Open a **second** terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and go to the URL shown in the terminal (usually `http://localhost:5173/`).

---

## Usage

1. Register a new user account on the signup page.
2. Log in with your credentials.
3. Access the dashboard to manage projects and tasks.     