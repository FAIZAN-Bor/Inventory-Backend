// Auth service - business logic for authentication operations
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';
import { config } from '../config';
import { LoginCredentials, RegisterData, AuthResponse } from '../types';
import { UnauthorizedError, BadRequestError } from '../utils';

// Helper to get company name
const getCompanyName = async (companyId: string | undefined): Promise<string> => {
    if (!companyId) return '';
    const { data } = await supabaseAdmin
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
    return data?.name || '';
};

// Helper to get company info from public user table
const getPublicUserCompany = async (email: string): Promise<{ id: string, name: string } | null> => {
    const { data } = await supabaseAdmin
        .from('users')
        .select(`
            company_id,
            company:companies(name)
        `)
        .eq('email', email)
        .single();

    if (data && data.company) {
        return {
            id: data.company_id,
            name: (data.company as any).name
        };
    }
    return null;
};

// Helper to get ephemeral client for auth ops
const getEphemeralClient = () => {
    return createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Use ephemeral client to avoid shared state on singleton
    const supabase = getEphemeralClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
    });

    if (error || !data.user) {
        console.warn('Login failed:', error?.message);
        throw new UnauthorizedError('Incorrect email or password');
    }

    let companyId = data.user.user_metadata?.company_id;
    let companyName = data.user.user_metadata?.company_name;

    // Fallback: If metadata missing, check public users table
    if (!companyId) {
        const publicInfo = await getPublicUserCompany(data.user.email!);
        if (publicInfo) {
            companyId = publicInfo.id;
            companyName = publicInfo.name;

            // Auto-heal: Update auth metadata
            await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
                user_metadata: {
                    ...data.user.user_metadata,
                    company_id: companyId,
                    company_name: companyName
                }
            });
        }
    } else if (!companyName) {
        // If we have ID but no name, fetch name
        companyName = await getCompanyName(companyId);
    }

    return {
        user: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || '',
            role: data.user.user_metadata?.role || 'staff',
            is_active: true,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || data.user.created_at,
            company_id: companyId,
            company_name: companyName,
        },
        accessToken: data.session!.access_token,
        refreshToken: data.session!.refresh_token,
    };
};

// Helper to sync user to public table
const syncPublicUser = async (user: any, metadata: any) => {
    // Check if user already exists in public table
    const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

    if (existing) return;

    // Use auth ID as public ID if possible, otherwise let DB generate one
    // But since we want 1:1, we should try to force it or link them. 
    // The current schema uses gen_random_uuid() for ID, so we can't easily force it 
    // unless we change the schema. For now, we'll insert with a new ID but linked via email.
    // Ideally we would have an auth_id column.

    const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
            company_id: metadata.company_id,
            email: user.email,
            name: metadata.name,
            role: metadata.role || 'staff',
            is_active: true,
            // We don't set ID here, let it auto-generate. 
            // In a better schema, we'd set id: user.id
        });

    if (insertError) {
        console.error('Failed to sync public user:', insertError);
        // Don't throw here, as auth user is created. 
        // We can let them login, but they might be missing form lists.
    }
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
    let authUser: any;

    // Fetch company name for metadata
    const companyName = await getCompanyName(data.company_id);

    try {
        // 1. Create user with auto-confirmation using Admin API
        const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                name: data.name,
                role: data.role || 'staff',
                company_id: data.company_id,
                company_name: companyName, // Store it in metadata for easier access
            },
        });

        if (error) throw error;
        if (!authData.user) throw new Error('Registration failed');
        authUser = authData.user;

    } catch (error: any) {
        // Handle "User already registered" case
        if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
            // Check if we can recover (get existing auth user)
            const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers();
            authUser = existingAuth.users.find(u => u.email === data.email);

            if (!authUser) throw new BadRequestError('User already registered');

            // If found, proceed to sync check. 
            // We can't auto-login them though because we don't know the password if it's an old account.
            // But if this is a development issue where public record is missing, we can at least fix the public record.
        } else {
            throw new BadRequestError(error.message);
        }
    }

    // 2. Sync to public users table
    if (authUser) {
        await syncPublicUser(authUser, {
            name: data.name,
            role: data.role,
            company_id: data.company_id
        });
    }

    // 3. Since admin.createUser doesn't return a session/token, we need to sign in immediately
    // Use ephemeral client for login
    const supabase = getEphemeralClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });

    if (signInError || !signInData.session) {
        throw new BadRequestError('Account exists or created, but failed to sign in. Please log in manually.');
    }

    return {
        user: {
            id: authUser.id,
            email: authUser.email!,
            name: data.name,
            role: data.role || 'staff',
            is_active: true,
            created_at: authUser.created_at,
            updated_at: authUser.created_at,
            company_id: data.company_id,
            company_name: companyName,
        },
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
    };
};

export const forgotPassword = async (email: string): Promise<void> => {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email);
    if (error) {
        throw new BadRequestError(error.message);
    }
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
    // TODO: Implement password reset with token
    throw new BadRequestError('Password reset not implemented');
};

export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
        throw new UnauthorizedError('Invalid refresh token');
    }

    return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
    };
};
