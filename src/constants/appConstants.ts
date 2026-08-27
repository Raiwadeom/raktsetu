export const APP_NAME = 'Rakt Setu';
export const COLLEGE_NAME = 'Chhatrapati Shivajiraje Mahavidyalaya, Udgir';
export const COLLEGE_CONTACT = 'raktsetu.csm@gmail.com';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const GENDERS = ['Male', 'Female', 'Other'] as const;

// Red-cell compatibility: for a request needing blood type X, which donor
// blood types can actually give to X. Donor matching
// (donorNotificationService.ts) queries on this rather than on the exact
// type — matching exactly would silently exclude most of the people who
// could help, e.g. an O- universal donor would never hear about an A+
// request.
//
// Rh-negative recipients can only receive Rh-negative blood; Rh-positive
// recipients can receive either. O is the universal donor, AB+ the
// universal recipient. Every list is <= 8 entries, well inside Firestore's
// 30-value limit for an 'in' query.
export const COMPATIBLE_DONOR_TYPES: Record<string, readonly string[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export const MIN_DONOR_AGE = 18;
export const MAX_ID_CARD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const FS = {
  users: 'users',
  bloodRequests: 'bloodRequests',
  donationHistory: 'donationHistory',
  notifications: 'notifications',
  notificationItems: 'items',
  // Minimal-exposure mirror of {bloodType, expoPushToken, isSuspended} —
  // readable by any verified user so the client can find matching donors
  // and push to them directly (no Cloud Functions / Blaze plan required).
  // Deliberately excludes phone/email/fullName/city, unlike the full users
  // collection, to limit what's exposed by this readable-by-everyone rule.
  pushTokens: 'pushTokens',
} as const;

export const RequestStatus = {
  pending: 'pending',
  fulfilled: 'fulfilled',
  cancelled: 'cancelled',
} as const;

export const DonationType = {
  donated: 'donated',
  received: 'received',
} as const;

export const NotificationType = {
  bloodMatch: 'bloodMatch',
  announcement: 'announcement',
  verification: 'verification',
  general: 'general',
} as const;
