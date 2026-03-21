import request from 'supertest';
import app from '../server';
import pool from '../config/db';
import bcrypt from 'bcryptjs';

describe('Task Workflow & WIP Limits (Business Logic)', () => {
    let adminToken: string;
    let projectId: number;
    let boardId: number;
    let todoColumnId: number;
    let inProgressColumnId: number;
    let taskId: number;

    beforeAll(async () => {
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE users');
        await pool.query('TRUNCATE TABLE projects');
        await pool.query('TRUNCATE TABLE boards');
        await pool.query('TRUNCATE TABLE columns');
        await pool.query('TRUNCATE TABLE tasks');
        await pool.query('TRUNCATE TABLE project_members');
        await pool.query('TRUNCATE TABLE allowed_workflows');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        const hash = await bcrypt.hash('password123', 10);
        
        // Seed Global Admin
        const [adminRes] = await pool.query(
            'INSERT INTO users (first_name, surname, emailid, password_hash, global_role) VALUES (?, ?, ?, ?, ?)',
            ['Admin', 'User', 'admin@workspace.com', hash, 'Global Admin']
        ) as any;
        
        // Login Admin
        const adminLogin = await request(app).post('/api/auth/login').send({
            emailid: 'admin@workspace.com',
            password: 'password123'
        });
        const adminCookies = adminLogin.header['set-cookie'];
        adminToken = Array.isArray(adminCookies) ? adminCookies.find((c: string) => c.startsWith('accessToken='))?.split(';')[0].split('=')[1] || '' : adminCookies.split(';')[0].split('=')[1];

        // Setup Workspace Hierarchy
        // 1. Project
        const projectRes = await request(app)
            .post('/api/projects')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ name: 'Business Logic Project', description: 'Testing Workflow limits' });
        projectId = projectRes.body.project.id;

        // 2. Board
        const boardRes = await request(app)
            .post(`/api/projects/${projectId}/boards`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ name: 'Strict Workflow Board', description: 'Testing WIP' });
        boardId = boardRes.body.board.id;

        // Note: The board controller auto-creates columns: To Do, In Progress, In Review, Done
        // Let's fetch the columns to get their IDs
        const [columns] = await pool.query('SELECT id, name, wip_limit FROM columns WHERE board_id = ? ORDER BY position ASC', [boardId]) as any;
        todoColumnId = columns.find((c: any) => c.name === 'To Do').id;
        inProgressColumnId = columns.find((c: any) => c.name === 'In Progress').id;
        
        // Let's modify the WIP limit of 'In Progress' to 1 for testing
        await pool.query('UPDATE columns SET wip_limit = 1 WHERE id = ?', [inProgressColumnId]);
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should create a task successfully inside To Do', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({
                title: 'Test Task 1',
                description: 'We will test moving this',
                column_id: todoColumnId,
                priority: 'High',
                task_type: 'Task'
            });
        
        expect(res.statusCode).toEqual(201);
        taskId = res.body.task.id;
    });

    it('should allow moving the task within allowed workflow bounds', async () => {
        const res = await request(app)
            .put(`/api/boards/tasks/${taskId}/move`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ column_id: inProgressColumnId });
        
        if (res.statusCode !== 200) console.log("MOVE TASK ERROR:", res.statusCode, res.body, "taskId:", taskId, "URL:", `/api/boards/tasks/${taskId}/move`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('task moved!');
    });

    it('should REJECT moving another task if the WIP limit is exceeded', async () => {
        // Create second task in To Do
        const task2Res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({
                title: 'Test Task 2',
                description: 'This will exceed the WIP limit',
                column_id: todoColumnId,
                priority: 'Low',
                task_type: 'Task'
            });
        
        const task2Id = task2Res.body.task.id;

        // Attempt to move it to 'In Progress' which now has 1 task and a WIP limit of 1
        const res = await request(app)
            .put(`/api/boards/tasks/${task2Id}/move`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ column_id: inProgressColumnId });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('limit');
    });

});
