// Environment configuration
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.VITE_NODE_ENV === 'development',
  IS_PRODUCTION: import.meta.env.VITE_NODE_ENV === 'production',
};
