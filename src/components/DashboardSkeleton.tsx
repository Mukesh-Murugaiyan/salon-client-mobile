import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ShimmerPlaceholder({
  width,
  height,
  borderRadius = 6,
  style,
}: {
  width?: number | `${number}%` | 'auto';
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <Animated.View
      style={[
        styles.shimmerBase,
        {
          width: width ?? '100%',
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar Skeleton */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          {/* Salon Name Skeleton */}
          <ShimmerPlaceholder width={160} height={20} borderRadius={6} />
          {/* User & Role Badge Skeleton */}
          <View style={styles.userMetaRow}>
            <ShimmerPlaceholder width={110} height={14} borderRadius={4} />
            <ShimmerPlaceholder width={55} height={18} borderRadius={4} />
          </View>
        </View>

        {/* Logout Button Placeholder */}
        <ShimmerPlaceholder width={38} height={38} borderRadius={8} />
      </View>

      <View style={styles.scrollContent}>
        {/* Card 1: Today's Appointments Count Skeleton */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <ShimmerPlaceholder width={38} height={38} borderRadius={19} />
              <ShimmerPlaceholder width={160} height={18} borderRadius={6} />
            </View>
            <ShimmerPlaceholder width={16} height={16} borderRadius={4} />
          </View>

          <View style={styles.countRow}>
            <ShimmerPlaceholder width={70} height={42} borderRadius={8} />
            <ShimmerPlaceholder width={190} height={14} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        </View>

        {/* Card 2: Subscription Status Skeleton */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <ShimmerPlaceholder width={38} height={38} borderRadius={19} />
              <ShimmerPlaceholder width={150} height={18} borderRadius={6} />
            </View>
            <ShimmerPlaceholder width={65} height={24} borderRadius={6} />
          </View>

          <View style={styles.subscriptionDetails}>
            <View style={styles.detailRow}>
              <ShimmerPlaceholder width={90} height={14} borderRadius={4} />
              <ShimmerPlaceholder width={110} height={14} borderRadius={4} />
            </View>
            <View style={styles.detailRow}>
              <ShimmerPlaceholder width={100} height={14} borderRadius={4} />
              <ShimmerPlaceholder width={95} height={14} borderRadius={4} />
            </View>
            <View style={styles.detailRow}>
              <ShimmerPlaceholder width={115} height={14} borderRadius={4} />
              <ShimmerPlaceholder width={60} height={14} borderRadius={4} />
            </View>
          </View>
        </View>

        {/* Card 3: Attendance Status & GPS Check-In Skeleton */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <ShimmerPlaceholder width={38} height={38} borderRadius={19} />
              <ShimmerPlaceholder width={155} height={18} borderRadius={6} />
            </View>
            <ShimmerPlaceholder width={85} height={24} borderRadius={6} />
          </View>

          {/* Working Hours Box Placeholder */}
          <ShimmerPlaceholder
            width="100%"
            height={64}
            borderRadius={10}
            style={{ marginVertical: 4 }}
          />

          {/* Attendance Info Box Placeholder */}
          <ShimmerPlaceholder
            width="100%"
            height={56}
            borderRadius={10}
            style={{ marginVertical: 6 }}
          />

          {/* Check-In Button Placeholder */}
          <ShimmerPlaceholder
            width="100%"
            height={48}
            borderRadius={10}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  shimmerBase: {
    backgroundColor: '#E5E7EB',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countRow: {
    marginTop: 6,
  },
  subscriptionDetails: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
