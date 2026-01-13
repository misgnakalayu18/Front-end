// utils/config.ts
export const config = {
  baseUrl: import.meta.env.VITE_BASE_URL,
  
  // For debugging - remove after checking
  debug: {
    mode: import.meta.env.MODE,
    baseUrl: import.meta.env.VITE_BASE_URL,
    allEnv: import.meta.env
  }
};

// Also add this to log immediately
console.log('🟢 Config loaded:', {
  mode: import.meta.env.MODE,
  baseUrl: import.meta.env.VITE_BASE_URL,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV
});