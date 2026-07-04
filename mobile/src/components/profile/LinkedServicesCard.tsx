"use no memo";
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, Radius } from '@/theme';

interface LinkedService {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  isLinked: boolean;
  lastSync?: string;
}

const SERVICES: LinkedService[] = [
  { id: 'digilocker', name: 'DigiLocker', icon: 'folder-open-outline', iconColor: '#1977F3', isLinked: true, lastSync: 'Today' },
  { id: 'aadhaar', name: 'Aadhaar', icon: 'finger-print-outline', iconColor: '#FF9800', isLinked: true, lastSync: '2 days ago' },
  { id: 'pan', name: 'PAN Card', icon: 'card-outline', iconColor: '#3CC556', isLinked: true, lastSync: 'Today' },
  { id: 'abha', name: 'ABHA Health', icon: 'heart-outline', iconColor: '#FF3B30', isLinked: false },
  { id: 'eshram', name: 'eShram', icon: 'construct-outline', iconColor: '#9C27B0', isLinked: false },
  { id: 'uan', name: 'UAN (EPFO)', icon: 'briefcase-outline', iconColor: '#607D8B', isLinked: false },
  { id: 'dl', name: 'Driving Licence', icon: 'car-outline', iconColor: '#FF9800', isLinked: false },
  { id: 'passport', name: 'Passport', icon: 'airplane-outline', iconColor: '#1977F3', isLinked: false },
];

export function LinkedServicesCard() {
  return (
    <View style={styles.container}>
      {SERVICES.map((service, index) => (
        <View
          key={service.id}
          style={[
            styles.row,
            index === SERVICES.length - 1 && styles.rowLast,
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: service.iconColor + '18' }]}>
            <Ionicons name={service.icon} size={18} color={service.iconColor} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{service.name}</Text>
            {service.isLinked && service.lastSync ? (
              <Text style={styles.syncText}>Synced {service.lastSync}</Text>
            ) : (
              <Text style={styles.notLinkedText}>Not linked</Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              service.isLinked ? styles.syncedBtn : styles.linkBtn,
            ]}
            activeOpacity={0.8}
          >
            {service.isLinked ? (
              <>
                <Ionicons name="checkmark-circle" size={12} color={Colors.primaryGreen} />
                <Text style={styles.syncedBtnText}>Linked</Text>
              </>
            ) : (
              <Text style={styles.linkBtnText}>Link</Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.pureBlack,
    marginBottom: 2,
  },
  syncText: {
    fontSize: Typography.sizes.xs,
    color: Colors.darkGray,
  },
  notLinkedText: {
    fontSize: Typography.sizes.xs,
    color: Colors.dangerRed,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  syncedBtn: {
    backgroundColor: '#EDFBF0',
    borderColor: Colors.primaryGreen,
  },
  syncedBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryGreen,
  },
  linkBtn: {
    backgroundColor: '#EBF2FF',
    borderColor: Colors.primaryBlue,
  },
  linkBtnText: {
    fontSize: 11,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryBlue,
  },
});
