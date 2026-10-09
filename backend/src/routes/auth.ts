import { Router } from 'express';

const router = Router();

// Mock Login for Phase 4 testing
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (password === 'password123') {
    let role = 'TEACHER';
    let firstName = 'Prateek';
    let lastName = 'PD';

    if (email.toLowerCase().includes('admin')) {
      role = 'ADMIN';
      firstName = 'Admin';
      lastName = 'User';
    } else if (email.toLowerCase().includes('student')) {
      role = 'STUDENT';
      firstName = 'Student';
      lastName = 'User';
    }

    res.json({
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '123',
        email: email,
        role: role,
        firstName: firstName,
        lastName: lastName
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
