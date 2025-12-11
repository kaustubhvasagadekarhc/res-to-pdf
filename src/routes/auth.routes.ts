import { Router } from 'express';
import {
  getToken,
  login,
  register,
  resendOtp,
  verifyOtp,
  logout,
  me,
} from '../controllers/auth.controller';

const router = Router();

router.get('/token', getToken);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/logout', logout);
router.get('/me', me);

export default router;
