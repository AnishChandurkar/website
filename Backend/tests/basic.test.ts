import request from 'supertest';
import app from '../server';
import pool from '../config/db';

describe('Basic API endpoints', () => {
    
    // Close DB connection after tests
    afterAll(async () => {
        await pool.end();
    });

    it('should return 200 for the test endpoint', async () => {
        const res = await request(app).get('/api/test');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'backend is connected to mysql!');
    });

    it('should return 404 for non-existent routes', async () => {
        const res = await request(app).get('/api/this-does-not-exist');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('message', "Oh no! There's nothing at this endpoint :/");
    });
});
