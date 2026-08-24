import React from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';
import { FONT_BY_WEIGHT, Fonts } from '../constants/fonts';

/**
 * Drop-in replacement for React Native's <Text> that applies the app's
 * custom fonts by default (Inter, weight-mapped) instead of the system
 * font — this is what makes the typography change apply everywhere
 * without having to touch every single screen's StyleSheet.
 *
 * If a style already sets an explicit `fontFamily` (e.g. Poppins for a
 * brand heading), that's honored as-is. Otherwise the existing
 * `fontWeight` in the style (if any) picks the matching loaded Inter file,
 * and `fontWeight` itself is cleared — Android ignores `fontWeight` on
 * custom fonts entirely and can render inconsistently if it's left set
 * alongside an explicit `fontFamily`.
 */
export default function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) || {};
  const fontFamily = flat.fontFamily ?? FONT_BY_WEIGHT[String(flat.fontWeight ?? '400')] ?? Fonts.interRegular;

  return <RNText {...props} style={[style, { fontFamily, fontWeight: undefined }]} />;
}
