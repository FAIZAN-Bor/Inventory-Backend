// Auth types - TypeScript interfaces for authentication

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    company_id: string; // Required for multi-tenancy
}

export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar_url?: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    company_id?: string;
    company_name?: string;
}

export interface AuthResponse {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
}

export interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
}
