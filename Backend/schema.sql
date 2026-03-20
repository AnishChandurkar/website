CREATE DATABASE IF NOT EXISTS workspace_db;
USE workspace_db;

-- Users Table (Base table)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    emailid VARCHAR(670) NOT NULL UNIQUE,
    password_hash VARCHAR(300) NOT NULL,
    profile_url VARCHAR(500) DEFAULT NULL,
    global_role ENUM('Global Admin', 'User') DEFAULT 'User',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Refresh Tokens Table (Requirement: Session renewal & Logout invalidation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects Table (References Users)
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('In Progress', 'Completed', 'Planning', 'On Hold', 'Review') DEFAULT 'Planning',
    progress INT DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Project Members Table (Bridge for Projects and Users - Role-Based Access Control)
CREATE TABLE IF NOT EXISTS project_members (
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('Project Admin', 'Project Member', 'Project Viewer') DEFAULT 'Project Member',
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Boards Table (References Projects)
CREATE TABLE IF NOT EXISTS boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    project_id INT NOT NULL,
    color VARCHAR(7) DEFAULT '#3498db',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Columns Table for Configurable Workflows (References Boards)
CREATE TABLE IF NOT EXISTS columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    board_id INT NOT NULL,
    position INT NOT NULL, -- To maintain ordering (e.g., 1 for To Do, 2 for In Progress)
    wip_limit INT DEFAULT NULL, -- Null means no limit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Tasks/Issues Table (References Boards, Columns, and Users)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('Story', 'Task', 'Bug') NOT NULL,
    parent_id INT DEFAULT NULL, -- To link Task/Bug to an overarching Story
    board_id INT NOT NULL,
    column_id INT DEFAULT NULL, -- Replacing strictly defined 'status'. Tasks sit in columns.
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
    assigned_to INT DEFAULT NULL,
    reporter_id INT NOT NULL,
    due_date DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments Table (References Tasks and Users)
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Trail Table (Mandatory Requirement)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    event_type ENUM('STATUS_CHANGE', 'ASSIGNEE_CHANGE', 'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED') NOT NULL,
    old_value VARCHAR(255) DEFAULT NULL,
    new_value VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table (References Users)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('TASK_ASSIGNED', 'STATUS_CHANGED', 'COMMENT_ADDED', 'USER_MENTIONED') NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Allowed Workflows Table (References Boards and Columns)
CREATE TABLE IF NOT EXISTS allowed_workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    from_column_id INT NOT NULL,
    to_column_id INT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (from_column_id) REFERENCES columns(id) ON DELETE CASCADE,
    FOREIGN KEY (to_column_id) REFERENCES columns(id) ON DELETE CASCADE,
    UNIQUE(from_column_id, to_column_id)
);
