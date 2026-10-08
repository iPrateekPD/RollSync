import { Router } from 'express';

const router = Router();

// Mock Login for Phase 4 testing
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (password === 'password123') {
    res.json({
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '123',
        email: email,
        role: 'TEACHER',
        firstName: 'Prateek',
        lastName: 'PD'
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials. Password must be "password123"' });
  }
});

router.get('/me', (req, res) => {
  res.json({
    id: '123',
    email: 'teacher@rollsync.com',
    role: 'TEACHER',
    firstName: 'Prateek',
    lastName: 'PD'
  });
});

export default router;
