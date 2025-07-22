// Validasi environment variables
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
  
  // Validasi format Stripe key
  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('❌ Invalid Stripe secret key format');
    process.exit(1);
  }
  
  console.log('✅ All environment variables validated');
};
