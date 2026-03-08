import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import ProfileAvatar from '../components/ProfileAvatar';

const C = {
  primary:   '#3F9B84',
  primaryDk: '#2d7a67',
  primaryLt: '#ecfdf5',
  navy:      '#1a2c5e',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  success:   '#22c55e',
  indigo:    '#6366f1',
  g50:   '#f9fafb',
  g100:  '#f3f4f6',
  g200:  '#e5e7eb',
  g300:  '#d1d5db',
  g400:  '#9ca3af',
  g500:  '#6b7280',
  g700:  '#374151',
  g900:  '#111827',
  white: '#ffffff',
};

const VEHICLE_TYPES  = ['SUV','Sedan','Sports','Hatchback','Van'];
const TRANSMISSIONS  = ['Automatic','Manual','CVT'];
const FUEL_TYPES     = ['Gasoline','Diesel','Hybrid','Electric'];

const SAMPLE_VEHICLES = [
  { id: 'v1', brand: 'Toyota',     name: 'Vios',       year: 2022, type: 'Sedan', transmission: 'Automatic', fuel: 'Gasoline', seats: 5, pricePerDay: 1500, location: 'Manila',     available: true,  description: 'Clean and reliable sedan for city drives.', owner: 'Juan Owner' },
  { id: 'v2', brand: 'Ford',       name: 'EcoSport',   year: 2023, type: 'SUV',   transmission: 'Automatic', fuel: 'Gasoline', seats: 5, pricePerDay: 2800, location: 'Cebu City',  available: true,  description: 'Compact SUV great for road trips.',          owner: 'Ana Owner'  },
  { id: 'v3', brand: 'Mitsubishi', name: 'Mirage',     year: 2021, type: 'Hatchback', transmission: 'CVT',  fuel: 'Gasoline', seats: 5, pricePerDay: 1200, location: 'Davao City', available: true,  description: 'Fuel-efficient hatchback.',                  owner: 'Mark Owner' },
  { id: 'v4', brand: 'Mazda',      name: 'CX-5',       year: 2023, type: 'SUV',   transmission: 'Automatic', fuel: 'Gasoline', seats: 5, pricePerDay: 3500, location: 'Makati',     available: true,  description: 'Stylish SUV with premium features.',         owner: 'Lisa Owner' },
  { id: 'v5', brand: 'Honda',      name: 'Jazz',       year: 2020, type: 'Hatchback', transmission: 'CVT',  fuel: 'Gasoline', seats: 5, pricePerDay: 1400, location: 'Pasig',      available: true,  description: 'Compact and versatile.',                     owner: 'Carlo Owner'},
  { id: 'v6', brand: 'Kia',        name: 'Stinger',    year: 2022, type: 'Sports', transmission: 'Automatic', fuel: 'Gasoline', seats: 4, pricePerDay: 4500, location: 'Taguig',    available: true,  description: 'High-performance sports sedan.',             owner: 'Rica Owner' },
];

const INITIAL_RENTALS = [
  { id: 'r1', vehicleId: 'v1', vehicleName: 'Toyota Vios',  ownerName: 'Juan Owner', amount: 1500, status: 'active',  startDate: '2026-03-01', endDate: '2026-03-10' },
  { id: 'r2', vehicleId: 'v2', vehicleName: 'Ford EcoSport', ownerName: 'Ana Owner', amount: 2800, status: 'pending', startDate: '2026-03-15', endDate: '2026-03-20' },
];

function StatusBadge({ status }) {
  const map = {
    pending:          { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
    active:           { bg: '#d1fae5', color: '#059669', border: '#6ee7b7' },
    returned:         { bg: '#e5e7eb', color: '#6b7280', border: '#d1d5db' },
    rejected:         { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
    return_requested: { bg: '#dbeafe', color: '#2563eb', border: '#93c5fd' },
  };
  const t = map[status] || map['pending'];
  return (
    <View style={{ backgroundColor: t.bg, borderWidth: 1, borderColor: t.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.color, textTransform: 'capitalize' }}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

function VehicleCard({ vehicle, isSaved, onSave, onView, onRent }) {
  return (
    <View style={s.card}>
      <View style={s.cardImg}>
        <Text style={s.cardImgIcon}>🚗</Text>
        <TouchableOpacity style={s.saveBtn} onPress={onSave}>
          <Text style={{ fontSize: 18 }}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>
      <View style={s.cardBody}>
        <View style={s.cardRow}>
          <Text style={s.cardTitle}>{vehicle.brand} {vehicle.name}</Text>
          <Text style={s.cardYear}>{vehicle.year}</Text>
        </View>
        <Text style={s.cardMeta}>{vehicle.type} · {vehicle.transmission} · {vehicle.seats} seats</Text>
        <Text style={s.cardMeta}>📍 {vehicle.location}</Text>
        <View style={s.cardRow} >
          <Text style={s.cardPrice}>₱{Number(vehicle.pricePerDay).toLocaleString()}<Text style={s.cardPriceSub}>/day</Text></Text>
          {vehicle.fuel && (
            <View style={s.fuelTag}>
              <Text style={s.fuelTagText}>{vehicle.fuel}</Text>
            </View>
          )}
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity style={s.btnOutline} onPress={onView}>
            <Text style={s.btnOutlineText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnPrimary} onPress={onRent}>
            <Text style={s.btnPrimaryText}>Rent Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function RenterDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userName = user?.firstName || user?.fullName || 'Renter';

  const [searchQuery, setSearchQuery]   = useState('');
  const [savedCars,   setSavedCars]     = useState([]);
  const [rentals,     setRentals]       = useState(INITIAL_RENTALS);
  const [filters,     setFilters]       = useState({ types: [], transmissions: [], fuels: [], minPrice: '', maxPrice: '' });

  const [showFilter,  setShowFilter]    = useState(false);
  const [showDetail,  setShowDetail]    = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const [selected,    setSelected]      = useState(null);

  const availableVehicles = SAMPLE_VEHICLES.filter(v => v.available);

  const filtered = useMemo(() => {
    let r = availableVehicles;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter(v =>
        v.name.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) || v.location.toLowerCase().includes(q)
      );
    }
    if (filters.types.length)         r = r.filter(v => filters.types.includes(v.type));
    if (filters.transmissions.length) r = r.filter(v => filters.transmissions.includes(v.transmission));
    if (filters.fuels.length)         r = r.filter(v => filters.fuels.includes(v.fuel));
    if (filters.minPrice)             r = r.filter(v => Number(v.pricePerDay) >= Number(filters.minPrice));
    if (filters.maxPrice)             r = r.filter(v => Number(v.pricePerDay) <= Number(filters.maxPrice));
    return r;
  }, [availableVehicles, searchQuery, filters]);

  const activeFiltersCount = filters.types.length + filters.transmissions.length + filters.fuels.length + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);

  const stats = {
    total:     SAMPLE_VEHICLES.length,
    available: availableVehicles.length,
    avgPrice:  Math.round(availableVehicles.reduce((s, v) => s + v.pricePerDay, 0) / availableVehicles.length),
    saved:     savedCars.length,
  };

  const toggleSave = (id) => setSavedCars(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleFilter = (cat, val) => setFilters(p => ({
    ...p, [cat]: p[cat].includes(val) ? p[cat].filter(v => v !== val) : [...p[cat], val],
  }));
  const clearFilters = () => setFilters({ types: [], transmissions: [], fuels: [], minPrice: '', maxPrice: '' });

  const handleRent = (vehicle) => {
    Alert.alert(
      'Request to Rent',
      `Rent ${vehicle.brand} ${vehicle.name} for ₱${vehicle.pricePerDay}/day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Rent', onPress: () => {
          const newRental = {
            id: String(Date.now()),
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.brand} ${vehicle.name}`,
            ownerName: vehicle.owner,
            amount: vehicle.pricePerDay,
            status: 'pending',
            startDate: new Date().toISOString().split('T')[0],
            endDate: null,
          };
          setRentals(p => [...p, newRental]);
          setShowDetail(false);
          Alert.alert('Success', 'Rental request sent! The owner will review your request.');
        }},
      ]
    );
  };

  const handleRequestReturn = (id) => {
    Alert.alert('Request Return', 'Request to return this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Request', onPress: () => {
        setRentals(p => p.map(r => r.id === id ? { ...r, status: 'return_requested' } : r));
        Alert.alert('Sent', 'Return request sent to the owner.');
      }},
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#edf1f7' }}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Hello, {userName} 👋</Text>
          <Text style={s.headerSub}>Find your perfect ride</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerBtn} onPress={() => setShowHistory(true)}>
            <Text style={s.headerBtnText}>📋 My Rentals</Text>
          </TouchableOpacity>
          <ProfileAvatar size={38} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>

        {/* ── STATS ── */}
        <View style={s.statsRow}>
          {[
            { label: 'Total Cars',  value: stats.total,                         color: C.primary },
            { label: 'Available',   value: stats.available,                      color: C.success },
            { label: 'Avg/Day',     value: `₱${stats.avgPrice.toLocaleString()}`, color: C.navy   },
            { label: 'Saved',       value: stats.saved,                          color: C.indigo  },
          ].map(st => (
            <View key={st.label} style={s.statCard}>
              <Text style={[s.statNum, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── SEARCH + FILTER ── */}
        <View style={s.searchRow}>
          <View style={s.searchWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search cars, brand, location…"
              placeholderTextColor={C.g400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={[s.filterBtn, activeFiltersCount > 0 && s.filterBtnActive]} onPress={() => setShowFilter(true)}>
            <Text style={[s.filterBtnText, activeFiltersCount > 0 && s.filterBtnTextActive]}>
              ⚙ {activeFiltersCount > 0 ? `${activeFiltersCount}` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── VEHICLE GRID ── */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No vehicles found</Text>
              <Text style={s.emptySub}>Try adjusting your search or filters.</Text>
            </View>
          ) : (
            filtered.map(v => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                isSaved={savedCars.includes(v.id)}
                onSave={() => toggleSave(v.id)}
                onView={() => { setSelected(v); setShowDetail(true); }}
                onRent={() => handleRent(v)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── FILTER MODAL ── */}
      <Modal visible={showFilter} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilter(false)}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>

            <Text style={s.filterGroupLabel}>Vehicle Type</Text>
            <View style={s.chipRow}>
              {VEHICLE_TYPES.map(t => (
                <TouchableOpacity key={t} style={[s.chip, filters.types.includes(t) && s.chipActive]} onPress={() => toggleFilter('types', t)}>
                  <Text style={[s.chipText, filters.types.includes(t) && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.filterGroupLabel}>Transmission</Text>
            <View style={s.chipRow}>
              {TRANSMISSIONS.map(t => (
                <TouchableOpacity key={t} style={[s.chip, filters.transmissions.includes(t) && s.chipActive]} onPress={() => toggleFilter('transmissions', t)}>
                  <Text style={[s.chipText, filters.transmissions.includes(t) && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.filterGroupLabel}>Fuel Type</Text>
            <View style={s.chipRow}>
              {FUEL_TYPES.map(f => (
                <TouchableOpacity key={f} style={[s.chip, filters.fuels.includes(f) && s.chipActive]} onPress={() => toggleFilter('fuels', f)}>
                  <Text style={[s.chipText, filters.fuels.includes(f) && s.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.filterGroupLabel}>Price Range (₱/day)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TextInput
                style={[s.input, { flex: 1 }]} placeholder="Min" placeholderTextColor={C.g400}
                keyboardType="numeric" value={filters.minPrice}
                onChangeText={v => setFilters(p => ({ ...p, minPrice: v }))}
              />
              <Text style={{ color: C.g400 }}>to</Text>
              <TextInput
                style={[s.input, { flex: 1 }]} placeholder="Max" placeholderTextColor={C.g400}
                keyboardType="numeric" value={filters.maxPrice}
                onChangeText={v => setFilters(p => ({ ...p, maxPrice: v }))}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: C.g100 }]} onPress={clearFilters}>
                <Text style={[s.btnText, { color: C.g700 }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => setShowFilter(false)}>
                <Text style={s.btnText}>Apply</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ── VEHICLE DETAIL MODAL ── */}
      <Modal visible={showDetail} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{selected ? `${selected.brand} ${selected.name}` : 'Details'}</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {selected && (
            <ScrollView style={{ flex: 1, padding: 20 }}>
              {/* Image placeholder */}
              <View style={s.detailImg}>
                <Text style={{ fontSize: 64 }}>🚗</Text>
              </View>

              {/* Price */}
              <View style={s.detailPriceBox}>
                <Text style={s.detailPrice}>₱{Number(selected.pricePerDay).toLocaleString()}</Text>
                <Text style={s.detailPriceSub}>/day</Text>
              </View>

              {/* Specs chips */}
              <View style={s.chipRow}>
                {[selected.type, selected.transmission, `${selected.seats} seats`, selected.fuel, String(selected.year)].filter(Boolean).map((sp, i) => (
                  <View key={i} style={s.specChip}>
                    <Text style={s.specChipText}>{sp}</Text>
                  </View>
                ))}
              </View>

              {/* Location & Owner */}
              <View style={s.infoBox}>
                <Text style={s.infoText}>📍 {selected.location}</Text>
              </View>
              <View style={[s.infoBox, { marginTop: 8 }]}>
                <Text style={s.infoText}>👤 Owner: {selected.owner}</Text>
              </View>

              {/* Description */}
              {selected.description ? (
                <Text style={s.detailDesc}>{selected.description}</Text>
              ) : null}

              {/* Rent button */}
              <TouchableOpacity style={[s.btn, { marginTop: 24 }]} onPress={() => handleRent(selected)}>
                <Text style={s.btnText}>Request to Rent</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ── MY RENTALS MODAL ── */}
      <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>My Rentals</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            {rentals.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptySub}>You have no rentals yet.</Text>
              </View>
            ) : (
              rentals.slice().reverse().map(r => (
                <View key={r.id} style={s.rentalItem}>
                  <View style={s.rentalHeader}>
                    <Text style={s.rentalVehicle}>{r.vehicleName}</Text>
                    <StatusBadge status={r.status} />
                  </View>
                  <Text style={s.rentalMeta}>Owner: {r.ownerName} · ₱{r.amount}/day</Text>
                  <Text style={s.rentalDates}>
                    {new Date(r.startDate).toLocaleDateString()} →{' '}
                    {r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Ongoing'}
                  </Text>
                  {r.status === 'active' && (
                    <TouchableOpacity style={[s.btnOutline, { marginTop: 10 }]} onPress={() => handleRequestReturn(r.id)}>
                      <Text style={s.btnOutlineText}>Request Return</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  /* header */
  header: {
    backgroundColor: C.white,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.g200,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  greeting:      { fontSize: 20, fontWeight: '800', color: C.navy },
  headerSub:     { fontSize: 12, color: C.g400, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: {
    borderWidth: 1.5, borderColor: C.g200, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.white,
  },
  headerBtnText: { fontSize: 12, fontWeight: '600', color: C.g700 },
  logoutBtn: { fontSize: 12, color: C.danger, fontWeight: '600', marginLeft: 4 },

  /* stats */
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2,
  },
  statNum:   { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  statLabel: { fontSize: 10, color: C.g500, marginTop: 3, textAlign: 'center' },

  /* search */
  searchRow:  { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 14, alignItems: 'center', gap: 10 },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: C.g200,
    paddingHorizontal: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.navy },
  filterBtn: {
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.g200,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  filterBtnActive:    { borderColor: C.primary, backgroundColor: C.primaryLt },
  filterBtnText:      { fontSize: 14, color: C.g700, fontWeight: '600' },
  filterBtnTextActive:{ color: C.primary, fontWeight: '700' },

  /* vehicle card */
  card: {
    backgroundColor: C.white, borderRadius: 16, marginBottom: 14,
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 10, elevation: 3,
  },
  cardImg: {
    backgroundColor: C.g100, height: 150,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  cardImgIcon: { fontSize: 56 },
  saveBtn:     { position: 'absolute', top: 12, right: 12 },
  cardBody:    { padding: 16 },
  cardRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle:   { fontSize: 16, fontWeight: '800', color: C.navy, flex: 1, marginRight: 8 },
  cardYear:    { fontSize: 12, color: C.g400, fontWeight: '600' },
  cardMeta:    { fontSize: 12, color: C.g500, marginBottom: 3 },
  cardPrice:   { fontSize: 18, fontWeight: '800', color: C.primary, marginTop: 8 },
  cardPriceSub:{ fontSize: 13, fontWeight: '500', color: C.g400 },
  fuelTag: {
    backgroundColor: `${C.primary}18`, borderWidth: 1,
    borderColor: `${C.primary}30`, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  fuelTagText: { fontSize: 11, color: C.primary, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 14 },

  btnOutline: {
    flex: 1, borderWidth: 1.5, borderColor: C.primary, borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  btnOutlineText: { color: C.primary, fontWeight: '700', fontSize: 13 },
  btnPrimary: {
    flex: 1, backgroundColor: C.primary, borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  btnPrimaryText: { color: C.white, fontWeight: '700', fontSize: 13 },

  /* empty state */
  empty: {
    alignItems: 'center', padding: 48, backgroundColor: C.white,
    borderRadius: 16, borderWidth: 1.5, borderColor: C.g200, borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.g700, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.g400, textAlign: 'center' },

  /* modal */
  modalContainer: { flex: 1, backgroundColor: C.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.g200,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.navy },
  modalClose: { fontSize: 20, color: C.g500, fontWeight: '700' },

  /* filter */
  filterGroupLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, color: C.g400, marginBottom: 10, marginTop: 4,
  },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5,
    borderColor: C.g200, borderRadius: 999, backgroundColor: C.white,
  },
  chipActive:    { borderColor: C.primary, backgroundColor: C.primaryLt },
  chipText:      { fontSize: 13, color: C.g500, fontWeight: '500' },
  chipTextActive:{ color: C.primary, fontWeight: '700' },

  input: {
    backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g200,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.navy, marginBottom: 14,
  },

  btn: {
    backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700' },

  /* vehicle detail */
  detailImg: {
    backgroundColor: C.g100, borderRadius: 16, height: 200,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  detailPriceBox: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    backgroundColor: C.primaryLt, borderWidth: 1, borderColor: `${C.primary}30`,
    borderRadius: 12, padding: 16, marginBottom: 16,
  },
  detailPrice:    { fontSize: 28, fontWeight: '800', color: C.primaryDk },
  detailPriceSub: { fontSize: 14, color: C.primary, fontWeight: '500' },
  specChip: {
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.g50,
    borderWidth: 1, borderColor: C.g200, borderRadius: 999,
  },
  specChipText: { fontSize: 13, fontWeight: '500', color: C.g700 },
  infoBox: {
    backgroundColor: C.g50, borderWidth: 1, borderColor: C.g200,
    borderRadius: 8, padding: 12,
  },
  infoText:   { fontSize: 14, color: C.g500 },
  detailDesc: { fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 14 },

  /* rentals */
  rentalItem: {
    backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g200,
    borderRadius: 12, padding: 16, marginBottom: 12,
  },
  rentalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rentalVehicle: { fontSize: 15, fontWeight: '700', color: C.navy, flex: 1, marginRight: 8 },
  rentalMeta:    { fontSize: 13, color: C.g500, marginBottom: 3 },
  rentalDates:   { fontSize: 12, color: C.g400 },
});