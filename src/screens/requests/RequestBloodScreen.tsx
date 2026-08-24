import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { Colors } from '../../constants/theme';
import { BLOOD_TYPES } from '../../constants/appConstants';
import { required, validateIndianMobile, validateUnits } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { createRequest } from '../../services/bloodRequestService';
import AppTextField from '../../components/AppTextField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
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
      await createRequest({
        requesterUid: appUser.uid,
        requesterName: appUser.fullName,
        patientName: patientName.trim(),
        unitsRequired: parseInt(units, 10),
        bloodType,
        hospitalName: hospitalName.trim(),
        location: location.trim(),
        contactNumber: contactNumber.trim(),
      });
      Alert.alert('Request Posted', 'Matching donors will be notified.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed', (e as Error).message || 'Failed to post request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Fill in the request details</Text>
        <Text style={styles.subtitle}>Matching donors will be notified instantly via push + in-app notifications.</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
});
