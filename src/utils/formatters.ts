// Number/currency formatting utilities

/**
 * Format number as currency (PKR)
 */
export const formatCurrency = (amount: number, currency = 'PKR'): string => {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-PK').format(num);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 2): string => {
    return `${value.toFixed(decimals)}%`;
};

/**
 * Round to specified decimal places
 */
export const roundTo = (num: number, decimals = 2): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
};

/**
 * Calculate percentage of total
 */
export const calculatePercentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return roundTo((value / total) * 100);
};

/**
 * Calculate amount from percentage
 */
export const calculateFromPercentage = (total: number, percentage: number): number => {
    return roundTo((total * percentage) / 100);
};

/**
 * Format weight in KGs
 */
export const formatWeight = (weight: number): string => {
    return `${formatNumber(weight)} KG`;
};

export default {
    formatCurrency,
    formatNumber,
    formatPercentage,
    roundTo,
    calculatePercentage,
    calculateFromPercentage,
    formatWeight,
};
