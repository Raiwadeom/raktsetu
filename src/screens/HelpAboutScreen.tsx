import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../components/Text';
import { Colors } from '../constants/theme';
import { Fonts } from '../constants/fonts';
import BrandHeader from '../components/BrandHeader';
import { BUILT_BY, COLLEGE_CONTACT, COLLEGE_PHONE } from '../constants/appConstants';

const HOW_TO_USE: { title: string; body: string }[] = [
  {
    title: '1. Getting Started',
    body:
      'Sign Up with your email, then Sign In. On your first sign-in, you\'ll be taken straight to ' +
      'Complete Profile — fill in your name, blood type, phone number, and upload your ID card. ' +
      'This is mandatory before you can use the rest of the app.',
  },
  {
    title: '2. Verification',
    body:
      'After completing your profile, your account stays in "Pending" status until a college admin ' +
      'reviews your ID card. You can still view and edit your profile while pending — once approved, ' +
      'you get full access automatically, no need to sign in again.',
  },
  {
    title: '3. Request Blood',
    body:
      'Fill out the patient\'s name, units required, blood type needed, hospital name, and a contact ' +
      'number. As soon as you submit, matching donors are notified automatically — no extra steps.',
  },
  {
    title: '4. Notifications',
    body:
      'Check the bell icon for blood-match alerts. Tap any notification to open the request ' +
      'details, where you can call the requester directly with one tap.',
  },
  {
    title: '5. Your Profile',
    body:
      'View and edit your details anytime, see your donation history (added by the admin after a real ' +
      'donation), and check your verification badge to confirm your access status.',
  },
  {
    title: '6. Admin Panel (verified admins only)',
    body:
      'Admins can manage registered users, verify ID cards, track and manage blood requests, log ' +
      'donation history, and export the registered-user list to Excel.',
  },
];

const CONTACT_EMAIL = COLLEGE_CONTACT;
const CONTACT_PHONE = COLLEGE_PHONE;

export default function HelpAboutScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <BrandHeader theme="light" logoSize={64} />

      <Text style={styles.sectionHeading}>How to Use Rakt Setu</Text>
      {HOW_TO_USE.map((item) => (
        <View key={item.title} style={styles.howToCard}>
          <Text style={styles.howToTitle}>{item.title}</Text>
          <Text style={styles.howToBody}>{item.body}</Text>
        </View>
      ))}

      <Text style={styles.sectionHeading}>Contact Us</Text>
      <View style={styles.contactCard}>
        <Text style={styles.contactIntro}>For any issues or queries, contact the college.</Text>

        <Pressable onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} style={styles.contactRow}>
          <View style={styles.contactIcon}><Text style={{ fontSize: 16 }}>✉️</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
          </View>
        </Pressable>

        <View style={styles.contactDivider} />

        <Pressable onPress={() => Linking.openURL(`tel:${CONTACT_PHONE}`)} style={styles.contactRow}>
          <View style={styles.contactIcon}><Text style={{ fontSize: 16 }}>📞</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>{CONTACT_PHONE}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.creditDivider} />
      <View style={styles.creditBadge}>
        <Text style={styles.creditText}>{BUILT_BY}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 32, paddingBottom: 48 },
  sectionHeading: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: 18,
    color: Colors.primary,
    marginTop: 36,
    marginBottom: 14,
  },
  howToCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  howToTitle: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 14.5,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  howToBody: {
    fontFamily: Fonts.interRegular,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
  },
  contactIntro: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactLabel: {
    fontSize: 11.5,
    color: Colors.textSecondary,
  },
  contactValue: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 14.5,
    color: Colors.primary,
    marginTop: 2,
  },
  contactDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 12,
  },
  creditDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginTop: 40,
    marginBottom: 20,
    width: '40%',
    alignSelf: 'center',
  },
  creditBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
  },
  creditText: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: 13.5,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
});
