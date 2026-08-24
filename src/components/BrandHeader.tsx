import React from 'react';
import { Animated, Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Text from './Text';
import { Colors } from '../constants/theme';
import { Fonts } from '../constants/fonts';
import { APP_NAME, COLLEGE_NAME } from '../constants/appConstants';

interface Props {
  /** 'dark' = on the solid red splash background (white text).
   * 'light' = on a white/off-white background, e.g. the login screen. */
  theme: 'dark' | 'light';
  logoSize?: number;
  tagline?: string;
  logoSource?: ImageSourcePropType;
  /** Optional animated transform (e.g. the splash screen's pulse) applied
   * only to the logo, so the rest of the brand block stays still. */
  logoAnimatedStyle?: StyleProp<ViewStyle>;
  /** Compact horizontal lockup (logo beside the name, one-line college
   * credit) for space-constrained screens like Login/Sign Up. The default
   * stacked layout is kept for the splash screen and Help & About, where
   * there's room to let the brand moment breathe. */
  compact?: boolean;
}

/**
 * The single reusable "Rakt Setu" brand block — logo, app name, and college
 * affiliation. Used on the splash screen, login screen, and Help & About so
 * they read as one cohesive brand moment rather than different layouts.
 */
export default function BrandHeader({ theme, logoSize = 96, tagline, logoSource, logoAnimatedStyle, compact }: Props) {
  const isDark = theme === 'dark';
  const appNameColor = isDark ? '#fff' : Colors.primary;
  const collegeColor = isDark ? 'rgba(255,255,255,0.75)' : Colors.textSecondary;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBrandRow}>
          <Animated.View style={logoAnimatedStyle}>
            <Image
              source={logoSource ?? require('../../assets/logo.png')}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={[styles.compactAppName, { color: appNameColor }]}>{APP_NAME}</Text>
        </View>

        {tagline ? (
          <Text style={[styles.tagline, { color: collegeColor }]}>{tagline}</Text>
        ) : null}

        <View style={styles.compactCollegeRow}>
          <Image
            source={require('../../assets/college_logo.png')}
            style={styles.compactCollegeLogo}
            resizeMode="contain"
          />
          <Text style={[styles.compactCollegeName, { color: collegeColor }]} numberOfLines={2}>
            {COLLEGE_NAME.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={logoAnimatedStyle}>
        <Image
          source={logoSource ?? require('../../assets/logo.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </Animated.View>

      <Text style={[styles.appName, { color: appNameColor }]}>{APP_NAME}</Text>

      {tagline ? (
        <Text style={[styles.tagline, { color: collegeColor }]}>
          {tagline}
        </Text>
      ) : null}

      <View style={styles.collegeBlock}>
        <Image
          source={require('../../assets/college_logo.png')}
          style={styles.collegeLogo}
          resizeMode="contain"
        />
        <Text style={[styles.collegeName, { color: collegeColor }]}>
          {COLLEGE_NAME.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  appName: {
    fontFamily: Fonts.poppinsBold,
    fontSize: 30,
    letterSpacing: 0.4,
    marginTop: 20,
  },
  tagline: {
    fontFamily: Fonts.interRegular,
    fontSize: 13.5,
    marginTop: 6,
  },
  collegeBlock: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 36,
  },
  collegeLogo: {
    width: 38,
    height: 38,
    marginBottom: 10,
  },
  collegeName: {
    fontFamily: Fonts.interMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    textAlign: 'center',
    lineHeight: 16,
  },

  compactContainer: { alignItems: 'center' },
  compactBrandRow: { flexDirection: 'row', alignItems: 'center' },
  compactAppName: {
    fontFamily: Fonts.poppinsBold,
    fontSize: 22,
    letterSpacing: 0.3,
    marginLeft: 10,
  },
  compactCollegeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 24,
  },
  compactCollegeLogo: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  compactCollegeName: {
    flexShrink: 1,
    fontFamily: Fonts.interMedium,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textAlign: 'left',
    lineHeight: 13,
  },
});
