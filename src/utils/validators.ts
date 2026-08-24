export function required(value: string | null | undefined, field = 'This field'): string | null {
  if (!value || !value.trim()) return `${field} is required`;
  return null;
}

export function validateEmail(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return 'Email is required';
  const regex = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;
  if (!regex.test(value.trim())) return 'Enter a valid email address';
  return null;
}

export function validatePassword(value: string | null | undefined): string | null {
  if (!value) return 'Password is required';
  if (value.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validateConfirmPassword(value: string | null | undefined, original: string): string | null {
  if (!value) return 'Please confirm your password';
  if (value !== original) return 'Passwords do not match';
  return null;
}

export function validateIndianMobile(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return 'Phone number is required';
  const cleaned = value.trim().replace(/[\s-]/g, '');
  const regex = /^(?:\+91)?[6-9]\d{9}$/;
  if (!regex.test(cleaned)) return 'Enter a valid 10-digit Indian mobile number';
  return null;
}

export function validateUnits(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || !`${value}`.trim()) return 'Units required is required';
  const n = parseInt(`${value}`, 10);
  if (isNaN(n) || n <= 0) return 'Enter a valid number of units';
  if (n > 20) return 'Enter a realistic number of units (max 20)';
  return null;
}

export function isAdult(dob: Date, minAge = 18): boolean {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= minAge;
}
