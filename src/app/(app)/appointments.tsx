import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppointmentService } from '../../services/appointmentService';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import AppointmentsSkeleton from '../../components/AppointmentsSkeleton';
import { DateTime } from '../../utils/DateTime';
import { NumberUtils } from '../../utils/NumberUtils';
import { StringUtils } from '../../utils/StringUtils';

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await AppointmentService.getTodayAppointments();
      setAppointments(data);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to fetch appointments. Please pull down to refresh.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAppointments();
  };

  const getStatusBadgeStyle = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'COMPLETED':
        return { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' };
      case 'CANCELLED':
        return { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' };
      case 'PENDING':
      default:
        return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
    }
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const badgeStyle = getStatusBadgeStyle(item.status);
    const clientName = StringUtils.trim(item.client?.name) || 'Walk-in Client';
    const clientPhone = item.client?.phone || '';
    const serviceName = StringUtils.trim(item.service?.name) || 'General Service';
    const staffName = StringUtils.trim(item.staff?.name) || 'Unassigned Staff';
    const duration = DateTime.calculateDuration(item.startTime, item.endTime);

    return (
      <View style={styles.card}>
        {/* Top Header Row: Date, Time & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={15} color="#0284C7" />
              <Text style={styles.dateLabel}>{DateTime.formatDate(item.date)}</Text>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={15} color="#0284C7" />
              <Text style={styles.timeText}>
                {item.startTime} – {item.endTime}
              </Text>
              {duration ? <Text style={styles.durationBadge}>({duration})</Text> : null}
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Client Name & Phone */}
        <View style={styles.detailRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={16} color="#0284C7" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.fieldLabel}>Client</Text>
            <View style={styles.clientInfoRow}>
              <Text style={styles.primaryText}>{clientName}</Text>
              {clientPhone ? <Text style={styles.phoneText}>{clientPhone}</Text> : null}
            </View>
          </View>
        </View>

        {/* Service & Price */}
        <View style={styles.detailRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="cut" size={16} color="#0284C7" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.fieldLabel}>Service</Text>
            <View style={styles.serviceInfoRow}>
              <Text style={styles.primaryText}>{serviceName}</Text>
              {item.service?.price !== undefined ? (
                <Text style={styles.priceTag}>
                  {NumberUtils.formatCurrency(item.service.price)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Staff Specialist */}
        <View style={styles.detailRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={16} color="#0284C7" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.fieldLabel}>Staff Specialist</Text>
            <Text style={styles.primaryText}>{staffName}</Text>
          </View>
        </View>

        {/* Optional Notes */}
        {item.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>Note: {item.notes}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (isLoading) {
    return <AppointmentsSkeleton />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Date Header Sub-bar */}
      <View style={styles.dateSubBar}>
        <Ionicons name="calendar" size={18} color="#0284C7" />
        <Text style={styles.subBarDateText}>{DateTime.formatHeaderDate()}</Text>
        <View style={styles.readOnlyBadge}>
          <Text style={styles.readOnlyText}>READ-ONLY</Text>
        </View>
      </View>

      {/* Main Content Area */}
      {errorMessage ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Unable to load today's appointments.</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAppointments}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : appointments.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.emptyScroll}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="calendar-clear-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No appointments scheduled for today.</Text>
              <Text style={styles.emptySubtitle}>Pull down to refresh schedule.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id || item._id || `${item.date}-${item.startTime}`}
          renderItem={renderAppointmentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        />
      )}
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
  subBarDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  readOnlyBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  readOnlyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
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
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284C7',
  },
  durationBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  phoneText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  serviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceTag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  notesBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
  },
  notesText: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyScroll: {
    flexGrow: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#4B5563',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B91C1C',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
