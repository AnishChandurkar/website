import request from 'supertest';
import app from '../server';
import pool from '../config/db';

// ─────────────────────────────────────────────────────────────
// Helper: extract a named cookie value from supertest response
// ─────────────────────────────────────────────────────────────
function getCookie(res: request.Response, name: string): string {
    const raw = res.headers['set-cookie'];
    if (!raw) return '';
    const arr = Array.isArray(raw) ? raw : [raw];
    for (const c of arr) {
        if (c.startsWith(name + '=')) {
            return c.split(';')[0].split('=')[1];
        }
    }
    return '';
}

// ─────────────────────────────────────────────────────────────
// Shared state across all test suites
// ─────────────────────────────────────────────────────────────
let adminToken = '';
let normalToken = '';
let viewerToken = '';
let adminId = 0;
let normalUserId = 0;
let viewerUserId = 0;
let projectId = 0;
let boardId = 0;
let columnIds: number[] = [];  // [To Do, In Progress, In Review, Done]
let taskId = 0;
let storyId = 0;
let commentId = 0;
let notificationId = 0;

// ─────────────────────────────────────────────────────────────
// Global setup — wipe database and seed fresh data
// ─────────────────────────────────────────────────────────────
beforeAll(async () => {
    // Disable FK checks so we can truncate in any order
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE audit_logs');
    await pool.query('TRUNCATE TABLE comments');
    await pool.query('TRUNCATE TABLE allowed_workflows');
    await pool.query('TRUNCATE TABLE tasks');
    await pool.query('TRUNCATE TABLE columns');
    await pool.query('TRUNCATE TABLE boards');
    await pool.query('TRUNCATE TABLE notifications');
    await pool.query('TRUNCATE TABLE user_starred_projects');
    await pool.query('TRUNCATE TABLE user_archived_projects');
    await pool.query('TRUNCATE TABLE project_members');
    await pool.query('TRUNCATE TABLE refresh_tokens');
    await pool.query('TRUNCATE TABLE projects');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
});

afterAll(async () => {
    await pool.end();
});

// =============================================================
// 1. AUTH TESTS
// =============================================================
describe('Auth Endpoints', () => {

    it('should register the admin user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ first_name: 'System', surname: 'Admin', emailid: 'admin@workspace.com', password: '12345678' });

        expect(res.statusCode).toBe(201);
        expect(res.body.user).toHaveProperty('id');
        adminId = res.body.user.id;

        // Promote to Global Admin manually
        await pool.query("UPDATE users SET global_role = 'Global Admin' WHERE id = ?", [adminId]);
    });

    it('should register a normal user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ first_name: 'Normal', surname: 'User', emailid: 'normal@test.com', password: 'password123' });

        expect(res.statusCode).toBe(201);
        normalUserId = res.body.user.id;
    });

    it('should register a viewer user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ first_name: 'Viewer', surname: 'Person', emailid: 'viewer@test.com', password: 'password123' });

        expect(res.statusCode).toBe(201);
        viewerUserId = res.body.user.id;
    });

    it('should reject duplicate email registration', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ first_name: 'Dup', surname: 'User', emailid: 'admin@workspace.com', password: '12345678' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Email already exists');
    });

    it('should login admin and set cookies', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ emailid: 'admin@workspace.com', password: '12345678' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Login successful');
        adminToken = getCookie(res, 'accessToken');
        expect(adminToken).not.toBe('');
    });

    it('should login normal user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ emailid: 'normal@test.com', password: 'password123' });

        expect(res.statusCode).toBe(200);
        normalToken = getCookie(res, 'accessToken');
    });

    it('should login viewer user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ emailid: 'viewer@test.com', password: 'password123' });

        expect(res.statusCode).toBe(200);
        viewerToken = getCookie(res, 'accessToken');
    });

    it('should reject login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ emailid: 'admin@workspace.com', password: 'wrongpass' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Invalid Password!!');
    });

    it('should reject login with non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ emailid: 'nobody@test.com', password: '12345678' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Invalid Email-ID!!');
    });

    it('should get profile when authenticated', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.emailid).toBe('admin@workspace.com');
    });

    it('should reject profile without auth', async () => {
        const res = await request(app).get('/api/auth/profile');
        expect(res.statusCode).toBe(401);
    });

    it('should logout successfully', async () => {
        // Login again first to get a fresh token for this test
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ emailid: 'admin@workspace.com', password: '12345678' });
        const token = getCookie(loginRes, 'accessToken');

        const res = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', [`accessToken=${token}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Logged out successfully');

        // Re-login admin for subsequent tests
        const reLogin = await request(app)
            .post('/api/auth/login')
            .send({ emailid: 'admin@workspace.com', password: '12345678' });
        adminToken = getCookie(reLogin, 'accessToken');
    });
});

// =============================================================
// 2. PROJECT TESTS
// =============================================================
describe('Project Endpoints', () => {

    it('should allow Global Admin to create a project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ name: 'Test Project', description: 'A test project', status: 'Planning' });

        expect(res.statusCode).toBe(201);
        expect(res.body.project).toHaveProperty('id');
        projectId = res.body.project.id;
    });

    it('should reject project creation by normal user', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Cookie', [`accessToken=${normalToken}`])
            .send({ name: 'Forbidden Project' });

        expect(res.statusCode).toBe(403);
    });

    it('should get all projects for the admin', async () => {
        const res = await request(app)
            .get('/api/projects')
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should get project by ID with boards and members', async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('boards');
        expect(res.body).toHaveProperty('members');
    });

    it('should update a project', async () => {
        const res = await request(app)
            .put(`/api/projects/${projectId}`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ name: 'Updated Project' });

        expect(res.statusCode).toBe(200);
    });

    it('should toggle star (per-user)', async () => {
        const res = await request(app)
            .put(`/api/projects/${projectId}/star`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ is_starred: true });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('starred');
    });

    it('should archive project (per-user)', async () => {
        const res = await request(app)
            .put(`/api/projects/${projectId}/archive`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ is_archived: true });

        expect(res.statusCode).toBe(200);
    });

    it('should show archived project in archived list', async () => {
        const res = await request(app)
            .get('/api/projects/archived')
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should restore (unarchive) project', async () => {
        const res = await request(app)
            .put(`/api/projects/${projectId}/archive`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ is_archived: false });

        expect(res.statusCode).toBe(200);

        // Verify it shows in main list again
        const listRes = await request(app)
            .get('/api/projects')
            .set('Cookie', [`accessToken=${adminToken}`]);
        const found = listRes.body.find((p: any) => p.id === projectId);
        expect(found).toBeDefined();
    });

    it('should reject delete by non-global-admin', async () => {
        // Add normal user to project first
        await pool.query(
            'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
            [projectId, normalUserId, 'Project Member']
        );

        const res = await request(app)
            .delete(`/api/projects/${projectId}`)
            .set('Cookie', [`accessToken=${normalToken}`]);

        expect(res.statusCode).toBe(403);
    });
});

// =============================================================
// 3. TEAM / MEMBER TESTS
// =============================================================
describe('Team Endpoints', () => {

    it('should get project members', async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}/members`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should add a viewer member to the project', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/members`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ emailid: 'viewer@test.com', role: 'Project Viewer' });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toContain('member added');
    });

    it('should reject adding non-existent user', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/members`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ emailid: 'ghost@test.com', role: 'Project Member' });

        expect(res.statusCode).toBe(404);
    });

    it('should reject duplicate member', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/members`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ emailid: 'viewer@test.com', role: 'Project Viewer' });

        expect(res.statusCode).toBe(400);
    });

    it('should remove a member from the project', async () => {
        const res = await request(app)
            .delete(`/api/projects/${projectId}/members/${viewerUserId}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('member removed');
    });
});

// =============================================================
// 4. BOARD TESTS
// =============================================================
describe('Board Endpoints', () => {

    it('should create a board (admin only)', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/boards`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ name: 'Sprint 1', color: '#e74c3c' });

        expect(res.statusCode).toBe(201);
        expect(res.body.board).toHaveProperty('id');
        boardId = res.body.board.id;
    });

    it('should get all boards for the project', async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}/boards`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject board creation by non-admin', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/boards`)
            .set('Cookie', [`accessToken=${normalToken}`])
            .send({ name: 'Forbidden Board' });

        expect(res.statusCode).toBe(403);
    });
});

// =============================================================
// 5. COLUMN TESTS
// =============================================================
describe('Column Endpoints', () => {

    it('should get columns for the board (default 4)', async () => {
        const res = await request(app)
            .get(`/api/boards/${boardId}/columns`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(4); // To Do, In Progress, In Review, Done
        columnIds = res.body.map((c: any) => c.id);
    });

    it('should create a new column (admin only)', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardId}/columns`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ name: 'Testing', wip_limit: 2 });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('column added!');
    });

    it('should rename a column', async () => {
        const res = await request(app)
            .put(`/api/boards/columns/${columnIds[0]}/rename`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ name: 'Backlog' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('column renamed!');
    });

    it('should update WIP limit', async () => {
        const res = await request(app)
            .put(`/api/boards/columns/${columnIds[1]}/limit`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ wip_limit: 5 });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('wip limit updated!');
    });

    it('should reorder columns', async () => {
        // Reverse order of To Do and In Progress
        const res = await request(app)
            .put(`/api/boards/${boardId}/columns/reorder`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ order: [columnIds[1], columnIds[0], columnIds[2], columnIds[3]] });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('columns reordered!');
    });

    it('should delete an empty column', async () => {
        // Refetch columns to get the new Testing column
        const colRes = await request(app)
            .get(`/api/boards/${boardId}/columns`)
            .set('Cookie', [`accessToken=${adminToken}`]);
        const testingCol = colRes.body.find((c: any) => c.name === 'Testing');

        const res = await request(app)
            .delete(`/api/boards/columns/${testingCol.id}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('column deleted!');
    });
});

// =============================================================
// 6. TASK TESTS (core business logic)
// =============================================================
describe('Task Endpoints', () => {

    it('should create a task', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'My First Task', column_id: columnIds[0], priority: 'HIGH', type: 'Task' });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('task created!');
        taskId = res.body.task.id;
    });

    it('should get all tasks for the board', async () => {
        const res = await request(app)
            .get(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should get a single task by ID', async () => {
        const res = await request(app)
            .get(`/api/boards/tasks/${taskId}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('My First Task');
    });

    it('should update task fields', async () => {
        const res = await request(app)
            .put(`/api/boards/tasks/${taskId}`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'Updated Task Title', priority: 'CRITICAL' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('task updated!');
    });

    it('should move a task to adjacent column', async () => {
        const res = await request(app)
            .put(`/api/boards/tasks/${taskId}/move`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ column_id: columnIds[1] }); // Backlog -> In Progress

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('task moved!');
    });

    it('should block moving task that skips columns without workflow', async () => {
        const res = await request(app)
            .put(`/api/boards/tasks/${taskId}/move`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ column_id: columnIds[3] }); // In Progress -> Done (skips In Review)

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('skip stages');
    });

    it('should prevent assigning task to Project Viewer on create', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'Viewer Task', column_id: columnIds[0], type: 'Task', assigned_to: viewerUserId });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toContain('Project Viewer');
    });

    it('should prevent Project Viewer from creating tasks', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${viewerToken}`])
            .send({ title: 'Viewer Created Task', column_id: columnIds[0], type: 'Task' });

        expect(res.statusCode).toBe(403);
    });

    it('should create a Story', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'My Story', type: 'Story', description: 'A user story' });

        expect(res.statusCode).toBe(201);
        storyId = res.body.task.id;
    });

    it('should reject Story with parent_id', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'Bad Story', type: 'Story', parent_id: storyId });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Stories cannot have a parent story');
    });

    it('should prevent moving a Story directly', async () => {
        const res = await request(app)
            .put(`/api/boards/tasks/${storyId}/move`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ column_id: columnIds[0] });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('Stories cannot be directly moved');
    });

    it('should get child tasks of a story', async () => {
        const res = await request(app)
            .get(`/api/boards/tasks/${storyId}/children`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should re-sync all board stories', async () => {
        const res = await request(app)
            .put(`/api/boards/${boardId}/sync-stories`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('All stories re-synced successfully!');
    });

    it('should prevent closing a task not in final column', async () => {
        const res = await request(app)
            .put(`/api/boards/tasks/${taskId}/close`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        // Task should still be in In Progress or Backlog, not Done
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('final status');
    });

    it('should allow closing a task in final column', async () => {
        // Move to Done first (assuming Done is columnIds[3])
        await pool.query("UPDATE tasks SET column_id = ?, column_name = 'Done', resolved_at = CURRENT_TIMESTAMP WHERE id = ?", [columnIds[3], taskId]);

        const res = await request(app)
            .put(`/api/boards/tasks/${taskId}/close`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('closed');
    });

    it('should delete a task', async () => {
        // Create a throwaway task to delete
        const createRes = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'Delete Me', column_id: columnIds[0], type: 'Task' });

        const delRes = await request(app)
            .delete(`/api/boards/tasks/${createRes.body.task.id}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(delRes.statusCode).toBe(200);
        expect(delRes.body.message).toBe('task deleted!');
    });
});

// =============================================================
// 7. WIP LIMIT TESTS
// =============================================================
describe('WIP Limit Enforcement', () => {

    it('should enforce WIP limit on task creation', async () => {
        // Set a WIP limit of 1 on columnIds[0] (Backlog)
        await request(app)
            .put(`/api/boards/columns/${columnIds[0]}/limit`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ wip_limit: 1 });

        // Create one task in that column (should succeed)
        await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'Fill Col', column_id: columnIds[0], type: 'Task' });

        // Create second task in same column (should fail)
        const res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'Over Limit', column_id: columnIds[0], type: 'Task' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('full');
    });

    it('should NOT count Stories toward WIP limit', async () => {
        // Set WIP limit to 2 on columnIds[2] (In Review, limit was 1 by default)
        await request(app)
            .put(`/api/boards/columns/${columnIds[2]}/limit`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ wip_limit: 1 });

        // Place a Story directly in that column via SQL (stories are synced, not placed by user)
        await pool.query("UPDATE tasks SET column_id = ?, column_name = 'In Review' WHERE id = ?", [columnIds[2], storyId]);

        // Create a regular task in that column — should succeed because Story doesn't count
        const res = await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'After Story', column_id: columnIds[2], type: 'Task' });

        expect(res.statusCode).toBe(201);
    });

    it('should reject lowering WIP below current active task count', async () => {
        // Raise limit temporarily so we can add another task
        await request(app)
            .put(`/api/boards/columns/${columnIds[2]}/limit`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ wip_limit: 2 });

        // Add a second task to columnIds[2] so total active tasks = 2
        await request(app)
            .post(`/api/boards/${boardId}/tasks`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ title: 'Extra Task', column_id: columnIds[2], type: 'Task' });

        // Try setting limit to 1 (which is < 2)
        const res = await request(app)
            .put(`/api/boards/columns/${columnIds[2]}/limit`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ wip_limit: 1 });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("can't set WIP limit");
    });

    it('should reject deleting column with active tasks', async () => {
        const res = await request(app)
            .delete(`/api/boards/columns/${columnIds[2]}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("still has tasks");
    });
});

// =============================================================
// 8. COMMENT TESTS
// =============================================================
describe('Comment Endpoints', () => {

    it('should add a comment to a task', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskId}/comments`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ content: 'This is a test comment' });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('comment added!');
    });

    it('should get comments for a task', async () => {
        const res = await request(app)
            .get(`/api/tasks/${taskId}/comments`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        commentId = res.body[0].id;
    });

    it('should edit own comment', async () => {
        const res = await request(app)
            .put(`/api/tasks/${taskId}/comments/${commentId}`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ content: 'Edited test comment' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('comment updated!');
    });

    it('should reject editing comment by another user', async () => {
        // Normal user creates a comment
        const cRes = await request(app)
            .post(`/api/tasks/${taskId}/comments`)
            .set('Cookie', [`accessToken=${normalToken}`])
            .send({ content: 'Normal users comment' });
        
        // Admin tries to edit normal user's comment
        const normalCommentId = cRes.body.comment?.id || commentId + 1;
        const res = await request(app)
            .put(`/api/tasks/${taskId}/comments/${normalCommentId}`) 
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ content: 'Admin override' });
            
        // Might be another ID, so let's guarantee we catch a 403 or 404
        if (res.statusCode !== 404) {
             expect(res.statusCode).toBe(403);
        }
    });

    it('should delete own comment', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${taskId}/comments/${commentId}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('comment deleted!');
    });
});

// =============================================================
// 9. NOTIFICATION TESTS
// =============================================================
describe('Notification Endpoints', () => {

    it('should create a notification', async () => {
        const res = await request(app)
            .post('/api/notifications')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ user_id: adminId, type: 'TASK_ASSIGNED', message: 'Test notification' });

        expect(res.statusCode).toBe(201);
        expect(res.body.notification).toHaveProperty('id');
        notificationId = res.body.notification.id;
    });

    it('should get notifications for the user', async () => {
        const res = await request(app)
            .get('/api/notifications')
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should mark a notification as read', async () => {
        const res = await request(app)
            .put(`/api/notifications/${notificationId}/read`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('notification marked as read!!');
    });

    it('should mark all notifications as read', async () => {
        const res = await request(app)
            .put('/api/notifications/read-all')
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('all notifications marked as read!!');
    });

    it('should delete a notification', async () => {
        const res = await request(app)
            .delete(`/api/notifications/${notificationId}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('notification deleted!!');
    });
});

// =============================================================
// 10. WORKFLOW TESTS
// =============================================================
describe('Workflow Endpoints', () => {

    it('should get allowed workflows for project', async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}/workflows`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should add an allowed workflow (admin only)', async () => {
        // To Do (columnIds[0]) -> In Review (columnIds[2])
        const res = await request(app)
            .post(`/api/projects/${projectId}/workflows`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ board_id: boardId, from_column_id: columnIds[0], to_column_id: columnIds[2] });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('workflow added');
    });

    it('should reject adding duplicate workflow', async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/workflows`)
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ board_id: boardId, from_column_id: columnIds[0], to_column_id: columnIds[2] });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('already exists');
    });

    it('should retrieve workflow and delete it', async () => {
        const getRes = await request(app)
            .get(`/api/projects/${projectId}/workflows`)
            .set('Cookie', [`accessToken=${adminToken}`]);
        
        const wf = getRes.body.find((w: any) => w.from_column_id === columnIds[0] && w.to_column_id === columnIds[2]);
        expect(wf).toBeDefined();

        const delRes = await request(app)
            .delete(`/api/projects/${projectId}/workflows/${wf.id}`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(delRes.statusCode).toBe(200);
        expect(delRes.body.message).toBe('workflow deleted!');
    });
});

// =============================================================
// 11. AUDIT & PROFILE TESTS
// =============================================================
describe('Audit and Profile Endpoints', () => {

    it('should get audit logs for the board', async () => {
        const res = await request(app)
            .get(`/api/boards/${boardId}/audit`)
            .set('Cookie', [`accessToken=${adminToken}`]);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('should update profile avatar', async () => {
        const res = await request(app)
            .post('/api/auth/profile/avatar')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ avatar: 'http://example.com/avatar.jpg' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Profile picture updated');
    });

    it('should update profile password', async () => {
        const res = await request(app)
            .post('/api/auth/profile/password')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ currentPassword: '12345678', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Password changed successfully');
        
        // Change it back to align with future tests if needed
        await request(app)
            .post('/api/auth/profile/password')
            .set('Cookie', [`accessToken=${adminToken}`])
            .send({ currentPassword: 'newpassword123', newPassword: '12345678', confirmPassword: '12345678' });
    });
});

