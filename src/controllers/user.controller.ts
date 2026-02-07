import { Request, Response } from 'express';
import { asyncHandler, ApiResponse, BadRequestError, NotFoundError } from '../utils';
import { supabaseAdmin } from '../config/supabase';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const companyName = user.user_metadata?.company_name || user.company_name;

    // Security check: Only allow QASIM SEWING MACHINE
    if (companyName !== 'QASIM SEWING MACHINE') {
        throw new BadRequestError('Unauthorized access');
    }

    // Fetch all users from public table
    // We intentionally fetch ALL users because the admin of Qasim Sewing Machine 
    // manages the "4 users for 4 companies". 
    // If they only needed their own company's users, we would filter by company_id.
    const { data: users, error } = await supabaseAdmin
        .from('users')
        .select(`
            *,
            company:companies(name)
        `)
        .order('name');

    if (error) {
        throw new BadRequestError(error.message);
    }

    ApiResponse.success(res, users, 'Users retrieved successfully');
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, password } = req.body;
    const currentUser = (req as any).user;
    const currentCompanyName = currentUser.user_metadata?.company_name || currentUser.company_name;

    // Security check
    if (currentCompanyName !== 'QASIM SEWING MACHINE') {
        throw new BadRequestError('Unauthorized access');
    }

    // 1. Get the public user to find their email
    const { data: publicUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', id)
        .single();

    if (fetchError || !publicUser) {
        throw new NotFoundError('User not found');
    }

    // 2. Update Public Table (Name)
    if (name) {
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ name })
            .eq('id', id);

        if (updateError) throw new BadRequestError(updateError.message);
    }

    // 3. Update Auth User (Password) - if provided
    if (password) {
        // Find auth user ID by email
        const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw new BadRequestError(listError.message);

        const authUser = authData.users.find(u => u.email === publicUser.email);

        if (authUser) {
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
                authUser.id,
                { password }
            );
            if (authUpdateError) throw new BadRequestError(authUpdateError.message);
        } else {
            console.warn(`Auth user not found for email ${publicUser.email}`);
            // We don't throw here to allow name update to succeed even if auth is out of sync
        }
    }

    ApiResponse.success(res, { id, name }, 'User updated successfully');
});
