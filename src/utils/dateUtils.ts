// Date utility functions

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Format date to DD/MM/YYYY
 */
export const formatDateDMY = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Get start of day
 */
export const startOfDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
};

/**
 * Get end of day
 */
export const endOfDay = (date: Date): Date => {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
};

/**
 * Calculate due date from invoice date and due days
 */
export const calculateDueDate = (invoiceDate: Date, dueDays: number): Date => {
    return addDays(invoiceDate, dueDays);
};

/**
 * Check if date is overdue
 */
export const isOverdue = (dueDate: Date): boolean => {
    return new Date() > dueDate;
};

/**
 * Get current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
};

export default {
    formatDate,
    formatDateDMY,
    startOfDay,
    endOfDay,
    addDays,
    calculateDueDate,
    isOverdue,
    getCurrentTimestamp,
};
