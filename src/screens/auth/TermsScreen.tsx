import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { COLLEGE_CONTACT, COLLEGE_NAME, MIN_DONOR_AGE } from '../../constants/appConstants';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. What Rakt Setu Is',
    body:
      `Rakt Setu is a student-run, college-affiliated blood donor-matching platform built by ${COLLEGE_NAME}. ` +
      'Rakt Setu is NOT a licensed blood bank, hospital, or medical service. It only helps connect people who ' +
      'need blood with registered voluntary donors who may be willing to help. All actual donation, screening, ' +
      'and transfusion must happen through a licensed hospital or blood bank.',
  },
  {
    title: '2. Data We Collect and Why',
    body:
      'To operate donor matching safely, we collect: your full name, blood type, gender, date of birth, phone ' +
      'number, city/area, a photo ID (Aadhar/college ID) for verification, and an optional profile photo. This ' +
      'information is used to verify you are a genuine, eligible donor/requester, to match blood requests to ' +
      'compatible donors, and to let matched donors and requesters contact each other.',
  },
  {
    title: '3. Consent to Be Contacted',
    body:
      'By creating an account you consent to being contacted — by phone call, in-app notification, or push ' +
      'notification — by other registered users or by hospital staff when your blood type matches an active ' +
      'blood request. You may be shown a requester\'s contact number, and your matching may make you eligible ' +
      'to be contacted directly.',
  },
  {
    title: '4. Accuracy of Information',
    body:
      'You are solely responsible for the accuracy of the information you provide, including your blood type, ' +
      'contact number, and identity documents. Providing false information (including a false blood type or a ' +
      'fake blood request) may put lives at risk and is strictly prohibited.',
  },
  {
    title: '5. Minimum Age to Donate',
    body:
      `You must be at least ${MIN_DONOR_AGE} years old to register as a blood donor on Rakt Setu, consistent ` +
      'with standard blood donation eligibility rules in India. Final donation eligibility is always determined ' +
      'by the hospital/blood bank at the time of donation.',
  },
  {
    title: '6. Verify With the Hospital Before Any Donation',
    body:
      'Rakt Setu only facilitates an introduction between a donor and a requester. Before any donation or ' +
      'transfusion takes place, both parties must independently verify all details — including blood group ' +
      `compatibility, donor health eligibility, and hospital requirements — directly with the treating hospital ` +
      `or licensed blood bank. Rakt Setu and ${COLLEGE_NAME} accept no liability for any medical outcome.`,
  },
  {
    title: '7. Misuse and Fake Requests',
    body:
      'Accounts found to be posting fake blood requests, impersonating someone else, misusing contact ' +
      'information, or harassing other users will be suspended or permanently removed by the admin team, ' +
      'without prior notice.',
  },
  {
    title: '8. Contact',
    body: `For questions, complaints, or to report misuse, contact the ${COLLEGE_NAME} administration at ${COLLEGE_CONTACT}.`,
  },
];

export default function TermsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      {SECTIONS.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15.5, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  sectionBody: { fontSize: 14, lineHeight: 21, color: Colors.textPrimary },
});
