// Authentication Configuration
// Set AUTH_ENABLED=true to require login for user-specific data (cart, orders)
// Set AUTH_ENABLED=false to use shared/anonymous data (original behavior)

export const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';

// JWT secret - in production, use a strong random string from environment
export const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce-jwt-secret-change-in-production';

// JWT expiration time
export const JWT_EXPIRES_IN = '7d';

// Default user ID used when auth is disabled (for backwards compatibility)
export const DEFAULT_USER_ID = 'f3b4e2a1-9c8d-4e7f-a6b5-3c2d1e0f9a8b';
