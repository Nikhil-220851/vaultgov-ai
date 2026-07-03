import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { styles } from '../styles';
import { CircularScore } from './CircularScore';
import { ProgressBar } from './ProgressBar';
import { HealthScoreInfo } from '../types';

interface HealthScoreCardProps {
  data: HealthScoreInfo;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ data }) => {
  const percentProgress = data.score / data.total;

  return (
    <View style={styles.healthCard}>
      {/* Title Header Section */}
      <View style={styles.healthCardHeader}>
        <View style={styles.healthIconBg}>
          <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primaryBlue} />
        </View>
        <View style={styles.healthCardHeaderText}>
          <Text style={styles.healthCardTitle}>Document health score</Text>
          <Text style={styles.healthCardSubtitle}>Based on expiry & completeness</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.healthCardDivider} />

      {/* Card Body */}
      <View style={styles.healthCardBody}>
        {/* Left Side Circular score gauge */}
        <CircularScore score={data.score} total={data.total} />

        {/* Right Side Progress stats */}
        <View style={styles.healthCardBodyRight}>
          <ProgressBar progress={percentProgress} />

          {/* Status Label Badges */}
          <View style={styles.statusBadgesRow}>
            <Text style={[styles.statusText, { color: '#34C759' }]}>
              ✓ {data.validCount} valid
            </Text>
            <Text style={[styles.statusText, { color: '#FF9800' }]}>
              ⚠ {data.expiringCount} expiring
            </Text>
            <Text style={[styles.statusText, { color: '#FF3B30' }]}>
              ○ {data.missingCount} missing
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default HealthScoreCard;
