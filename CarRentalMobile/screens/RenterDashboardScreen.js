// screens/RenterDashboardScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, Platform, Image, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useLogReport } from '../context/LogReportContext';
import { useVehicles } from '../context/VehicleContext';
import BottomNav from '../components/BottomNav';
import ProfileAvatar from '../components/ProfileAvatar';
import LogReportScreen from './LogReportScreen';
import BookingsScreen from './BookingsScreen';
import CalendarPicker from '../components/calendar-picker';

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

const formatYMD = (d) => {
  if (!(d instanceof Date)) d = new Date(d);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseYMD = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

function VehicleDetailModal({ visible, vehicle, onClose, onRent }) {
  if (!vehicle) return null;

  const photoUri = vehicle.photoUri;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Vehicle Details</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView>
          <View style={{ height: 280, backgroundColor: '#f3f6fb' }}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 64, color: C.gray400 }}>Car</Text>
                <Text style={{ color: C.gray400, marginTop: 12, fontSize: 16 }}>No photo available</Text>
              </View>
            )}
          </View>

          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: C.navy }}>
              {vehicle.name || 'Unnamed Vehicle'}
            </Text>
            <Text style={{ fontSize: 16, color: C.gray500, marginTop: 4 }}>
              {vehicle.model} • {vehicle.year}
            </Text>

            <Text style={{ fontSize: 22, fontWeight: '700', color: C.primary, marginTop: 12 }}>
              ₱{parseFloat(vehicle.pricePerDay || 0).toLocaleString()}/day
            </Text>

            <View style={{ marginVertical: 20 }}>
              <View style={styles.vehicleChipRow}>
                {vehicle.seats && (
                  <View style={styles.vehicleInfoChip}>
                    <Text style={styles.vehicleInfoChipText}>{vehicle.seats} Seats</Text>
                  </View>
                )}
                {vehicle.fuel && (
                  <View style={styles.vehicleInfoChip}>
                    <Text style={styles.vehicleInfoChipText}>{vehicle.fuel}</Text>
                  </View>
                )}
                {vehicle.location && (
                  <View style={styles.vehicleInfoChip}>
                    <Text style={styles.vehicleInfoChipText}>{vehicle.location}</Text>
                  </View>
                )}
                {vehicle.ownerName && (
                  <View style={styles.vehicleInfoChip}>
                    <Text style={styles.vehicleInfoChipText}>Owner: {vehicle.ownerName}</Text>
                  </View>
                )}
              </View>
            </View>

            {vehicle.description && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.fieldLabel}>Description</Text>
                <Text style={{ fontSize: 15, lineHeight: 22, color: C.gray700 }}>
                  {vehicle.description}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => onRent(vehicle)}
              disabled={vehicle.status !== 'available'}
              style={[
                styles.btnPrimary,
                vehicle.status !== 'available' && { backgroundColor: C.gray400 }
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {vehicle.status === 'available' ? 'Rent This Vehicle' : 'Currently Not Available'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function VehicleCard({ vehicle, onRent, isSaved, onToggleSave, onPress }) {
  const available = vehicle.status === 'available';
  const vehicleName = vehicle.name || 'Unnamed Vehicle';
  const yearLabel = vehicle.year || '----';
  const modelLabel = vehicle.model || 'Vehicle';
  const seatsLabel = vehicle.seats ? `${vehicle.seats} seats` : 'Seats n/a';
  const fuelLabel = vehicle.fuel || 'Fuel n/a';
  const ownerLabel = vehicle.ownerName || 'Owner n/a';
  
  // Get the photo URI - already processed by VehicleContext
  const photoUri = vehicle.photoUri;

  return (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.vehicleImageWrap}>
        {photoUri ? (
          <Image 
            source={{ uri: photoUri }} 
            style={styles.vehicleImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.vehicleImage, styles.vehicleThumbFallback]}>
            <Text style={styles.vehicleThumbFallbackText}>Car</Text>
          </View>
        )}
        <View style={[styles.vehicleStatusPill, { backgroundColor: available ? '#E3FCF2' : '#FFF3E0' }]}>
          <Text style={[styles.vehicleStatusPillText, { color: available ? C.primary : C.warning }]}>
            {available ? 'Available' : 'Rented'}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleBody}>
        <View style={styles.vehicleTopRow}>
          <Text style={styles.vehicleName}>{vehicleName}</Text>
          <View style={styles.yearPill}><Text style={styles.yearPillText}>{yearLabel}</Text></View>
        </View>

        <View style={styles.vehicleChipRow}>
          <View style={styles.vehicleInfoChip}><Text style={styles.vehicleInfoChipText}>{modelLabel}</Text></View>
          <View style={styles.vehicleInfoChip}><Text style={styles.vehicleInfoChipText}>{seatsLabel}</Text></View>
          <View style={styles.vehicleInfoChip}><Text style={styles.vehicleInfoChipText}>{fuelLabel}</Text></View>
          <View style={styles.vehicleInfoChip}><Text style={styles.vehicleInfoChipText}>{ownerLabel}</Text></View>
        </View>

        {vehicle.location ? <Text style={styles.vehicleLocation}>{vehicle.location}</Text> : null}

        <View style={styles.vehicleDivider} />

        <View style={styles.vehicleFooter}>
          <Text style={styles.vehiclePrice}>
            ₱{parseFloat(vehicle.pricePerDay).toLocaleString()}
            <Text style={styles.vehiclePricePer}>/day</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onToggleSave(vehicle.id); }}
              style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
            >
              <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextActive]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onRent(vehicle); }}
              disabled={!available}
              style={[styles.rentBtn, !available && styles.rentBtnDisabled]}
            >
              <Text style={[styles.rentBtnText, !available && { color: C.gray400 }]}>
                {available ? 'Rent Now' : 'Taken'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RentModal({ visible, vehicle, onClose, onConfirm }) {
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(null);

  useEffect(() => {
    if (visible) { setStart(''); setEnd(''); setNotes(''); }
  }, [visible]);

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = parseYMD(startDate);
    const e = parseYMD(endDate);
    if (!s || !e) return 0;
    const diff = e - s;
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [startDate, endDate]);

  const total = days * (parseFloat(vehicle?.pricePerDay) || 0);

  const handleConfirm = () => {
    if (!startDate || !endDate) { Alert.alert('Required', 'Please enter both start and end dates.'); return; }
    if (days <= 0) { Alert.alert('Invalid', 'End date must be after start date.'); return; }
    onConfirm({ startDate, endDate, days, total, notes });
  };

  if (!vehicle) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.white }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Rent Vehicle</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{
            backgroundColor: C.primaryLighter, borderRadius: 12,
            borderWidth: 1, borderColor: C.primary + '28',
            padding: 14, marginBottom: 20,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.navy }}>{vehicle.name}</Text>
            <Text style={{ fontSize: 13, color: C.gray500, marginTop: 2 }}>{vehicle.model} · {vehicle.year}</Text>
            {vehicle.ownerName && (
              <Text style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>Owner: {vehicle.ownerName}</Text>
            )}
            <Text style={{ fontSize: 14, color: C.primary, fontWeight: '700', marginTop: 6 }}>
              ₱{parseFloat(vehicle.pricePerDay).toLocaleString()}/day
            </Text>
          </View>

          <View style={{ marginBottom: 14 }}>
            <Text style={styles.fieldLabel}>Start Date</Text>
            <TouchableOpacity onPress={() => { setCalendarTarget('start'); setCalendarVisible(true); }} style={styles.dateRow}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={[styles.dateInput, { color: startDate ? C.gray900 : C.gray400 }]}>
                {startDate || 'Select start date'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 14 }}>
            <Text style={styles.fieldLabel}>End Date</Text>
            <TouchableOpacity onPress={() => { setCalendarTarget('end'); setCalendarVisible(true); }} style={styles.dateRow}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={[styles.dateInput, { color: endDate ? C.gray900 : C.gray400 }]}>
                {endDate || 'Select end date'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              multiline placeholder="Any special requests…"
              placeholderTextColor={C.gray400} value={notes} onChangeText={setNotes}
            />
          </View>

          {days > 0 && (
            <View style={{
              backgroundColor: C.gray50, borderRadius: 12,
              borderWidth: 1, borderColor: C.gray200,
              padding: 14, marginBottom: 20,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: C.gray500 }}>Duration</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.gray700 }}>{days} day{days > 1 ? 's' : ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: C.gray500 }}>Rate</Text>
                <Text style={{ fontSize: 13, color: C.gray700 }}>₱{parseFloat(vehicle.pricePerDay).toLocaleString()}/day</Text>
              </View>
              <View style={{ height: 1, backgroundColor: C.gray200, marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.navy }}>Total</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>₱{total.toLocaleString()}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity onPress={handleConfirm} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Submit Rental Request</Text>
          </TouchableOpacity>

          <CalendarPicker
            visible={calendarVisible}
            initialDate={(calendarTarget === 'start' && startDate) ? parseYMD(startDate) : (calendarTarget === 'end' && endDate) ? parseYMD(endDate) : new Date()}
            onClose={() => setCalendarVisible(false)}
            onSelect={(d) => {
              const ymd = formatYMD(d);
              if (calendarTarget === 'start') setStart(ymd);
              else if (calendarTarget === 'end') setEnd(ymd);
              setCalendarVisible(false);
            }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

function HomeTab({ vehicles, onCreateBooking, user, savedVehicleIds, onToggleSave, refreshing, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [rentModal, setRentModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selVehicle, setSelVehicle] = useState(null);

  const filtered = useMemo(() => {
    let list = vehicles;
    if (filter === 'available') list = list.filter(v => v.status === 'available');
    if (filter === 'saved') list = list.filter(v => savedVehicleIds.includes(String(v.id)));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.location?.toLowerCase().includes(q) ||
        v.ownerName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, filter, search, savedVehicleIds]);

  const openRent = (v) => {
    setSelVehicle(v);
    setRentModal(true);
  };

  const openDetail = (v) => {
    setSelVehicle(v);
    setDetailModal(true);
  };

  const handleConfirmRent = async (data) => {
    if (!selVehicle) {
      Alert.alert('Error', 'No vehicle selected. Please try again.');
      return;
    }

    const vehiclePhotoUri = selVehicle.photoUri || null;

    const newBooking = {
      id: `rent-${Date.now()}`,
      vehicleId: selVehicle.id,
      vehicleName: selVehicle.name || selVehicle.model || 'Vehicle',
      vehicleModel: selVehicle.model || selVehicle.name || '',
      vehiclePhotoUri,
      year: selVehicle.year,
      ownerId: selVehicle.ownerId,
      ownerEmail: selVehicle.ownerEmail,
      ownerName: selVehicle.ownerName || 'Owner',
      renterEmail: user?.email,
      renterName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Renter',
      pricePerDay: selVehicle.pricePerDay,
      totalPrice: data.total,
      startDate: data.startDate,
      endDate: data.endDate,
      days: data.days,
      notes: data.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await onCreateBooking(newBooking);
      setRentModal(false);
      Alert.alert('Request Sent', 'Your rental request has been submitted and is awaiting approval from the owner.');
    } catch (error) {
      Alert.alert('Booking Failed', error?.message || 'Could not save your booking. Please try again.');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 16 }}>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicles, location, owner…"
            placeholderTextColor={C.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {['all', 'available', 'saved'].map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f === 'all' ? 'All Vehicles' : f === 'available' ? 'Available Only' : `Saved (${savedVehicleIds.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No vehicles listed yet</Text>
            <Text style={styles.emptySub}>No approved vehicles available. Check back soon!</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{filter === 'saved' ? 'No saved vehicles yet' : 'No vehicles found'}</Text>
            <Text style={styles.emptySub}>{filter === 'saved' ? 'Tap Save on a car to add it here.' : 'Try adjusting your search filters.'}</Text>
          </View>
        ) : (
          filtered.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onRent={openRent}
              isSaved={savedVehicleIds.includes(String(v.id))}
              onToggleSave={onToggleSave}
              onPress={() => openDetail(v)}
            />
          ))
        )}
      </View>

      <RentModal
        visible={rentModal}
        vehicle={selVehicle}
        onClose={() => setRentModal(false)}
        onConfirm={handleConfirmRent}
      />

      <VehicleDetailModal
        visible={detailModal}
        vehicle={selVehicle}
        onClose={() => setDetailModal(false)}
        onRent={(v) => {
          setDetailModal(false);
          setTimeout(() => openRent(v), 400);
        }}
      />
    </ScrollView>
  );
}

export default function RenterDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addBooking, getBookingsForRenter, refreshBookings } = useBookings();
  const { getApprovedVehicles, refreshVehicles } = useVehicles();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [savedVehicleIds, setSavedVehicleIds] = useState([]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (typeof refreshVehicles === 'function') await refreshVehicles();
    if (typeof refreshBookings === 'function') await refreshBookings();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      handleRefresh();
    }, [])
  );

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const userName = user?.firstName || user?.fullName || 'Renter';
  const myRentals = getBookingsForRenter(user?.email);
  const approvedVehicles = getApprovedVehicles();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.email) {
        if (mounted) setSavedVehicleIds([]);
        return;
      }
      try {
        const raw = await AsyncStorage.getItem(`carRental.savedVehicles.${user.email.toLowerCase()}`);
        if (!mounted) return;
        const parsed = raw ? JSON.parse(raw) : [];
        setSavedVehicleIds(Array.isArray(parsed) ? parsed.map(String) : []);
      } catch {
        if (mounted) setSavedVehicleIds([]);
      }
    })();
    return () => { mounted = false; };
  }, [user?.email]);

  const toggleSaveVehicle = async (vehicleId) => {
    if (!user?.email) return;
    const id = String(vehicleId);
    const next = savedVehicleIds.includes(id)
      ? savedVehicleIds.filter(v => v !== id)
      : [...savedVehicleIds, id];

    setSavedVehicleIds(next);
    try {
      await AsyncStorage.setItem(`carRental.savedVehicles.${user.email.toLowerCase()}`, JSON.stringify(next));
    } catch { }
  };

  const handleTabPress = tab => {
    if (tab === 'profile')  { router.push('/profile'); return; }
    if (tab === 'feedback') { router.push('/feedback'); return; }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            vehicles={approvedVehicles}
            onCreateBooking={addBooking}
            user={user}
            savedVehicleIds={savedVehicleIds}
            onToggleSave={toggleSaveVehicle}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        );
      case 'bookings':
        return <BookingsScreen hideHeader={true} />;
      case 'logreport':
        return <LogReportScreen hideHeader={true} />;
      default:
        return null;
    }
  };

  const pendingCount = myRentals.filter((booking) => booking.status === 'pending').length;
  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerKicker}>RENTER PORTAL</Text>
          <Text style={styles.headerTitle}>Renter Dashboard</Text>
          <Text style={styles.headerSub}>Welcome back, {userName}</Text>
        </View>
        <View style={styles.avatarWrap}><ProfileAvatar size={40} /></View>
      </View>
      <View style={styles.bodyWrap}>
        <View style={styles.contentShell}>{renderContent()}</View>
      </View>
      <BottomNav
        role="renter"
        activeTab={activeTab}
        onTabPress={handleTabPress}
        badges={{ bookings: pendingCount }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Platform.OS === 'ios' ? 8 : 4,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#eef2f7',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerKicker: { fontSize: 10, fontWeight: '700', color: C.gray400, letterSpacing: 1.2 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: C.navy, marginTop: 1 },
  headerSub:    { fontSize: 13, color: C.gray500, marginTop: 2 },
  avatarWrap: {
    backgroundColor: '#f0f7f5',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#d7ece6',
  },
  bodyWrap: { flex: 1, backgroundColor: '#f5f7fa' },
  contentShell: { flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.gray900 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.gray200 },
  filterTabActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterTabText: { fontSize: 13, color: C.gray500 },
  filterTabTextActive: { color: C.white, fontWeight: '700' },
  vehicleCard: { backgroundColor: C.white, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#eef2f7', shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, overflow: 'hidden' },
  vehicleImageWrap: { position: 'relative', backgroundColor: '#f3f6fb' },
  vehicleImage: { width: '100%', height: 190, backgroundColor: '#f3f6fb' },
  vehicleStatusPill: { position: 'absolute', top: 12, left: 12, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  vehicleStatusPillText: { fontSize: 12, fontWeight: '800' },
  vehicleBody: { padding: 14 },
  vehicleTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  yearPill: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  yearPillText: { fontSize: 12, color: C.gray500, fontWeight: '700' },
  vehicleChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  vehicleInfoChip: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  vehicleInfoChipText: { fontSize: 11, color: C.gray700, fontWeight: '600' },
  vehicleLocation: { fontSize: 13, color: C.gray500, marginTop: 12 },
  vehicleDivider: { height: 1, backgroundColor: '#e5e7eb', marginTop: 14, marginBottom: 12 },
  vehicleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  vehicleThumbFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.gray200 },
  vehicleThumbFallbackText: { fontSize: 20, color: C.gray400, fontWeight: '600' },
  vehicleName: { fontSize: 22, fontWeight: '800', color: C.navy, flex: 1 },
  vehiclePrice: { fontSize: 20, color: C.primary, fontWeight: '800' },
  vehiclePricePer: { fontSize: 12, color: C.primaryLight, fontWeight: '700' },
  saveBtn: { backgroundColor: C.white, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.gray200 },
  saveBtnActive: { backgroundColor: C.primaryLighter, borderColor: C.primary },
  saveBtnText: { color: C.gray600, fontSize: 13, fontWeight: '700' },
  saveBtnTextActive: { color: C.primaryLight },
  rentBtn: { backgroundColor: C.primary, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  rentBtnDisabled: { backgroundColor: C.gray100 },
  rentBtnText: { color: C.white, fontSize: 13, fontWeight: '800' },
  empty: { alignItems: 'center', padding: 48, backgroundColor: C.gray50, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.gray200 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.gray700, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.gray400, textAlign: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.gray200 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.navy },
  modalClose: { fontSize: 22, color: C.gray400 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: C.gray400, marginBottom: 6 },
  input: { padding: 12, borderWidth: 1.5, borderColor: C.gray200, borderRadius: 10, fontSize: 14, color: C.gray900, backgroundColor: C.white },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 10 },
  dateIcon: { fontSize: 18, marginRight: 8 },
  dateInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.gray900, paddingLeft: 0 },
  btnPrimary: { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  btnPrimaryText: { color: C.white, fontSize: 14, fontWeight: '700' },
});