// Poppins carries the primary "Rakt Setu" brand moment (splash + login
// header); Inter is the default for everything else — body text, buttons,
// list content, all screens. Beyond the Regular/Medium Inter weights used
// for body copy, SemiBold/Bold are also loaded because a lot of existing UI
// (card titles, stat numbers, buttons) already uses fontWeight 600/700 —
// without those weight-specific files loaded, that text would silently
// fall back to unweighted Inter on Android, which ignores `fontWeight` for
// custom fonts entirely.
export const Fonts = {
  poppinsSemiBold: 'Poppins_600SemiBold',
  poppinsBold: 'Poppins_700Bold',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
} as const;

/** Maps a plain `fontWeight` value to the matching loaded Inter file, since
 * that's what most of the app's existing styles express intent with. */
export const FONT_BY_WEIGHT: Record<string, string> = {
  '100': Fonts.interRegular,
  '200': Fonts.interRegular,
  '300': Fonts.interRegular,
  '400': Fonts.interRegular,
  normal: Fonts.interRegular,
  '500': Fonts.interMedium,
  '600': Fonts.interSemiBold,
  '700': Fonts.interBold,
  '800': Fonts.interBold,
  '900': Fonts.interBold,
  bold: Fonts.interBold,
};
