// Matches the sibling Flutter app's palette exactly so both apps present
// the same Rakt Setu brand identity.
export const Colors = {
  primary: '#B71C1C',
  primaryDark: '#7F0F0F',
  primaryLight: '#E57373',
  accent: '#D32F2F',

  background: '#FDF6F6',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#6B6B6B',

  success: '#2E7D32',
  warning: '#F9A825',
  danger: '#C62828',
  pending: '#EF6C00',

  divider: '#E0E0E0',
  white: '#FFFFFF',
} as const;

// A broader accent palette used deliberately in a few places where color
// carries real information (which blood type, which notification type) —
// buttons, headers, and links stay the deep-red brand color throughout for
// a consistent, trustworthy medical-app feel; this is *supporting* color,
// not a full re-theme.
export const Palette = {
  red: '#B71C1C',
  rose: '#D81B60',
  blue: '#1565C0',
  teal: '#00897B',
  purple: '#6A1B9A',
  amber: '#EF6C00',
  green: '#2E7D32',
  indigo: '#3949AB',
} as const;

/** One distinct color per blood type — mainly used for BloodTypeBadge and
 * the admin dashboard's "users by blood type" chart, so the eight groups
 * are visually scannable at a glance instead of eight identical red dots. */
export const BLOOD_TYPE_COLORS: Record<string, string> = {
  'A+': Palette.red,
  'A-': Palette.rose,
  'B+': Palette.blue,
  'B-': Palette.indigo,
  'AB+': Palette.purple,
  'AB-': '#8E24AA',
  'O+': Palette.amber,
  'O-': Palette.teal,
};

export function colorForBloodType(bloodType: string): string {
  return BLOOD_TYPE_COLORS[bloodType] ?? Colors.primary;
}
