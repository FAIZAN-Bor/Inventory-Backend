// Supabase client configuration and initialization
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './index';

// Public client (uses anon key - respects RLS policies)
export const supabase: SupabaseClient = createClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: false,
        },
    }
);

// Admin client (uses service role key - bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Create a client with user's access token for authenticated requests
export const createSupabaseClient = (accessToken: string): SupabaseClient => {
    return createClient(config.supabaseUrl, config.supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

export default supabase;
