import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/auth';

export const generateToken = () => {
  const payload = {
    role: 'api_user',
    timestamp: new Date().toISOString()
  };

  const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: '24h' });
  
  return {
    token,
    expiresIn: jwtConfig.expiresIn
  };
};
