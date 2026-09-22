import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import { useAuth } from '../../context/AuthContext';
import { AttendanceService, LocationServiceError } from '../../services/attendanceService';
import { DashboardService } from '../../services/dashboardService';
import { AttendanceRecord, DashboardSummary, SubscriptionStatusData } from '../../types/dashboard';
import { DateTime } from '../../utils/DateTime';
import { AppConfig } from '../../config/AppConfig';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatusData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);

  // Check-in and error states
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState<string | null>(null);
  const [subscriptionExpiredError, setSubscriptionExpiredError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setDashboardError(null);
    setSubscriptionExpiredError(null);
    try {
      // 1. Fetch dashboard summary & appointment count
      const summaryData = await DashboardService.getSummary();
      setSummary(summaryData);

      // Check if backend flagged subscription expired
      if (summaryData.subscriptionStatus === 'EXPIRED') {
        setSubscriptionExpiredError(
          'Your salon subscription has expired. Please renew to access all features.'
        );
      }

      // 2. Fetch subscription details (plan name, end date, days remaining)
      try {
        const subData = await DashboardService.getSubscriptionStatus();
        if (subData) {
          setSubscription(subData);
          if (subData.isExpired || subData.status === 'EXPIRED') {
            setSubscriptionExpiredError(
              'Your subscription has expired. Please contact the administrator to renew your plan.'
            );
          }
        }
      } catch (subErr: any) {
        if (subErr?.errorCode === 'SUBSCRIPTION_EXPIRED') {
          setSubscriptionExpiredError(
            subErr.message || 'Your subscription has expired. Please contact the administrator to renew your plan.'
          );
        }
      }

      // 3. Fetch today's attendance status
      try {
        const attendanceData = await AttendanceService.getTodayStatus();
        setAttendance(attendanceData.attendance);
        setHasCheckedIn(attendanceData.hasCheckedIn);
      } catch (attErr: any) {
        console.warn('[Dashboard] Attendance fetch failed:', attErr.message);
      }
    } catch (err: any) {
      if (err?.errorCode === 'SUBSCRIPTION_EXPIRED' || err?.statusCode === 403) {
        setSubscriptionExpiredError(
          err.message || 'Subscription expired. Please contact support.'
        );
      } else {
        setDashboardError(
          err?.message || 'Unable to load dashboard data. Please pull to refresh.'
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setCheckInError(null);
    setCheckInSuccess(null);
    fetchDashboardData();
  };

  const handleCheckIn = async () => {
    if (hasCheckedIn) return;

    try {
      setIsCheckingIn(true);
      setCheckInError(null);
      setCheckInSuccess(null);

      // 1. Get GPS coordinates with strict permission & device checking
      const coords = await AttendanceService.getCurrentCoordinates();

      // 2. Send latitude and longitude to backend.
      // Backend performs server-side Haversine distance calculation and geo-fence validation.
      const response = await AttendanceService.checkIn(coords.latitude, coords.longitude);

      setHasCheckedIn(true);
      setAttendance(response.attendance);
      setCheckInSuccess('Check-in successful!');

      // Format time for alert
      const timeStr = DateTime.formatTime(response.attendance?.checkInTime);
      Alert.alert('Check-In Successful', `You checked in today at ${timeStr}.`);
    } catch (err: any) {
      if (err instanceof LocationServiceError) {
        // Location permission denied, services disabled, or unavailable
        setCheckInError(err.message);
      } else if (err?.errorCode === 'OUT_OF_RANGE' || err?.statusCode === 403) {
        // Geo-fencing error from backend
        setCheckInError('You are outside the allowed salon location.');
      } else if (err?.errorCode === 'DUPLICATE_CHECK_IN') {
        setHasCheckedIn(true);
        setCheckInError('You have already checked in for today.');
      } else if (err?.errorCode === 'SALON_LOCATION_NOT_CONFIGURED') {
        setCheckInError('Salon location coordinates have not been configured in salon settings.');
      } else {
        setCheckInError(err?.message || 'Unable to complete check-in. Please try again.');
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Salon CRM?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  // 1. Shimmer Skeleton Loading State
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 2. Fatal API Error State
  if (dashboardError && !summary) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={54} color="#DC2626" />
          <Text style={styles.errorTitle}>Unable to load dashboard</Text>
          <Text style={styles.errorSubtitle}>{dashboardError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              fetchDashboardData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const salonDisplayName = summary?.salonName || user?.salon?.name || 'Salon';
  const userRole = user?.role?.code || 'STAFF';
  const isSubscriptionActive =
    (subscription?.status || summary?.subscriptionStatus) === 'ACTIVE' &&
    !subscription?.isExpired &&
    !subscriptionExpiredError;

  const rawOpening =
    summary?.openingTime ||
    user?.salon?.openingTime ||
    AppConfig.OPERATING_HOURS.DEFAULT_OPENING_TIME;
  const rawClosing =
    summary?.closingTime ||
    user?.salon?.closingTime ||
    AppConfig.OPERATING_HOURS.DEFAULT_CLOSING_TIME;
  const salonOpeningTime = DateTime.formatTime12h(rawOpening);
  const salonClosingTime = DateTime.formatTime12h(rawClosing);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSalonName} numberOfLines={1}>
            {salonDisplayName}
          </Text>
          <View style={styles.userMetaRow}>
            <Text style={styles.userName}>{user?.name || user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{userRole}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Log out"
        >
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Subscription Expired Alert Banner */}
        {subscriptionExpiredError ? (
          <View style={styles.expiredBanner}>
            <Ionicons name="warning" size={24} color="#B91C1C" style={styles.alertIcon} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Subscription Expired</Text>
              <Text style={styles.alertBody}>{subscriptionExpiredError}</Text>
            </View>
          </View>
        ) : null}

        {/* Section A: Today's Appointments Count Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(app)/appointments')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="calendar" size={22} color="#0284C7" />
              </View>
              <Text style={styles.cardHeading}>Today's Appointments</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>

          <View style={styles.countRow}>
            <Text style={styles.countNumber}>
              {summary ? summary.todayAppointments : 0}
            </Text>
            <Text style={styles.countSubtitle}>Tap to view schedule & details</Text>
          </View>
        </TouchableOpacity>

        {/* Section B: Subscription Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: isSubscriptionActive ? '#DCFCE7' : '#FEE2E2' },
                ]}
              >
                <Ionicons
                  name={isSubscriptionActive ? 'checkmark-circle' : 'alert-circle'}
                  size={22}
                  color={isSubscriptionActive ? '#15803D' : '#B91C1C'}
                />
              </View>
              <Text style={styles.cardHeading}>Subscription Status</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isSubscriptionActive ? '#DCFCE7' : '#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isSubscriptionActive ? '#15803D' : '#B91C1C' },
                ]}
              >
                {isSubscriptionActive ? 'ACTIVE' : 'EXPIRED'}
              </Text>
            </View>
          </View>

          <View style={styles.subscriptionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan Name:</Text>
              <Text style={styles.detailValue}>
                {subscription?.plan?.name || 'Standard'}
              </Text>
            </View>

            {subscription?.endDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expires On:</Text>
                <Text style={styles.detailValue}>
                  {DateTime.formatDate(subscription.endDate)}
                </Text>
              </View>
            )}

            {subscription?.daysRemaining !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Days Remaining:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        subscription.daysRemaining <= AppConfig.SUBSCRIPTION.EXPIRING_SOON_DAYS
                          ? '#B91C1C'
                          : '#111827',
                      fontWeight: '600',
                    },
                  ]}
                >
                  {subscription.daysRemaining} days
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Section C & D: Attendance Status & GPS Check-In Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleGroup}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: hasCheckedIn ? '#DCFCE7' : '#FEF3C7' },
                ]}
              >
                <Ionicons
                  name={hasCheckedIn ? 'shield-checkmark' : 'location'}
                  size={22}
                  color={hasCheckedIn ? '#15803D' : '#D97706'}
                />
              </View>
              <Text style={styles.cardHeading}>Attendance Check-In</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: hasCheckedIn ? '#DCFCE7' : '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: hasCheckedIn ? '#15803D' : '#B45309' },
                ]}
              >
                {hasCheckedIn ? 'Checked In' : 'Not Checked In'}
              </Text>
            </View>
          </View>

          {/* Salon Working Hours Section */}
          <View style={styles.workingHoursBox}>
            <View style={styles.workingHoursHeader}>
              <Ionicons name="time-outline" size={15} color="#0284C7" />
              <Text style={styles.workingHoursTitle}>Salon Operating Hours</Text>
            </View>
            <View style={styles.workingHoursRow}>
              <View style={styles.workingHoursItem}>
                <Text style={styles.workingHoursLabel}>Opening Time</Text>
                <Text style={styles.workingHoursValue}>{salonOpeningTime} ({rawOpening})</Text>
              </View>
              <View style={styles.workingHoursDivider} />
              <View style={styles.workingHoursItem}>
                <Text style={styles.workingHoursLabel}>Closing Time</Text>
                <Text style={styles.workingHoursValue}>{salonClosingTime} ({rawClosing})</Text>
              </View>
            </View>
          </View>

          {/* Attendance Status Info */}
          {hasCheckedIn && <View style={[styles.attendanceInfoBox, hasCheckedIn ? styles.infoBoxCheckedIn : styles.infoBoxNotChecked]}>
            <View style={styles.checkedInDetails}>
              <Ionicons name="checkmark-circle" size={20} color="#15803D" />
              <View style={styles.statusTextGroup}>
                <Text style={styles.checkedInStatusTitle}>Attendance Status: Checked In</Text>
                <Text style={styles.checkedInText}>
                  Checked in today at {DateTime.formatTime(attendance?.checkInTime)}
                </Text>
              </View>
            </View>
          </View>}

          {/* Check-in Error Alert */}
          {checkInError ? (
            <View style={styles.checkInErrorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" style={styles.checkInErrorIcon} />
              <Text style={styles.checkInErrorText}>{checkInError}</Text>
            </View>
          ) : null}

          {/* Check-in Success Banner */}
          {checkInSuccess && !checkInError ? (
            <View style={styles.checkInSuccessBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#15803D" style={styles.checkInErrorIcon} />
              <Text style={styles.checkInSuccessText}>{checkInSuccess}</Text>
            </View>
          ) : null}

          {/* Check-In Option / Button */}
          <TouchableOpacity
            style={[
              styles.checkInButton,
              hasCheckedIn && styles.checkInButtonDisabled,
              isCheckingIn && styles.checkInButtonLoading,
            ]}
            onPress={handleCheckIn}
            disabled={hasCheckedIn || isCheckingIn}
            accessibilityLabel={hasCheckedIn ? 'Checked In' : 'Check In Button'}
          >
            {isCheckingIn ? (
              <View style={styles.buttonInnerRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.checkInButtonText}>Verifying Location & Checking In...</Text>
              </View>
            ) : hasCheckedIn ? (
              <View style={styles.buttonInnerRow}>
                <Ionicons name="checkmark-circle" size={18} color="#9CA3AF" />
                <Text style={styles.checkInButtonDisabledText}>Checked In</Text>
              </View>
            ) : (
              <View style={styles.buttonInnerRow}>
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <Text style={styles.checkInButtonText}>Check In Now</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#4B5563',
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
  headerSalonName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  userName: {
    fontSize: 13,
    color: '#6B7280',
  },
  roleBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  expiredBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B91C1C',
    marginBottom: 2,
  },
  alertBody: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
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
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countRow: {
    marginTop: 6,
  },
  countNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0284C7',
  },
  countSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  subscriptionDetails: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  attendanceInfoBox: {
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
  },
  workingHoursBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
  },
  workingHoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  workingHoursTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workingHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  workingHoursItem: {
    alignItems: 'center',
    flex: 1,
  },
  workingHoursLabel: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '500',
    marginBottom: 2,
  },
  workingHoursValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C4A6E',
  },
  workingHoursDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#BAE6FD',
  },
  infoBoxCheckedIn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoBoxNotChecked: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusTextGroup: {
    flex: 1,
    gap: 2,
  },
  checkedInStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  notCheckedInDetails: {
    gap: 4,
  },
  notCheckedInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notCheckedInTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  checkedInDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkedInText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#166534',
  },
  notCheckedInText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  checkInErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  checkInErrorIcon: {
    marginRight: 8,
  },
  checkInErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
  },
  checkInSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  checkInSuccessText: {
    flex: 1,
    fontSize: 13,
    color: '#15803D',
  },
  checkInButton: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  checkInButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  checkInButtonLoading: {
    opacity: 0.8,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkInButtonDisabledText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 14,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
