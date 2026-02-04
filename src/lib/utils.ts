import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates Sri Lankan phone numbers (Mobile and Landline)
 * Supports formats: 07XXXXXXXX, 947XXXXXXXX, +947XXXXXXXX, 011XXXXXXX, etc.
 */
export function isValidSriLankanPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  const mobileRegex = /^(?:0|94|\+94)?7[01245678]\d{7}$/;
  const landlineRegex = /^(?:0|94|\+94)?(?:11|21|23|24|25|26|27|31|32|33|34|35|36|37|38|41|45|47|51|52|54|55|57|63|65|66|67|81|91)\d{7}$/;
  return mobileRegex.test(cleanPhone) || landlineRegex.test(cleanPhone);
}

