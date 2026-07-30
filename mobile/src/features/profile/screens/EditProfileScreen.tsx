import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Avatar } from '@/components/Avatar';
import { ProfileImagePicker } from '@/components/profile/ProfileImagePicker';
import { useUser } from '@/context/UserContext';
import { apiClient } from '@/services/api';
import { Typography, Radius, Spacing, Colors } from '@/theme';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Puducherry'
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const INCOME_SLABS = [
  { id: 'EWS', label: 'EWS', desc: 'Below ₹3 Lakhs' },
  { id: 'LIG', label: 'LIG', desc: '₹3L - ₹6 Lakhs' },
  { id: 'MIG', label: 'MIG', desc: '₹6L - ₹12 Lakhs' },
  { id: 'HIG', label: 'HIG', desc: 'Above ₹12 Lakhs' },
];

export function EditProfileScreen() {
  const router = useRouter();
  const { user, firebaseUser, setUser } = useUser();

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobile_number || firebaseUser?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || firebaseUser?.email || '');
  const [dob, setDob] = useState(user?.date_of_birth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [state, setState] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [annualIncome, setAnnualIncome] = useState(user?.annual_income || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profile_image_url || null);

  // Control State
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Field focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Check for dirty state
  useEffect(() => {
    const hasChanges = 
      fullName !== (user?.full_name || '') ||
      mobileNumber !== (user?.mobile_number || firebaseUser?.phoneNumber || '') ||
      email !== (user?.email || firebaseUser?.email || '') ||
      dob !== (user?.date_of_birth || '') ||
      gender !== (user?.gender || '') ||
      state !== (user?.state || '') ||
      district !== (user?.district || '') ||
      occupation !== (user?.occupation || '') ||
      annualIncome !== (user?.annual_income || '') ||
      profileImageUrl !== (user?.profile_image_url || null);
    
    setIsDirty(hasChanges);
  }, [fullName, mobileNumber, email, dob, gender, state, district, occupation, annualIncome, profileImageUrl, user, firebaseUser]);

  const validateForm = () => {
    if (!fullName.trim()) return 'Full Name is required';
    
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return 'Please enter a valid email address';
    }
    
    if (mobileNumber.trim()) {
      const digits = mobileNumber.replace(/\D/g, '');
      if (digits.length > 0 && digits.length < 10) return 'Please enter a valid mobile number';
    }

    if (!dob.trim()) return 'Date of Birth is required';
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dob)) return 'Date of Birth must be in YYYY-MM-DD format';
    
    const parsedDate = Date.parse(dob);
    if (isNaN(parsedDate)) return 'Please enter a valid Date of Birth';

    if (!gender) return 'Gender is required';
    if (!state) return 'State is required';
    if (!district.trim()) return 'District is required';
    if (!occupation.trim()) return 'Occupation is required';
    if (!annualIncome) return 'Annual Income is required';

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const uid = firebaseUser?.uid;
      if (!uid) throw new Error('No authenticated user session found.');

      const updatedUser = await apiClient.updateUserProfile(uid, {
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim() || null,
        email: email.trim() || null,
        date_of_birth: dob,
        gender,
        state,
        district: district.trim(),
        occupation: occupation.trim(),
        annual_income: annualIncome,
        profile_image_url: profileImageUrl,
      });

      setUser(updatedUser);
      Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      console.error('[EditProfile] Submit failed:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDobChange = (text: string) => {
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 8) clean = clean.slice(0, 8);
    let formatted = clean;
    if (clean.length > 4) formatted = `${clean.slice(0, 4)}-${clean.slice(4, 6)}`;
    if (clean.length > 6) formatted = `${formatted}-${clean.slice(6, 8)}`;
    setDob(formatted);
    if (error) setError(null);
  };

  const handleImageSelected = (url: string | null) => {
    setProfileImageUrl(url);
    setImagePickerVisible(false);
  };

  const leftElement = (
    <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
      <Ionicons name="arrow-back" size={24} color={Colors.pureBlack} />
    </Pressable>
  );

  return (
    <ScreenContainer safeAreaStyle={{ backgroundColor: '#F7F8F5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F5" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <AppHeader
          title="Edit Profile"
          leftElement={leftElement}
          backgroundColor="#FFFFFF"
          borderBottomColor="#EBEBEB"
        />

        <ScrollView
          style={styles.mainContentScroll}
          contentContainerStyle={styles.mainContentScrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainContentInner}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Avatar
                fullName={fullName || user?.full_name}
                profileImageUrl={profileImageUrl}
                size={96}
                showEditBadge={true}
                onPress={() => setImagePickerVisible(true)}
              />
              <Text style={styles.avatarHelperText}>Tap to change picture</Text>
            </View>

            {error && (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                <Text style={styles.errorAlertText}>{error}</Text>
              </View>
            )}

            {/* Full Name */}
            <Text style={styles.inputLabel}>Full Name (As in Aadhaar) *</Text>
            <View style={[styles.inputWrapper, focusedField === 'fullName' && styles.inputWrapperFocused]}>
              <Ionicons name="person-outline" size={20} color="#707070" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Arjun Mehta"
                placeholderTextColor="#A0A0A0"
                value={fullName}
                onChangeText={(val) => { setFullName(val); if (error) setError(null); }}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Mobile Number */}
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={[styles.inputWrapper, focusedField === 'mobileNumber' && styles.inputWrapperFocused]}>
              <Ionicons name="call-outline" size={20} color="#707070" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#A0A0A0"
                value={mobileNumber}
                onChangeText={(val) => { setMobileNumber(val); if (error) setError(null); }}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('mobileNumber')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Email */}
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
              <Ionicons name="mail-outline" size={20} color="#707070" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. arjun@example.com"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={(val) => { setEmail(val); if (error) setError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Date of Birth */}
            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <View style={[styles.inputWrapper, focusedField === 'dob' && styles.inputWrapperFocused]}>
              <Ionicons name="calendar-outline" size={20} color="#707070" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#A0A0A0"
                value={dob}
                onChangeText={handleDobChange}
                keyboardType="numeric"
                onFocus={() => setFocusedField('dob')}
                onBlur={() => setFocusedField(null)}
                maxLength={10}
              />
            </View>

            {/* Gender */}
            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={styles.genderGrid}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.genderCard, gender === g && styles.genderCardSelected]}
                >
                  <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* State */}
            <Text style={styles.inputLabel}>State *</Text>
            <Pressable
              onPress={() => setStateModalVisible(true)}
              style={[styles.inputWrapper, focusedField === 'state' && styles.inputWrapperFocused]}
            >
              <Ionicons name="location-outline" size={20} color="#707070" style={styles.inputIcon} />
              <Text style={[styles.textInput, !state && { color: '#A0A0A0' }]}>
                {state || 'Select State'}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#707070" style={{ marginRight: 16 }} />
            </Pressable>

            {/* District */}
            <Text style={styles.inputLabel}>District *</Text>
            <View style={[styles.inputWrapper, focusedField === 'district' && styles.inputWrapperFocused]}>
              <Ionicons name="map-outline" size={20} color="#707070" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Pune"
                placeholderTextColor="#A0A0A0"
                value={district}
                onChangeText={(val) => { setDistrict(val); if (error) setError(null); }}
                onFocus={() => setFocusedField('district')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Occupation */}
            <Text style={styles.inputLabel}>Occupation *</Text>
            <View style={[styles.inputWrapper, focusedField === 'occupation' && styles.inputWrapperFocused]}>
              <Ionicons name="briefcase-outline" size={20} color="#707070" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Software Engineer"
                placeholderTextColor="#A0A0A0"
                value={occupation}
                onChangeText={(val) => { setOccupation(val); if (error) setError(null); }}
                onFocus={() => setFocusedField('occupation')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Annual Income */}
            <Text style={styles.inputLabel}>Annual Family Income *</Text>
            <View style={styles.incomeGrid}>
              {INCOME_SLABS.map((slab) => (
                <Pressable
                  key={slab.id}
                  onPress={() => setAnnualIncome(slab.id)}
                  style={[styles.incomeCard, annualIncome === slab.id && styles.incomeCardSelected]}
                >
                  <Text style={[styles.incomeLabel, annualIncome === slab.id && styles.incomeLabelSelected]}>
                    {slab.label}
                  </Text>
                  <Text style={styles.incomeDesc}>{slab.desc}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.actionAreaGroup}>
          <PrimaryButton
            title="Save Changes"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !isDirty}
          />
        </View>
      </KeyboardAvoidingView>

      {/* State Selection Modal */}
      <Modal visible={stateModalVisible} animationType="slide" transparent={true} onRequestClose={() => setStateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <Pressable onPress={() => setStateModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color="#000000" />
              </Pressable>
            </View>
            <FlatList
              data={INDIAN_STATES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.stateItem}
                  onPress={() => {
                    setState(item);
                    setStateModalVisible(false);
                    if (error) setError(null);
                  }}
                >
                  <Text style={[styles.stateItemText, state === item && styles.stateItemTextSelected]}>{item}</Text>
                  {state === item && <Ionicons name="checkmark" size={20} color={Colors.primaryBlue} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Profile Image Picker */}
      <ProfileImagePicker
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onImageSelected={handleImageSelected}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1 },
  mainContentScroll: { flex: 1 },
  mainContentScrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  mainContentInner: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarHelperText: {
    marginTop: 12,
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 13,
    color: Colors.darkGray,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 20,
  },
  errorAlertText: {
    flex: 1,
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: Typography.weights.medium,
  },
  inputLabel: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: '#707070',
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    height: 54,
    borderRadius: Radius.button,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7F0',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputWrapperFocused: {
    borderColor: Colors.primaryBlue,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 15,
    color: '#000000',
    justifyContent: 'center',
    paddingRight: 16,
    ...Platform.select({ web: { outlineStyle: 'none' as any } }),
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  genderCard: {
    flex: 1,
    minWidth: 70,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: '#E5E7F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderCardSelected: {
    borderColor: Colors.primaryBlue,
    backgroundColor: '#EEF5FF',
  },
  genderText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 13,
    fontWeight: Typography.weights.medium,
    color: '#707070',
  },
  genderTextSelected: {
    color: Colors.primaryBlue,
    fontWeight: Typography.weights.bold,
  },
  incomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  incomeCard: {
    width: '48%',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: '#E5E7F0',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  incomeCardSelected: {
    borderColor: Colors.primaryBlue,
    backgroundColor: '#EEF5FF',
  },
  incomeLabel: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: '#000000',
  },
  incomeLabelSelected: {
    color: Colors.primaryBlue,
  },
  incomeDesc: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 11,
    color: '#707070',
    marginTop: 2,
  },
  actionAreaGroup: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderColor: '#E5E7F0',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F7',
  },
  modalTitle: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: '#000000',
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F5FA',
  },
  stateItemText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 15,
    color: '#707070',
  },
  stateItemTextSelected: {
    color: Colors.primaryBlue,
    fontWeight: Typography.weights.bold,
  },
});

export default EditProfileScreen;
