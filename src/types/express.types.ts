// Express types extensions - extending Express Request with custom properties
import { Request } from 'express';
import { User, SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
    user?: User;
    supabase?: SupabaseClient;
    accessToken?: string;
    companyId?: string;
    company?: {
        id: string;
        name: string;
        is_active: boolean;
    };
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface DateRangeQuery {
    startDate?: string;
    endDate?: string;
}

export interface SearchQuery {
    search?: string;
}
