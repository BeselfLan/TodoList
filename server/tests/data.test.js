import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import createApp from '../app.js';

const JWT_SECRET = process.env.JWT_SECRET;
const USER_ID = 'test-user@example.com';

// A stand-in for server/database. Only the HTTP layer is under test here:
// auth, validation, status codes, and the shape of the response. Whether the
// SQL is correct is a different question, answered by an integration test that
// talks to a real Postgres.
const db = {
    initializeDatabase: vi.fn(),
    listDates: vi.fn(),
    getItemsForDate: vi.fn(),
    saveItemsForDate: vi.fn(),
};

const app = createApp({ db, jwtSecret: JWT_SECRET });

// Mirrors what POST /auth/google mints: the subject claim carries the user id,
// and requireAuth reads it back out of the verified token.
const signToken = (subject = USER_ID, options = {}) => jwt.sign(
    { email: subject },
    JWT_SECRET,
    { subject, expiresIn: '7d', ...options },
);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('GET /data/:year/:month/:day', () => {
    it('rejects a request with no Authorization header', async () => {
        const response = await request(app).get('/data/2026/08/08');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Missing session token');
        // The guard must run before anything touches the database.
        expect(db.getItemsForDate).not.toHaveBeenCalled();
    });

    it('rejects a token signed with the wrong secret', async () => {
        const forged = jwt.sign({}, 'some-other-secret', { subject: USER_ID });

        const response = await request(app)
            .get('/data/2026/08/08')
            .set('Authorization', `Bearer ${forged}`);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid or expired session token');
        expect(db.getItemsForDate).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
        const expired = signToken(USER_ID, { expiresIn: '-1s' });

        const response = await request(app)
            .get('/data/2026/08/08')
            .set('Authorization', `Bearer ${expired}`);

        expect(response.status).toBe(401);
        expect(db.getItemsForDate).not.toHaveBeenCalled();
    });

    it('rejects a malformed date before querying', async () => {
        const response = await request(app)
            .get('/data/2026/13/40')
            .set('Authorization', `Bearer ${signToken()}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/Expected format YYYY\/MM\/DD/);
        expect(db.getItemsForDate).not.toHaveBeenCalled();
    });

    it('returns the items for a valid request', async () => {
        const items = [
            { id: 0, title: 'Milk', content: 'Buy 2%', completed: false },
            { id: 1, title: 'Post office', content: 'Before 5pm', completed: true },
        ];
        db.getItemsForDate.mockResolvedValue(items);

        const response = await request(app)
            .get('/data/2026/08/08')
            .set('Authorization', `Bearer ${signToken()}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(items);
        // The date is normalised to the dashed key the table stores.
        expect(db.getItemsForDate).toHaveBeenCalledWith(USER_ID, '2026-08-08');
    });

    it('scopes the query to the user named in the token', async () => {
        db.getItemsForDate.mockResolvedValue([]);

        await request(app)
            .get('/data/2026/08/08')
            .set('Authorization', `Bearer ${signToken('someone-else@example.com')}`);

        // This is the assertion that matters: the user id comes from the
        // verified token, never from the URL, the body, or a header.
        expect(db.getItemsForDate).toHaveBeenCalledWith('someone-else@example.com', '2026-08-08');
    });

    it('returns 500 without leaking the database error', async () => {
        db.getItemsForDate.mockRejectedValue(new Error('connection terminated'));
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const response = await request(app)
            .get('/data/2026/08/08')
            .set('Authorization', `Bearer ${signToken()}`);

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to load items from database');
        expect(JSON.stringify(response.body)).not.toMatch(/connection terminated/);
    });
});

describe('GET /data', () => {
    it('returns a list of dates', async () => {
        const dates = ['2025/08/08', '2026/08/08'];
        db.listDates.mockResolvedValue(dates);

        const response = await request(app)
            .get('/data')
            .set('Authorization', `Bearer ${signToken()}`);
        
        expect(db.listDates).toHaveBeenCalled();
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ dates: dates });
    });
    it('rejects unauthorized access', async () => { 
        const forged = jwt.sign({}, 'some-other-secret', { subject: USER_ID });
        const dates = {
            dates: ['2025/08/08', '2026/08/08']
        };
        db.listDates.mockResolvedValue(dates);

        const response = await request(app)
            .get('/data')
            .set('Authorization', `Bearer ${forged}`);

        expect(response.status).toBe(401);
        expect(db.listDates).not.toHaveBeenCalled();
    })
});

describe('POST /data', () => {
    it('updates the database for valid input', async () => {
        const body = {
            '2026/08/08': [
                { id: 0, title: 'Milk', content: 'Buy 2%', completed: false },
            ],
        };

        const response = await request(app)
            .post('/data')
            .set('Authorization', `Bearer ${signToken()}`)
            .send(body);
        
        expect(response.status).toBe(200);
        expect(db.saveItemsForDate).toHaveBeenCalled(); 
    });
    it('rejects unauthorized requests', async () => {
        const body = {
            '2026/08/08': [
                { id: 0, title: 'Milk', content: 'Buy 2%', completed: false },
            ],
        };
        const forged = jwt.sign({}, 'some-other-secret', { subject: USER_ID });

        const response = await request(app)
            .post('/data')
            .set('Authorization', `Bearer ${forged}`)
            .send(body);
        
        expect(response.status).toBe(401);
        expect(db.saveItemsForDate).not.toHaveBeenCalled();
    });
});

describe('GET /health', () => {
    it('checks if backend is responsive', async () => { 
        const response = await request(app)
            .get('/health')
        
        expect(response.status).toBe(200);
        expect(response.text).toBe('ok');
    })
});
