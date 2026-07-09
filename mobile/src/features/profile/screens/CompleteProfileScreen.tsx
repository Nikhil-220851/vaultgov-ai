import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AppLogo } from '@/components/AppLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useUser } from '@/context/UserContext';
import { apiClient } from '@/services/api';
import { Typography, Radius } from '@/theme';

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

export function CompleteProfileScreen() {
  const router = useRouter();
  const { firebaseUser, setUser } = useUser();

  // Form State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [occupation, setOccupation] = useState('');
  const [annualIncome, setAnnualIncome] = useState('EWS');

  // Control State
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field focus states for premium borders
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = () => {
    if (!fullName.trim()) return 'Full Name is required';
    if (!dob.trim()) return 'Date of Birth is required';
    
    // Simple date validation YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dob)) {
      return 'Date of Birth must be in YYYY-MM-DD format';
    }
    
    const parsedDate = Date.parse(dob);
    if (isNaN(parsedDate)) {
      return 'Please enter a valid Date of Birth';
    }

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
      if (!uid) {
        throw new Error('No authenticated user session found.');
      }

      console.log('[CompleteProfile] Submitting profile update to backend...');

      // Save the complete-profile form data
      const updatedUser = await apiClient.updateUserProfile(uid, {
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender,
        state,
        district: district.trim(),
        occupation: occupation.trim(),
        annual_income: annualIncome,
      });

      // Update the user context with the new profile state
      setUser(updatedUser);

      console.log('[CompleteProfile] Profile saved successfully.');

      // Proceed to the Grant Permissions onboarding step
      router.replace('/grant-permissions' as any);
    } catch (err: any) {
      console.error('[CompleteProfile] Submit failed:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDobChange = (text: string) => {
    // Basic auto-formatting YYYY-MM-DD
    let clean = text.replace(/[^0-9]/g, '');
    if (clean.length > 8) {
      clean = clean.slice(0, 8);
    }
    
    let formatted = clean;
    if (clean.length > 4) {
      formatted = `${clean.slice(0, 4)}-${clean.slice(4, 6)}`;
    }
    if (clean.length > 6) {
      formatted = `${formatted}-${clean.slice(6, 8)}`;
    }
    
    setDob(formatted);
    if (error) setError(null);
  };

  return (
    <ScreenContainer safeAreaStyle={{ backgroundColor: '#F7F8F5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8F5" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.screenFlexContainer}>
          {/* Header Section */}
          <View style={styles.headerSectionGroup}>
            <View style={styles.headerBrandingRow}>
              <AppLogo size={32} />
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>VaultGov AI</Text>
                <Text style={styles.headerSubtitle}>Citizen Onboarding</Text>
              </View>
            </View>
            <View style={styles.navigationRow}>
              <Text style={styles.stepText}>Step 1 of 2: Profile Setup</Text>
            </View>
          </View>

          {/* Form Scroll Content */}
          <ScrollView
            style={styles.mainContentScroll}
            contentContainerStyle={styles.mainContentScrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mainContentInner}>
              <Text style={styles.title}>Complete Profile</Text>
              <Text style={styles.subtitle}>
                Please enter details exactly as they appear in your official government identity documents.
              </Text>

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
                  onChangeText={(val) => {
                    setFullName(val);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Date of Birth */}
              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <View style={[styles.inputWrapper, focusedField === 'dob' && styles.inputWrapperFocused]}>
                <Ionicons name="calendar-outline" size={20} color="#707070" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD (e.g. 1998-03-15)"
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

              {/* State (Selector Button) */}
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
                  onChangeText={(val) => {
                    setDistrict(val);
                    if (error) setError(null);
                  }}
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
                  placeholder="e.g. Software Engineer / Student"
                  placeholderTextColor="#A0A0A0"
                  value={occupation}
                  onChangeText={(val) => {
                    setOccupation(val);
                    if (error) setError(null);
                  }}
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

          {/* Action Area */}
          <View style={styles.actionAreaGroup}>
            <PrimaryButton
              title="Save & Continue"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* State Selection Modal */}
      <Modal
        visible={stateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStateModalVisible(false)}
      >
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
                  <Text style={[styles.stateItemText, state === item && styles.stateItemTextSelected]}>
                    {item}
                  </Text>
                  {state === item && (
                    <Ionicons name="checkmark" size={20} color="#1977F3" />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  screenFlexContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F7F8F5',
  },
  headerSectionGroup: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderColor: '#E5E7F0',
    paddingTop: Platform.OS === 'ios' ? 16 : 16,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerBrandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTextGroup: {
    marginLeft: 16,
  },
  headerTitle: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: '#000000',
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: '#707070',
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F7',
  },
  stepText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 13,
    fontWeight: Typography.weights.semibold,
    color: '#1977F3',
  },
  mainContentScroll: {
    flex: 1,
  },
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
  title: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 14,
    color: '#707070',
    lineHeight: 20,
    marginBottom: 24,
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
    borderColor: '#1977F3',
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
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
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
    borderColor: '#1977F3',
    backgroundColor: '#EEF5FF',
  },
  genderText: {
    fontFamily: Typography.fontFamilies.sans,
    fontSize: 13,
    fontWeight: Typography.weights.medium,
    color: '#707070',
  },
  genderTextSelected: {
    color: '#1977F3',
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
    borderColor: '#1977F3',
    backgroundColor: '#EEF5FF',
  },
  incomeLabel: {
    fontFamily: Typography.fontFamilies.heading,
    fontSize: 14,
    fontWeight: Typography.weights.bold,
    color: '#000000',
  },
  incomeLabelSelected: {
    color: '#1977F3',
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
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
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
    color: '#1977F3',
    fontWeight: Typography.weights.bold,
  },
});

export default CompleteProfileScreen;
