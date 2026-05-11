// Environment configuration
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.VITE_NODE_ENV === 'development',
  IS_PRODUCTION: import.meta.env.VITE_NODE_ENV === 'production',
  /**
   * P1-01 (audit DevTools): DevTools simulator (`/admin/dev-tools`) HARUS
   * dimatikan di production. Default false; eksplisitkan VITE_ENABLE_DEV_TOOLS=true
   * di env development/staging untuk membuka surface ini. Production wajib false.
   */
  ENABLE_DEV_TOOLS:
    import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' ||
    import.meta.env.DEV,
};
