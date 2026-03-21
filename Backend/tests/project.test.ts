import request from 'supertest';
import app from '../server';
import pool from '../config/db';
import bcrypt from 'bcryptjs';

describe('Project & RBAC Endpoints', () => {

    let adminToken: string;
    let userToken: string;
    let createdProjectId: number;

    beforeAll(async () => {
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        await pool.query('TRUNCATE TABLE users');
        await pool.query('TRUNCATE TABLE projects');
        await pool.query('TRUNCATE TABLE project_members');
        await pool.query('TRUNCATE TABLE refresh_tokens');
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        const hash = await bcrypt.hash('password', 10);
        
        // Ensure global admin exists
        const [adminRes] = await pool.query(
            'INSERT INTO users (first_name, surname, emailid, password_hash, global_role) VALUES (?, ?, ?, ?, ?)',
            ['Admin', 'Global', 'admin@workspace.com', hash, 'Global Admin']
        ) as any;
        const adminId = adminRes.insertId;

        // Normal User
        const [userRes] = await pool.query(
            'INSERT INTO users (first_name, surname, emailid, password_hash) VALUES (?, ?, ?, ?)',
            ['Normal', 'User', 'user@example.com', hash]
        ) as any;
        const userId = userRes.insertId;

        // Login Admin
        const adminLogin = await request(app).post('/api/auth/login').send({
            emailid: 'admin@workspace.com',
            password: 'password'
        });
        const adminCookies = adminLogin.header['set-cookie'];
        adminToken = Array.isArray(adminCookies) ? adminCookies.find((c: string) => c.startsWith('accessToken='))?.split(';')[0].split('=')[1] || '' : adminCookies.split(';')[0].split('=')[1];

        // Login User
        const userLogin = await request(app).post('/api/auth/login').send({
            emailid: 'user@example.com',
            password: 'password'
        });
        const userCookies = userLogin.header['set-cookie'];
        userToken = Array.isArray(userCookies) ? userCookies.find((c: string) => c.startsWith('accessToken='))?.split(';')[0].split('=')[1] || '' : userCookies.split(';')[0].split('=')[1];
    });

    afterAll(async () => {
        await pool.end();
    });

    it('should NOT allow a normal user to create a project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Cookie', [`accessToken=${userToken}`])
            .send({ name: 'User Project' });
        
        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('only the global admin can create projects');
    });

    it('should allow the Global Admin to create a project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ name: 'Admin Project', description: 'Test', status: 'Planning' });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toEqual('project created!!');
        expect(res.body.project).toHaveProperty('id');
        createdProjectId = res.body.project.id;
    });

    it('should NOT allow a normal user to delete a project', async () => {
        // First add the normal user to the project as a Project Admin to bypass the membership middleware
        // so we can truly test the Global Admin restriction in the controller
        const [users] = await pool.query('SELECT id FROM users WHERE emailid = ?', ['user@example.com']) as any;
        await pool.query('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [createdProjectId, users[0].id, 'Project Admin']);

        const res = await request(app)
            .delete(`/api/projects/${createdProjectId}`)
            .set('Cookie', [`accessToken=${userToken}`]);
        
        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toContain('only the global workspace admin can delete projects');
    });

    it('should allow the Global Admin to delete a project', async () => {
        const res = await request(app)
            .delete(`/api/projects/${createdProjectId}`)
            .set('Cookie', [`accessToken=${adminToken}`]);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('project deleted successfully');
    });
});
