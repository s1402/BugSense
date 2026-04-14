import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

jest.unstable_mockModule('../../../src/models/User.js', () => ({
  User: { findById: jest.fn() },
}));

const { User } = await import('../../../src/models/User.js');
const { protect } = await import('../../../src/middleware/auth.js');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth middleware: protect', () => {
  const ORIGINAL_SECRET = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_for_jwt_signing';
  });

  afterAll(() => {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects requests with no Authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a malformed Authorization header', async () => {
    const req = { headers: { authorization: 'Token abc' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid JWT', async () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a valid token when the user no longer exists', async () => {
    const token = jwt.sign({ id: 'missing-user-id' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    User.findById.mockResolvedValue(null);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('missing-user-id');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user to req and calls next for a valid token', async () => {
    const fakeUser = { _id: 'u1', email: 'a@b.com', name: 'Alice' };
    const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    User.findById.mockResolvedValue(fakeUser);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(req.user).toBe(fakeUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
