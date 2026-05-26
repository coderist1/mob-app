// screens/BookingsScreen.js
import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  primaryLighter: '#D8F3DC',
  primaryBg: '#F0F9F4',
  navy: '#1B2E35',
  danger: '#E63946',
  warning: '#F4A261',
  success: '#2A9D8F',
  info: '#4A9FF5',
  white: '#FFFFFF',
  black: '#0A0A0A',
  gray50: '#F8F9FA',
  gray100: '#F1F3F5',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
};

const BADGE = {
  pending:   { bg: '#FFF3E0', col: '#E67E22', label: 'Pending' },
  approved:  { bg: '#E3FCF2', col: '#2D6A4F', label: 'Active' },
  completed: { bg: '#E3F2FD', col: '#1E88E5', label: 'Completed' },
  rejected:  { bg: '#FFEBEE', col: '#E63946', label: 'Rejected' },
};

const formatDate = (dateStr, format = 'short') => {
  const date = new Date(dateStr);
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysBetween = (start, end) => {
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
};

const StatusBadge = ({ status }) => {
  const badge = BADGE[status] || BADGE.pending;
  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.badgeText, { color: badge.col }]}>{badge.label}</Text>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

function BookingCard({ item, isExpanded, onToggle, userRole }) {
  const { returnVehicle, setBookingStatus } = useBookings();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const days = getDaysBetween(item.startDate, item.endDate);
  const dailyRate = days > 0 ? Math.round(item.totalPrice / days) : 0;
  const isRenter = userRole === 'renter';
  const isOwner = userRole === 'owner';

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const handleCancelRenter = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking request?', [
      { text: 'No', style: 'cancel' },
      { 
        text: 'Yes, Cancel', 
        style: 'destructive', 
        onPress: () => {
          if (setBookingStatus) {
            setBookingStatus(item.id, 'rejected', 'Cancelled by renter');
          } else {
            Alert.alert('Cancelled', 'Booking has been cancelled.');
          }
        }
      }
    ]);
  };

  const handleApprove = () => {
    Alert.alert('Approve Request', 'Confirm to approve this booking request.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Approve', onPress: () => setBookingStatus?.(item.id, 'approved') }
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Request', 'Reason for rejection?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Vehicle Unavailable', onPress: () => setBookingStatus?.(item.id, 'rejected', 'Vehicle unavailable') },
      { text: 'Other Reason', onPress: () => setBookingStatus?.(item.id, 'rejected', 'Request rejected by owner') },
    ]);
  };

  const handleReturnVehicle = () => {
    Alert.alert(
      'Return Vehicle',
      'Confirm that the vehicle has been returned in good condition.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Return',
          style: 'default',
          onPress: () => {
            returnVehicle(item.id, {
              returnedAt: new Date().toISOString(),
              returnNotes: '',
            });
            Alert.alert('Success', 'Vehicle return recorded. Booking completed.');
          },
        },
      ]
    );
  };

  const handleContact = () => {
    const contactName = isRenter ? item.ownerName : item.renterName;
    Alert.alert('Contact', `Send message to ${contactName}`, [{ text: 'OK' }]);
  };

  const renderActionButtons = () => {
    if (isRenter) {
      if (item.status === 'pending') {
        return (
          <TouchableOpacity style={styles.btnOutlineDanger} onPress={handleCancelRenter}>
            <Text style={styles.btnOutlineDangerText}>Cancel Request</Text>
          </TouchableOpacity>
        );
      }
      if (item.status === 'approved') {
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btnPrimary, styles.flex1]} onPress={handleReturnVehicle}>
              <Text style={styles.btnPrimaryText}>Return Vehicle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnOutline, styles.flex1]} onPress={handleContact}>
              <Text style={styles.btnOutlineText}>Contact Owner</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (item.status === 'completed') {
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btnOutline, styles.flex1]} onPress={() => router.push('/feedback')}>
              <Text style={styles.btnOutlineText}>Leave Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimary, styles.flex1]} onPress={() => router.push('/')}>
              <Text style={styles.btnPrimaryText}>Book Again</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    if (isOwner) {
      if (item.status === 'pending') {
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btnSuccess, styles.flex1]} onPress={handleApprove}>
              <Text style={styles.btnSuccessText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnDanger, styles.flex1]} onPress={handleReject}>
              <Text style={styles.btnDangerText}>Reject</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (item.status === 'approved') {
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btnPrimary, styles.flex1]} onPress={handleReturnVehicle}>
              <Text style={styles.btnPrimaryText}>Mark as Returned</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnOutline, styles.flex1]} onPress={handleContact}>
              <Text style={styles.btnOutlineText}>Message Renter</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    return null;
  };

  return (
    <View style={styles.bookingCard}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.cardContent}>
          <View style={styles.imageSection}>
            {item.vehiclePhotoUri ? (
              <Image 
                source={{ uri: item.vehiclePhotoUri }} 
                style={styles.vehicleImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fallbackImage}>
                <Text style={styles.fallbackText}>Car</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.titleRow}>
              <Text style={styles.vehicleName} numberOfLines={1}>{item.vehicleName}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.modelText}>{item.vehicleModel} • {item.year || '2024'}</Text>
            
            <View style={styles.participantRow}>
              <Text style={styles.participantLabel}>{isRenter ? 'Owner:' : 'Renter:'}</Text>
              <Text style={styles.participantName}>{isRenter ? item.ownerName : item.renterName}</Text>
            </View>

            <View style={styles.dateChip}>
              <Text style={styles.dateChipText}>
                {formatDate(item.startDate)} → {formatDate(item.endDate)} • {days} {days === 1 ? 'day' : 'days'}
              </Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.totalPrice}>₱{item.totalPrice.toLocaleString()}</Text>
              <Text style={styles.dailyRate}>₱{dailyRate.toLocaleString()}/day</Text>
            </View>

            <View style={styles.expandIcon}>
              <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <Animated.View style={[styles.expandedContainer, { opacity: fadeAnim }]}>
          <View style={styles.divider} />
          
          <View style={styles.detailsGrid}>
            <DetailRow label="Start Date" value={formatDate(item.startDate, 'full')} />
            <DetailRow label="End Date" value={formatDate(item.endDate, 'full')} />
            <DetailRow label="Duration" value={`${days} ${days === 1 ? 'day' : 'days'}`} />
            <DetailRow label="Daily Rate" value={`₱${dailyRate.toLocaleString()}`} />
            <DetailRow label="Total Amount" value={`₱${item.totalPrice.toLocaleString()}`} />
            {item.pickupLocation && <DetailRow label="Pickup Location" value={item.pickupLocation} />}
          </View>

          {item.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Booking Notes</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}

          {item.status === 'rejected' && item.rejectionReason && (
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
              <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
            </View>
          )}

          <View style={styles.actionContainer}>
            {renderActionButtons()}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

export default function BookingsScreen({ hideHeader = false }) {
  const router = useRouter();
  const { user } = useAuth();
  const { getBookingsForOwner, getBookingsForRenter, refreshBookings } = useBookings();

  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (typeof refreshBookings === 'function') await refreshBookings();
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { handleRefresh(); }, []));

  const baseData = useMemo(() => {
    if (user?.role === 'owner') return getBookingsForOwner(user?.id || user?.email);
    if (user?.role === 'renter') return getBookingsForRenter(user?.email);
    return [];
  }, [user, getBookingsForOwner, getBookingsForRenter]);

  const stats = useMemo(() => ({
    total: baseData.length,
    pending: baseData.filter(x => x.status === 'pending').length,
    approved: baseData.filter(x => x.status === 'approved').length,
    completed: baseData.filter(x => x.status === 'completed').length,
  }), [baseData]);

  const filtered = useMemo(() => {
    let list = activeTab === 'all' ? baseData : baseData.filter(i => i.status === activeTab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(i =>
        (i.vehicleName?.toLowerCase().includes(q)) ||
        (i.ownerName?.toLowerCase().includes(q)) ||
        (i.renterName?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeTab, baseData, query]);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const TABS = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending, color: C.warning },
    { key: 'approved', label: 'Active', count: stats.approved, color: C.success },
    { key: 'completed', label: 'Completed', count: stats.completed, color: C.info },
  ];

  const roleTitle = user?.role === 'owner' ? 'Rental Requests' : 'My Bookings';
  const roleSubtitle = user?.role === 'owner' 
    ? 'Manage incoming requests and track rentals' 
    : 'Track your trips';

  const content = (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.primary]} />}
    >
      <View style={styles.heroSection}>
        <Text style={styles.heroBadge}>{user?.role === 'owner' ? 'OWNER' : 'RENTER'}</Text>
        <Text style={styles.heroTitle}>{roleTitle}</Text>
        <Text style={styles.heroSubtitle}>{roleSubtitle}</Text>
      </View>

      <View style={styles.statsGrid}>
        {TABS.map(stat => (
          <TouchableOpacity 
            key={stat.key} 
            style={[styles.statCard, activeTab === stat.key && styles.statCardActive]}
            onPress={() => setActiveTab(stat.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.statValue, { color: stat.color || C.gray700 }]}>{stat.count}</Text>
            <Text style={[styles.statLabel, activeTab === stat.key && styles.statLabelActive]}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by vehicle, owner, or renter..."
          placeholderTextColor={C.gray500}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No bookings found</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'all' 
              ? "You don't have any bookings yet. Start exploring vehicles!" 
              : `No ${activeTab} bookings to show.`}
          </Text>
          {activeTab !== 'all' && (
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('all')}>
              <Text style={styles.emptyBtnText}>View All Bookings</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filtered.map(item => (
          <BookingCard
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => toggleExpand(item.id)}
            userRole={user?.role}
          />
        ))
      )}
    </ScrollView>
  );

  if (hideHeader) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{roleTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {user?.role === 'owner' ? 'Manage bookings & approvals' : 'Track your trips'}
          </Text>
        </View>
      </View>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.gray50,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: C.gray50,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    color: C.gray600,
    fontWeight: '400',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.navy,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.gray600,
    marginTop: 2,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.navy,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: C.gray600,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 52) / 4 - 8,
    backgroundColor: C.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.gray200,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statCardActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLighter,
    borderWidth: 1.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: C.gray600,
    marginTop: 4,
    fontWeight: '500',
  },
  statLabelActive: {
    color: C.primary,
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gray200,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: C.gray500,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: C.gray900,
  },
  clearBtn: {
    padding: 6,
  },
  clearIcon: {
    fontSize: 16,
    color: C.gray500,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.gray100,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  imageSection: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: C.gray100,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    backgroundColor: C.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 24,
    color: C.gray400,
    fontWeight: '600',
  },
  infoSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '700',
    color: C.navy,
    flex: 1,
    marginRight: 8,
  },
  modelText: {
    fontSize: 13,
    color: C.gray600,
    marginBottom: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantLabel: {
    fontSize: 12,
    color: C.gray500,
    marginRight: 6,
  },
  participantName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.gray800,
  },
  dateChip: {
    backgroundColor: C.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  dateChipText: {
    fontSize: 12,
    color: C.gray700,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
  },
  dailyRate: {
    fontSize: 12,
    color: C.gray500,
  },
  expandIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  chevron: {
    fontSize: 16,
    color: C.gray400,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: C.gray100,
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: C.gray50,
    padding: 12,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.gray500,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.gray900,
  },
  notesSection: {
    backgroundColor: C.gray50,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.gray600,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: C.gray800,
    lineHeight: 18,
  },
  rejectionBox: {
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 16,
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.danger,
    marginBottom: 6,
  },
  rejectionText: {
    fontSize: 13,
    color: '#C62828',
  },
  actionContainer: {
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 14,
  },
  btnOutline: {
    backgroundColor: C.white,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.gray300,
  },
  btnOutlineText: {
    color: C.gray700,
    fontWeight: '600',
    fontSize: 14,
  },
  btnOutlineDanger: {
    backgroundColor: '#FFF5F5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  btnOutlineDangerText: {
    color: C.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  btnSuccess: {
    backgroundColor: C.success,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnSuccessText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 14,
  },
  btnDanger: {
    backgroundColor: C.danger,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnDangerText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: C.white,
    borderRadius: 24,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.gray800,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.gray500,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyBtn: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  emptyBtnText: {
    color: C.white,
    fontWeight: '600',
    fontSize: 14,
  },
});