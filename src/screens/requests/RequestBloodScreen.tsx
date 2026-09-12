import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { BLOOD_TYPES } from '../../constants/appConstants';
import { required, validateIndianMobile, validateUnits } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { createRequest } from '../../services/bloodRequestService';
import AppTextField from '../../components/AppTextField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
import KeyboardAwareScreen from '../../components/KeyboardAwareScreen';
import type { HomeStackScreenProps } from '../../types/navigation';

export default function RequestBloodScreen({ navigation }: HomeStackScreenProps<'RequestBlood'>) {
  const { appUser } = useAuth();
  const [patientName, setPatientName] = useState('');
  const [units, setUnits] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const newErrors = {
      patientName: required(patientName, 'Patient name'),
      bloodType: bloodType ? null : 'Please select blood type',
      units: validateUnits(units),
      hospitalName: required(hospitalName, 'Hospital name'),
      location: required(location, 'Location'),
      contactNumber: validateIndianMobile(contactNumber),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    if (!appUser) return;

    setLoading(true);
    try {
      const result = await createRequest({
        requesterUid: appUser.uid,
        requesterName: appUser.fullName,
        patientName: patientName.trim(),
        unitsRequired: parseInt(units, 10),
        bloodType,
        hospitalName: hospitalName.trim(),
        location: location.trim(),
        contactNumber: contactNumber.trim(),
      });
      // Say what actually happened rather than always promising donors were
      // alerted - in an emergency the requester needs to know when to go and
      // chase people themselves.
      let message: string;
      if (result.notifyError) {
        message =
          'Your request is live and visible on the home screen, but donors could not be ' +
          'alerted automatically. Please also share the details directly.';
      } else if (!result.notified || result.notified.inAppCount === 0) {
        message =
          'No compatible donors are registered yet. Your request is live and visible to ' +
          'everyone on the home screen.';
      } else {
        message = `${result.notified.inAppCount} compatible donor(s) have been notified.`;
      }
      Alert.alert('Request Posted', message);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed', (e as Error).message || 'Failed to post request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.container}>
      <Text style={styles.title}>Fill in the request details</Text>
      <View style={{ height: 20 }} />

      <AppTextField label="Patient Name" value={patientName} onChangeText={setPatientName} error={errors.patientName} />
      <View style={{ height: 14 }} />
      <SelectField label="Blood Type Needed" value={bloodType} options={BLOOD_TYPES} onChange={setBloodType} error={errors.bloodType} />
      <View style={{ height: 14 }} />
      <AppTextField label="Units Required" value={units} onChangeText={setUnits} keyboardType="number-pad" error={errors.units} />
      <View style={{ height: 14 }} />
      <AppTextField label="Hospital Name / Location" value={hospitalName} onChangeText={setHospitalName} error={errors.hospitalName} />
      <View style={{ height: 14 }} />
      <AppTextField label="City / Area" value={location} onChangeText={setLocation} error={errors.location} />
      <View style={{ height: 14 }} />
      <AppTextField label="Contact Mobile Number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" error={errors.contactNumber} />

      <PrimaryButton label="Post Request" onPress={submit} loading={loading} style={{ marginTop: 24 }} />
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
});
