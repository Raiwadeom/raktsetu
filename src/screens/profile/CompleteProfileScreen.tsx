import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/theme';
import { BLOOD_TYPES, GENDERS, MAX_ID_CARD_SIZE_BYTES, MIN_DONOR_AGE } from '../../constants/appConstants';
import { isAdult, required, validateIndianMobile } from '../../utils/validators';
import { formatDate } from '../../utils/formatters';
import { resizeImageForUpload } from '../../utils/imageResize';
import { useAuth } from '../../context/AuthContext';
import { saveProfile } from '../../services/userService';
import { uploadIdCard, uploadProfilePhoto } from '../../services/cloudinaryService';
import AppTextField from '../../components/AppTextField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
import type { PickedFile } from '../../types/models';

interface Props {
  navigation: { goBack: () => void };
  route?: { params?: { isEditing?: boolean } };
}

function formatKb(bytes?: number | null): string {
  if (!bytes) return '?';
  return `${Math.round(bytes / 1024)}KB`;
}

export default function CompleteProfileScreen({ navigation, route }: Props) {
  const isEditing = route?.params?.isEditing === true;
  const { appUser, refreshAppUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [pickedIdFile, setPickedIdFile] = useState<PickedFile | null>(null);
  const [existingIdCardUrl, setExistingIdCardUrl] = useState<string | null>(null);
  const [pickedPhoto, setPickedPhoto] = useState<{ uri: string } | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [idUploadProgress, setIdUploadProgress] = useState<number | null>(null);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number | null>(null);
  const [resizingPhoto, setResizingPhoto] = useState(false);
  const [resizingIdCard, setResizingIdCard] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (appUser && !prefilled) {
      setPrefilled(true);
      setFullName(appUser.fullName || '');
      setBloodType(appUser.bloodType || '');
      setGender(appUser.gender || '');
      setPhone(appUser.phone || '');
      setCity(appUser.city || '');
      setDob(appUser.dob || null);
      setExistingIdCardUrl(appUser.idCardUrl || null);
      setExistingPhotoUrl(appUser.profilePhotoUrl || null);
    }
  }, [appUser, prefilled]);

  const pickProfilePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    // Phone camera photos are often 8-12+ MB — downscaling before upload is
    // what actually makes "Save & Continue" feel fast instead of stuck.
    setResizingPhoto(true);
    try {
      const resized = await resizeImageForUpload(result.assets[0].uri);
      setPickedPhoto({ uri: resized.uri });
      console.log(
        `[imageResize] profile photo: ${formatKb(result.assets[0].fileSize)} -> ${formatKb(resized.sizeBytes)}`,
      );
    } catch {
      // Resize failing (rare) shouldn't block the user — fall back to the
      // original file; Cloudinary will just take a bit longer with it.
      setPickedPhoto(result.assets[0]);
    } finally {
      setResizingPhoto(false);
    }
  };

  const pickIdCard = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    const isImage = file.mimeType === 'image/jpeg' || file.mimeType === 'image/png';

    let uri = file.uri;
    let size = file.size;

    if (isImage) {
      setResizingIdCard(true);
      try {
        const resized = await resizeImageForUpload(file.uri);
        uri = resized.uri;
        size = resized.sizeBytes;
        console.log(`[imageResize] ID card: ${formatKb(file.size)} -> ${formatKb(resized.sizeBytes)}`);
      } catch {
        // Fall back to the original picked file if resizing fails.
      } finally {
        setResizingIdCard(false);
      }
    }

    if (size && size > MAX_ID_CARD_SIZE_BYTES && !isImage) {
      // Only PDFs skip resizing, so this is the only case where the
      // originally-picked size is still what actually gets uploaded.
      Alert.alert('File too large', 'Maximum size is 5 MB.');
      return;
    }

    const dotIndex = file.name.lastIndexOf('.');
    const extension = dotIndex === -1 ? '' : file.name.substring(dotIndex + 1).toLowerCase();
    setPickedIdFile({ uri, name: file.name, mimeType: file.mimeType, extension, size });
  };

  const submit = async () => {
    // Belt-and-braces against a double-tap racing two uploads of the same
    // file (PrimaryButton already ignores presses while `loading`).
    if (loading) return;

    const newErrors = {
      fullName: required(fullName, 'Full name'),
      bloodType: bloodType ? null : 'Please select blood type',
      gender: gender ? null : 'Please select gender',
      phone: validateIndianMobile(phone),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    if (dob && !isAdult(dob, MIN_DONOR_AGE)) {
      Alert.alert('Age requirement', `You must be at least ${MIN_DONOR_AGE} to register as a donor.`);
      return;
    }

    const hasIdCard = pickedIdFile || existingIdCardUrl;
    if (!hasIdCard) {
      Alert.alert('ID card required', 'Please upload your ID card to continue.');
      return;
    }

    if (!appUser) return;
    // Clear any progress left over from a previous attempt so the bars
    // reflect *this* submission rather than a stale/half-finished one.
    setIdUploadProgress(null);
    setPhotoUploadProgress(null);
    setLoading(true);

    try {
      let idCardUrl = existingIdCardUrl;
      if (pickedIdFile) {
        idCardUrl = await uploadIdCard({
          uri: pickedIdFile.uri,
          name: pickedIdFile.name,
          mimeType: pickedIdFile.mimeType,
          extension: pickedIdFile.extension,
          onProgress: setIdUploadProgress,
        });
      }

      let photoUrl = existingPhotoUrl;
      if (pickedPhoto) {
        photoUrl = await uploadProfilePhoto({
          uri: pickedPhoto.uri,
          name: 'profile.jpg',
          mimeType: 'image/jpeg',
          onProgress: setPhotoUploadProgress,
        });
      }

      await saveProfile(appUser.uid, {
        fullName: fullName.trim(),
        bloodType,
        gender,
        phone: phone.trim(),
        city: city.trim(),
        dob: dob || null,
        idCardUrl,
        profilePhotoUrl: photoUrl,
        profileComplete: true,
      });

      // Adopt what was actually persisted as the new "existing" state and
      // drop the local picks. Without this the screen still holds the
      // local file URIs after a successful save, so if it stays mounted
      // (editing flow, or the user taps Save again before the navigator
      // swaps) the very same images get re-uploaded to Cloudinary from
      // scratch — which is what made saving feel stuck and repeatedly slow.
      setExistingIdCardUrl(idCardUrl);
      setExistingPhotoUrl(photoUrl);
      setPickedIdFile(null);
      setPickedPhoto(null);
      setIdUploadProgress(null);
      setPhotoUploadProgress(null);
      setLoading(false);

      // Explicitly re-fetch rather than relying solely on the live listener:
      // a long dev session (hot reloads, backgrounding, flaky wifi) can
      // leave that stream stalled, so the write succeeds but RootNavigator
      // never re-renders until the app is fully restarted. This makes the
      // transition to Verification Pending / Home immediate and reliable.
      await refreshAppUser();

      if (isEditing) {
        Alert.alert('Saved', 'Profile updated.');
        navigation.goBack();
      }
      // If this was the mandatory first-time flow, RootNavigator now
      // re-renders off the freshly-fetched appUser above and moves the
      // user to Verification Pending / Home automatically.
    } catch (e) {
      setLoading(false);
      setIdUploadProgress(null);
      setPhotoUploadProgress(null);
      Alert.alert('Error', (e as Error).message || 'Something went wrong while saving your profile.');
    }
  };

  const photoUri = pickedPhoto?.uri || existingPhotoUrl;
  const hasIdFile = !!pickedIdFile || !!existingIdCardUrl;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        {!isEditing && (
          <>
            <Text style={styles.title}>Just one more step</Text>
            <Text style={styles.subtitle}>
              This information helps match you to blood requests and lets the admin verify your identity.
            </Text>
            <View style={{ height: 16 }} />
          </>
        )}

        {/* Also locked while saving: swapping the pick mid-upload would leave
            the avatar showing one image while a different one is the URL
            actually written to the profile. */}
        <Pressable style={styles.photoWrap} onPress={pickProfilePhoto} disabled={resizingPhoto || loading}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
          )}
          {resizingPhoto ? (
            <View style={[styles.photo, styles.photoOverlay]}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
          <View style={styles.cameraBadge}>
            <Text style={{ color: '#fff', fontSize: 12 }}>📷</Text>
          </View>
        </Pressable>
        {resizingPhoto ? (
          <Text style={styles.optimizingText}>Optimizing image…</Text>
        ) : null}
        {photoUploadProgress != null && photoUploadProgress < 1 ? (
          <View style={[styles.progressTrack, { marginTop: 10, width: 140, alignSelf: 'center' }]}>
            <View style={[styles.progressFill, { width: `${Math.round(photoUploadProgress * 100)}%` }]} />
          </View>
        ) : null}

        <View style={{ height: 20 }} />
        <AppTextField label="Full Name" value={fullName} onChangeText={setFullName} error={errors.fullName} />
        <View style={{ height: 14 }} />
        <SelectField label="Blood Type" value={bloodType} options={BLOOD_TYPES} onChange={setBloodType} error={errors.bloodType} />
        <View style={{ height: 14 }} />
        <SelectField label="Gender" value={gender} options={GENDERS} onChange={setGender} error={errors.gender} />
        <View style={{ height: 14 }} />
        <AppTextField label="Phone Number (10-digit)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
        <View style={{ height: 14 }} />
        <AppTextField label="City / Area (optional)" value={city} onChangeText={setCity} />
        <View style={{ height: 14 }} />

        <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
          <Text style={dob ? styles.dateValue : styles.datePlaceholder}>
            {dob ? formatDate(dob) : 'Date of Birth (optional)'}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={dob || new Date(2000, 0, 1)}
            mode="date"
            maximumDate={new Date()}
            onChange={(_event, selected) => {
              setShowDatePicker(false);
              if (selected) setDob(selected);
            }}
          />
        )}

        <View style={{ height: 20 }} />
        <View style={styles.idCard}>
          <Text style={styles.idCardTitle}>🪪 ID Card (Aadhar / College ID)</Text>
          <Text style={styles.idCardSubtitle}>Required for admin verification. JPG/PNG photos are optimized automatically. PDF max 5 MB.</Text>

          {pickedIdFile && pickedIdFile.mimeType === 'application/pdf' ? (
            <Text style={styles.idFileNote}>📄 {pickedIdFile.name}</Text>
          ) : pickedIdFile ? (
            <Image source={{ uri: pickedIdFile.uri }} style={styles.idPreview} />
          ) : existingIdCardUrl ? (
            <Text style={styles.idFileNoteSuccess}>✓ ID card already uploaded</Text>
          ) : (
            <Text style={styles.idFileNote}>No file selected</Text>
          )}

          {idUploadProgress != null && idUploadProgress < 1 ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(idUploadProgress * 100)}%` }]} />
            </View>
          ) : null}

          <PrimaryButton
            label={resizingIdCard ? 'Optimizing image…' : hasIdFile ? 'Replace File' : 'Upload File'}
            outlined
            loading={resizingIdCard}
            disabled={loading}
            onPress={pickIdCard}
            style={{ marginTop: 12 }}
          />
        </View>

        <PrimaryButton
          label={isEditing ? 'Save Changes' : 'Save & Continue'}
          onPress={submit}
          loading={loading}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  subtitle: { color: Colors.textSecondary, marginTop: 4 },
  photoWrap: { alignSelf: 'center' },
  photo: { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder: { backgroundColor: Colors.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  photoOverlay: {
    position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute', right: 0, bottom: 0, backgroundColor: Colors.primary,
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  optimizingText: {
    textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginTop: 8,
  },
  dateField: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  dateValue: { color: Colors.textPrimary, fontSize: 15 },
  datePlaceholder: { color: Colors.textSecondary, fontSize: 15 },
  idCard: {
    borderWidth: 1, borderColor: Colors.divider, borderRadius: 12, padding: 14, backgroundColor: '#fff',
  },
  idCardTitle: { fontWeight: '600', color: Colors.textPrimary, fontSize: 14.5 },
  idCardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, marginBottom: 10 },
  idPreview: { height: 120, borderRadius: 8, marginBottom: 4 },
  idFileNote: { color: Colors.textSecondary, fontSize: 13 },
  idFileNoteSuccess: { color: Colors.success, fontSize: 13 },
  progressTrack: { height: 6, backgroundColor: Colors.divider, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary },
});
