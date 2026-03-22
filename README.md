# Workspace Project

This project is a full-stack web application designed for project management, built as part of COP290 Assignment 2.

**Authors:**
- Keshav Navandar (2024CS10441)
- Arin Chandurkar (2024CS50002)


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
