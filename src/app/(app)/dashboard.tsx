import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { AttendanceRecord, DashboardSummary, SalonLocationConfig, SubscriptionStatusData } from '../../types/dashboard';
import { DateTime } from '../../utils/DateTime';
import { DistanceUtils } from '../../utils/DistanceUtils';
import { AppConfig } from '../../config/AppConfig';
import { usePermission } from '../../hooks/usePermission';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const {
    canCheckInAttendance,
    canViewAttendance,
    canViewAppointments,
    canViewSubscription,
    canViewDashboard,
  } = usePermission();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatusData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);
  const [hasCheckedOut, setHasCheckedOut] = useState<boolean>(false);
  const [salonLocation, setSalonLocation] = useState<SalonLocationConfig | null>(null);

  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkOutError, setCheckOutError] = useState<string | null>(null);
  const [subscriptionExpiredError, setSubscriptionExpiredError] = useState<string | null>(null);

  const [outOfRangeDetails, setOutOfRangeDetails] = useState<{
    distance: number;
    allowedRadius: number;
    exceededBy: number;
    formattedDistance: string;
    formattedAllowedRadius: string;
    formattedExceededBy: string;
  } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setDashboardError(null);
    setSubscriptionExpiredError(null);

    let summaryData: DashboardSummary | null = null;
    if (canViewDashboard) {
      try {
        summaryData = await DashboardService.getSummary();
        setSummary(summaryData);

        if (summaryData.subscriptionStatus === 'EXPIRED') {
          setSubscriptionExpiredError(
            'Your salon subscription has expired. Please renew to access all features.'
          );
        }
      } catch (sumErr: any) {
        if (sumErr?.errorCode === 'SUBSCRIPTION_EXPIRED') {
          setSubscriptionExpiredError(
            sumErr.message || 'Subscription expired. Please contact support.'
          );
        } else {
          console.warn('[Dashboard] Summary fetch failed:', sumErr?.message);
        }
      }
    }

    if (canViewSubscription) {
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
    }

    if (canViewAttendance) {
      try {
        const attendanceData = await AttendanceService.getTodayStatus();
        setAttendance(attendanceData.attendance);
        setHasCheckedIn(attendanceData.hasCheckedIn);
        setHasCheckedOut(!!attendanceData.attendance?.checkOutTime);
        if (attendanceData.salonLocation) {
          setSalonLocation(attendanceData.salonLocation);
        } else if (summaryData?.salonLocation) {
          setSalonLocation(summaryData.salonLocation);
        }
      } catch (attErr: any) {
        console.warn('[Dashboard] Attendance fetch failed:', attErr.message);
      }
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [canViewDashboard, canViewSubscription, canViewAttendance]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setCheckInError(null);
    setCheckOutError(null);
    setOutOfRangeDetails(null);
    fetchDashboardData();
  };

  const handleCheckIn = async () => {
    if (hasCheckedIn) return;

    try {
      setIsCheckingIn(true);
      setCheckInError(null);
      setCheckOutError(null);
      setOutOfRangeDetails(null);

      // Check and prompt for location permission if not granted
      const permission = await AttendanceService.ensureLocationPermission();
      if (permission.status !== 'granted') {
        setIsCheckingIn(false);
        setCheckInError('Location permission is required to verify attendance check-in.');
        if (!permission.canAskAgain) {
          Alert.alert(
            'Location Permission Required',
            'Location access is required to verify your attendance check-in. Please enable location permissions in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert(
            'Location Permission Required',
            'Location access is required to verify your attendance check-in. Please grant location access when prompted.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      const coords = await AttendanceService.getCurrentCoordinates();

      const response = await AttendanceService.checkIn(coords.latitude, coords.longitude);

      setHasCheckedIn(true);
      setHasCheckedOut(false);
      setAttendance(response.attendance);

      const distanceDisplay = response.attendance?.distanceFromSalon !== undefined
        ? ` (${DistanceUtils.formatDistance(response.attendance.distanceFromSalon)} from salon)`
        : '';
      const timeStr = DateTime.formatTime(response.attendance?.checkInTime);
      Alert.alert('Check-In Successful', `You checked in today at ${timeStr}${distanceDisplay}.`);
    } catch (err: any) {
      if (err instanceof LocationServiceError) {
        setCheckInError(err.message);
        if (err.code === 'SERVICES_DISABLED') {
          Alert.alert(
            'Location Services Disabled',
            'Location services (GPS) are turned off on your device. Please turn on location services in device settings to check in.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        } else if (err.code === 'PERMISSION_DENIED') {
          Alert.alert(
            'Location Permission Required',
            'Location access is required to verify your attendance check-in. Please enable location permissions in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else if (err?.errorCode === 'OUT_OF_RANGE' || err?.statusCode === 403) {
        const details = err?.details || err?.rawError?.details;
        if (details && details.distance !== undefined && details.allowedRadius !== undefined) {
          const dist = Number(details.distance);
          const rad = Number(details.allowedRadius);
          const exc = details.exceededBy !== undefined ? Number(details.exceededBy) : Math.max(0, dist - rad);
          const formattedDist = DistanceUtils.formatDistance(dist);
          const formattedRad = DistanceUtils.formatDistance(rad);
          const formattedExc = DistanceUtils.formatDistance(exc);
          setOutOfRangeDetails({
            distance: dist,
            allowedRadius: rad,
            exceededBy: exc,
            formattedDistance: formattedDist,
            formattedAllowedRadius: formattedRad,
            formattedExceededBy: formattedExc,
          });
          setCheckInError(
            `You are outside the permitted salon radius for check-in.\n• Distance from salon: ${formattedDist}\n• Allowed radius: ${formattedRad}\n• Exceeds boundary by: ${formattedExc}`
          );
        } else {
          setCheckInError('You are outside the permitted salon radius for check-in.');
        }
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

  const handleCheckOut = async () => {
    if (!hasCheckedIn || hasCheckedOut) return;

    try {
      setIsCheckingOut(true);
      setCheckOutError(null);
      setCheckInError(null);

      const response = await AttendanceService.checkOut();

      setHasCheckedOut(true);
      setAttendance(response.attendance);

      const timeStr = DateTime.formatTime(response.attendance?.checkOutTime);
      Alert.alert('Check-Out Successful', `You checked out today at ${timeStr}.`);
    } catch (err: any) {
      if (err?.errorCode === 'ALREADY_CHECKED_OUT') {
        setHasCheckedOut(true);
        setCheckOutError('You have already checked out for today.');
      } else if (err?.errorCode === 'NOT_CHECKED_IN') {
        setHasCheckedIn(false);
        setCheckOutError('You must check in first before checking out.');
      } else {
        setCheckOutError(err?.message || 'Unable to complete check-out. Please try again.');
      }
    } finally {
      setIsCheckingOut(false);
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

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
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
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
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

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
        {canViewAppointments && (
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
        )}

        {/* Section B: Subscription Status Card */}
        {canViewSubscription && (
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
        )}

        {/* Section C & D: Attendance Status & GPS Check-In Card */}
        {canViewAttendance && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleGroup}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: hasCheckedOut
                        ? '#E0F2FE'
                        : hasCheckedIn
                          ? '#DCFCE7'
                          : '#FEF3C7',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      hasCheckedOut
                        ? 'shield-checkmark'
                        : hasCheckedIn
                          ? 'checkmark-circle'
                          : 'location'
                    }
                    size={22}
                    color={
                      hasCheckedOut
                        ? '#0284C7'
                        : hasCheckedIn
                          ? '#15803D'
                          : '#D97706'
                    }
                  />
                </View>
                <Text style={styles.cardHeading}>Attendance Check-In</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: hasCheckedOut
                      ? '#E0F2FE'
                      : hasCheckedIn
                        ? '#DCFCE7'
                        : '#FEF3C7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: hasCheckedOut
                        ? '#0284C7'
                        : hasCheckedIn
                          ? '#15803D'
                          : '#B45309',
                    },
                  ]}
                >
                  {hasCheckedOut ? 'Checked Out' : hasCheckedIn ? 'Checked In' : 'Not Checked In'}
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

            {/* Case 1: Checked In (shows "8:29PM - [Check-Out button at the end]") */}
            {hasCheckedIn && !hasCheckedOut && (
              <View style={[styles.attendanceInfoBox, styles.infoBoxCheckedIn]}>
                <View style={styles.attendanceInlineRow}>
                  <View style={styles.attendanceTimeGroup}>
                    <Ionicons name="time-outline" size={18} color="#15803D" />
                    <Text style={styles.attendanceTimeText}>
                      {DateTime.formatTime(attendance?.checkInTime)}
                    </Text>
                    <Text style={styles.attendanceTimeSeparator}>-</Text>
                  </View>
                  {canCheckInAttendance && (
                    <TouchableOpacity
                      style={[
                        styles.inlineCheckOutButton,
                        isCheckingOut && styles.checkInButtonLoading,
                      ]}
                      onPress={handleCheckOut}
                      disabled={isCheckingOut}
                      accessibilityLabel="Check Out Button"
                    >
                      {isCheckingOut ? (
                        <View style={styles.inlineButtonInner}>
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <Text style={styles.inlineCheckOutButtonText}>Checking Out...</Text>
                        </View>
                      ) : (
                        <View style={styles.inlineButtonInner}>
                          <Ionicons name="log-out-outline" size={15} color="#FFFFFF" />
                          <Text style={styles.inlineCheckOutButtonText}>Check-Out</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Case 2: Checked Out (shows "8:29PM - 8:30PM") */}
            {hasCheckedIn && hasCheckedOut && (
              <View style={[styles.attendanceInfoBox, { backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD' }]}>
                <View style={styles.attendanceTimeGroup}>
                  <Ionicons name="time-outline" size={18} color="#0284C7" />
                  <Text style={styles.attendanceTimeText}>
                    {DateTime.formatTime(attendance?.checkInTime)}
                  </Text>
                  <Text style={styles.attendanceTimeSeparator}>-</Text>
                  <Text style={[styles.attendanceTimeText, { color: '#0284C7' }]}>
                    {DateTime.formatTime(attendance?.checkOutTime)}
                  </Text>
                </View>
              </View>
            )}

            {/* Out of Range Detailed Error Breakdown */}
            {outOfRangeDetails && (
              <View style={styles.outOfRangeCard}>
                <View style={styles.outOfRangeHeader}>
                  <Ionicons name="warning" size={18} color="#DC2626" />
                  <Text style={styles.outOfRangeTitle}>Outside Permitted Salon Radius</Text>
                </View>
                <View style={styles.outOfRangeRow}>
                  <Text style={styles.outOfRangeLabel}>Distance to Salon:</Text>
                  <Text style={styles.outOfRangeValue}>{outOfRangeDetails.formattedDistance}</Text>
                </View>
                <View style={styles.outOfRangeRow}>
                  <Text style={styles.outOfRangeLabel}>Permitted Radius:</Text>
                  <Text style={styles.outOfRangeValue}>{outOfRangeDetails.formattedAllowedRadius}</Text>
                </View>
                <View style={styles.outOfRangeRow}>
                  <Text style={styles.outOfRangeLabel}>Exceeds Boundary By:</Text>
                  <Text style={styles.outOfRangeExceededValue}>+{outOfRangeDetails.formattedExceededBy}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 6, fontStyle: 'italic' }}>
                  Please move closer to the salon location to complete your attendance check-in.
                </Text>
              </View>
            )}

            {/* Generic Check-in Error Alert */}
            {checkInError && !outOfRangeDetails ? (
              <View style={styles.checkInErrorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={styles.checkInErrorIcon} />
                <Text style={styles.checkInErrorText}>{checkInError}</Text>
              </View>
            ) : null}


            {/* Generic Check-out Error Alert */}
            {checkOutError ? (
              <View style={styles.checkInErrorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={styles.checkInErrorIcon} />
                <Text style={styles.checkInErrorText}>{checkOutError}</Text>
              </View>
            ) : null}

            {/* Check-In Action Button (only shown when not checked in yet) */}
            {canCheckInAttendance && !hasCheckedIn && (
              <TouchableOpacity
                style={[
                  styles.checkInButton,
                  isCheckingIn && styles.checkInButtonLoading,
                ]}
                onPress={handleCheckIn}
                disabled={isCheckingIn}
                accessibilityLabel="Check In Button"
              >
                {isCheckingIn ? (
                  <View style={styles.buttonInnerRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.checkInButtonText}>Verifying Location & Checking In...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonInnerRow}>
                    <Ionicons name="navigate" size={18} color="#FFFFFF" />
                    <Text style={styles.checkInButtonText}>Check In Now</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {!canCheckInAttendance && (
              <View style={styles.viewOnlyAttendanceBox}>
                <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                <Text style={styles.viewOnlyAttendanceText}>
                  Attendance check-in is not permitted for your assigned role (View Only).
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Informational Card when user has neither Appointments nor Attendance operational permissions */}
        {!canViewAppointments && !canViewAttendance && (
          <View style={styles.card}>
            <View style={styles.adminScopeBox}>
              <Ionicons name="shield-checkmark-outline" size={40} color="#0284C7" />
              <Text style={styles.adminScopeTitle}>Administrative Scope</Text>
              <Text style={styles.adminScopeText}>
                Your account has administrative permissions. Mobile attendance check-in and salon appointments are scoped strictly to salon operational staff. Full administration is accessible on the Web Portal.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerSafeArea: {
    backgroundColor: '#0284C7',
  },
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
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerSalonName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  userName: {
    fontSize: 13,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  attendanceInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  attendanceTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendanceTimeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  attendanceTimeSeparator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginHorizontal: 2,
  },
  inlineCheckOutButton: {
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inlineCheckOutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  checkOutButton: {
    backgroundColor: '#D97706',
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
  geofenceConfigBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  geofenceConfigText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
    flex: 1,
  },
  outOfRangeCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  outOfRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  outOfRangeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  outOfRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  outOfRangeLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  outOfRangeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  outOfRangeExceededValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  recordedDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  recordedDistanceText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  viewOnlyAttendanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  viewOnlyAttendanceText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  adminScopeBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  adminScopeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  adminScopeText: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
