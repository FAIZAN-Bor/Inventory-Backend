// Environment configuration and validation
import dotenv from 'dotenv';

dotenv.config();

interface Config {
    // Server
    port: number;
    nodeEnv: string;

    // Supabase
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey: string;

    // CORS
    corsOrigin: string[];

    // JWT
    jwtSecret: string;
    jwtExpiresIn: string;
}

const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export const config: Config = {
    // Server
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Supabase
    supabaseUrl: process.env.SUPABASE_URL!.trim(),
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY!.trim(),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),

    // CORS - Support comma separated list
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : ['http://localhost:5173'],

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export default config;
