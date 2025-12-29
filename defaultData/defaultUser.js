import { DEFAULT_USER_ID } from '../config/auth.js';

// Default user credentials for testing when auth is enabled
// Email: default@example.com
// Password: defaultpassword
export const defaultUser = {
  id: DEFAULT_USER_ID,
  email: 'default@example.com',
  // This will be replaced with actual hash when creating
  password: 'password123'
};
