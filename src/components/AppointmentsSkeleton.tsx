import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShimmerPlaceholder } from './DashboardSkeleton';

export default function AppointmentsSkeleton() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Date Header Sub-bar Skeleton */}
      <View style={styles.dateSubBar}>
        <ShimmerPlaceholder width={18} height={18} borderRadius={9} />
        <ShimmerPlaceholder width={150} height={16} borderRadius={4} />
        <View style={{ flex: 1 }} />
        <ShimmerPlaceholder width={72} height={20} borderRadius={4} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} scrollEnabled={false}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.card}>
            {/* Top Row: Date/Time and Status */}
            <View style={styles.cardHeader}>
              <View style={styles.dateTimeContainer}>
                <ShimmerPlaceholder width={110} height={14} borderRadius={4} />
                <ShimmerPlaceholder width={130} height={16} borderRadius={4} />
              </View>
              <ShimmerPlaceholder width={82} height={26} borderRadius={6} />
            </View>

            {/* Client Row */}
            <View style={styles.detailRow}>
              <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
              <View style={styles.detailContent}>
                <ShimmerPlaceholder width={42} height={11} borderRadius={3} style={{ marginBottom: 4 }} />
                <View style={styles.infoRow}>
                  <ShimmerPlaceholder width={120} height={16} borderRadius={4} />
                  <ShimmerPlaceholder width={85} height={14} borderRadius={4} />
                </View>
              </View>
            </View>

            {/* Service Row */}
            <View style={styles.detailRow}>
              <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
              <View style={styles.detailContent}>
                <ShimmerPlaceholder width={50} height={11} borderRadius={3} style={{ marginBottom: 4 }} />
                <View style={styles.infoRow}>
                  <ShimmerPlaceholder width={140} height={16} borderRadius={4} />
                  <ShimmerPlaceholder width={50} height={16} borderRadius={4} />
                </View>
              </View>
            </View>

            {/* Staff Row */}
            <View style={styles.detailRow}>
              <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
              <View style={styles.detailContent}>
                <ShimmerPlaceholder width={75} height={11} borderRadius={3} style={{ marginBottom: 4 }} />
                <ShimmerPlaceholder width={110} height={16} borderRadius={4} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  dateSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateTimeContainer: {
    gap: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
