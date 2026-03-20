import pool from './config/db';

async function migrate() {
    try {
        await pool.query(`
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
        `);
        console.log("Migration successful: allowed_workflows table created.");
        process.exit(0);
    } catch (e: any) {
        console.error("Migration failed:", e.message);
        process.exit(1);
    }
}
migrate();
