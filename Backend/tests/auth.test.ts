import request from 'supertest';
import app from '../server';
import pool from '../config/db';

describe('Auth Endpoints', () => {

    beforeAll(async () => {
        await pool.query('DELETE FROM users WHERE emailid = ?', ['testuser@example.com']);
    });

    afterAll(async () => {
        await pool.end();
    });

    const testUser = {
        first_name: 'Test',
        surname: 'User',
        emailid: 'testuser@example.com',
        password: 'password123'
    };

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should fail to register the same user again', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Email already exists');
    });

    it('should login the user and return tokens', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                emailid: testUser.emailid,
                password: testUser.password
            });
        
        if(res.statusCode !== 200) console.log("LOGIN FAILED:", res.statusCode, res.body);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('emailid', testUser.emailid);
        
        // Check cookies
        const statusHeader = res.header['set-cookie'];
        expect(statusHeader).toBeDefined();
        const cookies = Array.isArray(statusHeader) ? statusHeader.join(' ') : statusHeader;
        expect(cookies).toContain('accessToken');
        expect(cookies).toContain('refreshToken');
    });

    it('should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                emailid: testUser.emailid,
                password: 'wrong-password'
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Invalid Password!!');
    });
});
