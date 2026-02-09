import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips any @phone.*.lk suffix from phone numbers
 * Used throughout the app to display clean phone numbers
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/@phone\.[^@]+$/i, '');
}

