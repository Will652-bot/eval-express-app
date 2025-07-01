import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string into a readable format
 */
export function formatDate(dateString: string, formatString = 'PPP') {
  try {
    return format(parseISO(dateString), formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Formats a date string into a short format (MM/DD/YYYY)
 */
export function formatDateShort(dateString: string) {
  return formatDate(dateString, 'MM/dd/yyyy');
}

/**
 * Truncates a string to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number) {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/**
 * Calculates percentage from current and max values
 */
export function calculatePercentage(current: number, max: number) {
  if (max === 0) return 0;
  return Math.round((current / max) * 100);
}

/**
 * Returns the appropriate color for a score based on percentage
 */
export function getScoreColor(percentage: number) {
  if (percentage >= 90) return 'bg-success-500';
  if (percentage >= 75) return 'bg-accent-500';
  if (percentage >= 60) return 'bg-warning-500';
  return 'bg-error-500';
}

/**
 * Formats a number to a specified number of decimal places
 */
export function formatNumber(num: number, decimals = 2) {
  return num.toFixed(decimals);
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}