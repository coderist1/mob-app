import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Modal, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

const C = {
  primary:   '#3F9B84',
  primaryDk: '#2d7a67',
  primaryLt: '#ecfdf5',
  navy:      '#1a2c5e',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  success:   '#22c55e',
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

const VEHICLE_TYPES  = ['Sedan','SUV','Hatchback','Pickup','Van','MPV','Crossover'];
const TRANSMISSIONS  = ['Automatic','Manual','CVT'];
const FUEL_TYPES     = ['Gasoline','Diesel','Hybrid','Electric'];
const LOCATIONS      = ['Manila','Quezon City','Cebu City','Davao City','Makati','Taguig','Pasig'];

const INITIAL_VEHICLES = [
  { id: '1', brand: 'Toyota', name: 'Vios',     year: 2022, type: 'Sedan', transmission: 'Automatic', fuel: 'Gasoline', seats: 5, pricePerDay: 1500, location: 'Manila',      status: 'available', available: true,  description: 'Reliable sedan for city trips.' },
  { id: '2', brand: 'Honda',  name: 'Civic',    year: 2021, type: 'Sedan', transmission: 'CVT',       fuel: 'Gasoline', seats: 5, pricePerDay: 2000, location: 'Makati',      status: 'rented',    available: false, description: 'Sporty and fuel efficient.' },
  { id: '3', brand: 'Ford',   name: 'Ranger',   year: 2023, type: 'Pickup', transmission: 'Automatic', fuel: 'Diesel',  seats: 5, pricePerDay: 3500, location: 'Davao City',  status: 'available', available: true,  description: 'Tough pickup for any terrain.' },
];

const INITIAL_RENTALS = [
  { id: 'r1', vehicleId: '2', vehicleName: 'Honda Civic', renterName: 'Juan Dela Cruz', amount: 2000, status: 'active',   startDate: '2026-03-01', endDate: '2026-03-08' },
  { id: 'r2', vehicleId: '1', vehicleName: 'Toyota Vios', renterName: 'Maria Santos',  amount: 1500, status: 'pending',  startDate: '2026-03-10', endDate: '2026-03-15' },
];

function StatusBadge({ status }) {
  const map = {
    available: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', label: 'Available' },
    rented:    { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: 'Rented'    },
    maintenance: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', label: 'Maintenance' },
    pending:   { bg: '#fef3c7', color: '#d97706', border: '#fde68a', label: 'Pending'   },
    active:    { bg: '#d1fae5', color: '#059669', border: '#6ee7b7', label: 'Active'    },
    returned:  { bg: '#e5e7eb', color: '#6b7280', border: '#d1d5db', label: 'Returned'  },
    rejected:  { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', label: 'Rejected'  },
  };
  const t = map[status] || map['available'];
  return (
    <View style={{ backgroundColor: t.bg, borderWidth: 1, borderColor: t.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.color }}>{t.label}</Text>
    </View>
  );
}

function VehicleCard({ vehicle, onEdit, onDelete }) {
  return (
    <View style={s.card}>
      <View style={s.cardImgPlaceholder}>
        <Text style={s.cardImgIcon}>🚗</Text>
      </View>
      <View style={s.cardBody}>
        <View style={s.cardRow}>
          <Text style={s.cardTitle}>{vehicle.brand} {vehicle.name}</Text>
          <StatusBadge status={vehicle.status} />
        </View>
        <Text style={s.cardMeta}>{vehicle.year} · {vehicle.type} · {vehicle.transmission}</Text>
        <Text style={s.cardMeta}>📍 {vehicle.location}</Text>
        <Text style={s.cardPrice}>₱{Number(vehicle.pricePerDay).toLocaleString()}<Text style={s.cardPriceSub}>/day</Text></Text>
        <View style={s.cardActions}>
          <TouchableOpacity style={s.btnOutline} onPress={() => onEdit(vehicle)}>
            <Text style={s.btnOutlineText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnDanger} onPress={() => onDelete(vehicle.id)}>
            <Text style={s.btnDangerText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const [vehicles,    setVehicles]    = useState(INITIAL_VEHICLES);
  const [rentals,     setRentals]     = useState(INITIAL_RENTALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [formData, setFormData] = useState({
    brand: '', name: '', year: String(new Date().getFullYear()),
    type: 'Sedan', transmission: 'Automatic', fuel: 'Gasoline',
    seats: '5', pricePerDay: '', location: 'Manila', status: 'available', description: '',
  });

  const setF = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const userName = 'Owner';

  const stats = {
    total:     vehicles.length,
    available: vehicles.filter(v => v.available).length,
    rented:    vehicles.filter(v => !v.available).length,
    earnings:  vehicles.filter(v => !v.available).reduce((s, v) => s + Number(v.pricePerDay || 0), 0),
  };

  const filtered = vehicles.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q) ||
           v.type.toLowerCase().includes(q)  || v.location.toLowerCase().includes(q);
  });

  const resetForm = () => setFormData({
    brand: '', name: '', year: String(new Date().getFullYear()),
    type: 'Sedan', transmission: 'Automatic', fuel: 'Gasoline',
    seats: '5', pricePerDay: '', location: 'Manila', status: 'available', description: '',
  });

  const handleAdd = () => {
    if (!formData.brand || !formData.name || !formData.pricePerDay) {
      Alert.alert('Missing Fields', 'Brand, Model and Price are required.'); return;
    }
    const newV = {
      ...formData,
      id: String(Date.now()),
      year: Number(formData.year),
      seats: Number(formData.seats),
      pricePerDay: Number(formData.pricePerDay),
      available: formData.status === 'available',
    };
    Alert.alert('Add Vehicle', `List "${formData.brand} ${formData.name}" for rent?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Add', onPress: () => { setVehicles(p => [...p, newV]); resetForm(); setShowAddModal(false); } },
    ]);
  };

  const handleEdit = () => {
    if (!editTarget) return;
    const updated = {
      ...editTarget, ...formData,
      year: Number(formData.year),
      seats: Number(formData.seats),
      pricePerDay: Number(formData.pricePerDay),
      available: formData.status === 'available',
    };
    Alert.alert('Save Changes', `Save changes to "${formData.brand} ${formData.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Save', onPress: () => {
        setVehicles(p => p.map(v => v.id === editTarget.id ? updated : v));
        setShowEditModal(false); setEditTarget(null); resetForm();
      }},
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Vehicle', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setVehicles(p => p.filter(v => v.id !== id)) },
    ]);
  };

  const openEdit = (v) => {
    setEditTarget(v);
    setFormData({
      brand: v.brand, name: v.name, year: String(v.year),
      type: v.type, transmission: v.transmission, fuel: v.fuel,
      seats: String(v.seats), pricePerDay: String(v.pricePerDay),
      location: v.location, status: v.status, description: v.description || '',
    });
    setShowEditModal(true);
  };

  const handleApprove = (id) => {
    setRentals(p => p.map(r => r.id === id ? { ...r, status: 'active' } : r));
    const r = rentals.find(r2 => r2.id === id);
    if (r) setVehicles(p => p.map(v => v.id === r.vehicleId ? { ...v, available: false, status: 'rented' } : v));
  };

  const handleReject = (id) => {
    setRentals(p => p.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  // ── Reusable form (shared Add/Edit) ──
  const renderVehicleForm = (onSubmit, isEdit) => (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      <Text style={s.modalSectionHead}>Basic Info</Text>
      <View style={s.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={s.label}>Brand *</Text>
          <TextInput style={s.input} placeholder="Toyota" placeholderTextColor={C.g400} value={formData.brand} onChangeText={v => setF('brand', v)} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={s.label}>Model *</Text>
          <TextInput style={s.input} placeholder="Vios" placeholderTextColor={C.g400} value={formData.name} onChangeText={v => setF('name', v)} />
        </View>
      </View>

      <View style={s.row2}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={s.label}>Year</Text>
          <TextInput style={s.input} keyboardType="numeric" value={formData.year} onChangeText={v => setF('year', v)} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={s.label}>Seats</Text>
          <TextInput style={s.input} keyboardType="numeric" value={formData.seats} onChangeText={v => setF('seats', v)} />
        </View>
      </View>

      <Text style={s.modalSectionHead}>Specifications</Text>
      <Text style={s.label}>Vehicle Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {VEHICLE_TYPES.map(t => (
          <TouchableOpacity key={t} style={[s.chip, formData.type === t && s.chipActive]} onPress={() => setF('type', t)}>
            <Text style={[s.chipText, formData.type === t && s.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>Transmission</Text>
      <View style={s.chipRow}>
        {TRANSMISSIONS.map(t => (
          <TouchableOpacity key={t} style={[s.chip, formData.transmission === t && s.chipActive]} onPress={() => setF('transmission', t)}>
            <Text style={[s.chipText, formData.transmission === t && s.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Fuel Type</Text>
      <View style={s.chipRow}>
        {FUEL_TYPES.map(f => (
          <TouchableOpacity key={f} style={[s.chip, formData.fuel === f && s.chipActive]} onPress={() => setF('fuel', f)}>
            <Text style={[s.chipText, formData.fuel === f && s.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.modalSectionHead}>Pricing & Location</Text>
      <Text style={s.label}>Price per Day (₱) *</Text>
      <TextInput style={[s.input, { marginBottom: 14 }]} placeholder="e.g. 2500" placeholderTextColor={C.g400}
        keyboardType="numeric" value={formData.pricePerDay} onChangeText={v => setF('pricePerDay', v)} />

      <Text style={s.label}>Location</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {LOCATIONS.map(l => (
          <TouchableOpacity key={l} style={[s.chip, formData.location === l && s.chipActive]} onPress={() => setF('location', l)}>
            <Text style={[s.chipText, formData.location === l && s.chipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>Status</Text>
      <View style={s.chipRow}>
        {['available', 'rented', 'maintenance'].map(st => (
          <TouchableOpacity key={st} style={[s.chip, formData.status === st && s.chipActive]} onPress={() => setF('status', st)}>
            <Text style={[s.chipText, formData.status === st && s.chipTextActive, { textTransform: 'capitalize' }]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Description</Text>
      <TextInput style={[s.input, { height: 80, textAlignVertical: 'top', marginBottom: 24 }]}
        placeholder="Briefly describe the vehicle…" placeholderTextColor={C.g400} multiline
        value={formData.description} onChangeText={v => setF('description', v)} />

      <TouchableOpacity style={s.btn} onPress={onSubmit} activeOpacity={0.85}>
        <Text style={s.btnText}>{isEdit ? 'Save Changes' : 'Add Vehicle'}</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#edf1f7' }}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Owner Dashboard</Text>
          <Text style={s.headerSub}>Manage your fleet</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerBtn} onPress={() => setShowHistory(true)}>
            <Text style={s.headerBtnText}>📋 Rentals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtnPrimary} onPress={() => { resetForm(); setShowAddModal(true); }}>
            <Text style={s.headerBtnPrimaryText}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={s.logoutBtn}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>

        {/* ── STATS ── */}
        <View style={s.statsRow}>
          {[
            { label: 'Total',     value: stats.total,                                  color: C.primary },
            { label: 'Available', value: stats.available,                               color: C.success },
            { label: 'Rented',    value: stats.rented,                                  color: C.danger  },
            { label: 'Est./Day',  value: `₱${stats.earnings.toLocaleString()}`,         color: C.navy    },
          ].map(st => (
            <View key={st.label} style={s.statCard}>
              <Text style={[s.statNum, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── SEARCH ── */}
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput style={s.searchInput} placeholder="Search your vehicles…" placeholderTextColor={C.g400}
            value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* ── VEHICLE LIST ── */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No vehicles found</Text>
              <Text style={s.emptySub}>Tap "+ Add" to list your first car for rent.</Text>
            </View>
          ) : (
            filtered.map(v => (
              <VehicleCard key={v.id} vehicle={v} onEdit={openEdit} onDelete={handleDelete} />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── ADD MODAL ── */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add New Vehicle</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, padding: 20 }}>
            {renderVehicleForm(handleAdd, false)}
          </View>
        </View>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Edit Vehicle</Text>
            <TouchableOpacity onPress={() => { setShowEditModal(false); setEditTarget(null); resetForm(); }}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, padding: 20 }}>
            {renderVehicleForm(handleEdit, true)}
          </View>
        </View>
      </Modal>

      {/* ── RENTAL HISTORY MODAL ── */}
      <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Rental History</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            {rentals.length === 0 ? (
              <Text style={s.emptySub}>No rental history yet.</Text>
            ) : (
              rentals.slice().reverse().map(r => (
                <View key={r.id} style={s.rentalItem}>
                  <View style={s.rentalHeader}>
                    <Text style={s.rentalVehicle}>{r.vehicleName}</Text>
                    <StatusBadge status={r.status} />
                  </View>
                  <Text style={s.rentalMeta}>Renter: {r.renterName} · ₱{r.amount}/day</Text>
                  <Text style={s.rentalDates}>
                    {new Date(r.startDate).toLocaleDateString()} → {r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Ongoing'}
                  </Text>
                  {r.status === 'pending' && (
                    <View style={s.rentalActions}>
                      <TouchableOpacity style={s.btnApprove} onPress={() => handleApprove(r.id)}>
                        <Text style={s.btnApproveText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.btnDanger} onPress={() => handleReject(r.id)}>
                        <Text style={s.btnDangerText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
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
  headerTitle:   { fontSize: 20, fontWeight: '800', color: C.navy },
  headerSub:     { fontSize: 12, color: C.g400, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: {
    borderWidth: 1.5, borderColor: C.g200, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: C.white,
  },
  headerBtnText:    { fontSize: 12, fontWeight: '600', color: C.g700 },
  headerBtnPrimary: { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  headerBtnPrimaryText: { fontSize: 13, fontWeight: '700', color: C.white },
  logoutBtn: { fontSize: 12, color: C.danger, fontWeight: '600', marginLeft: 4 },

  /* stats */
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statNum:   { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  statLabel: { fontSize: 10, color: C.g500, marginTop: 3, textAlign: 'center' },

  /* search */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.g200,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: C.navy },

  /* vehicle card */
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImgPlaceholder: {
    backgroundColor: C.g100,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgIcon: { fontSize: 52 },
  cardBody:    { padding: 16 },
  cardRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle:   { fontSize: 16, fontWeight: '800', color: C.navy, flex: 1, marginRight: 8 },
  cardMeta:    { fontSize: 12, color: C.g500, marginBottom: 3 },
  cardPrice:   { fontSize: 18, fontWeight: '800', color: C.primary, marginTop: 8, marginBottom: 12 },
  cardPriceSub:{ fontSize: 13, fontWeight: '500', color: C.g400 },
  cardActions: { flexDirection: 'row', gap: 10 },
  btnOutline: {
    flex: 1, borderWidth: 1.5, borderColor: C.primary, borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  btnOutlineText: { color: C.primary, fontWeight: '700', fontSize: 13 },
  btnDanger: {
    flex: 1, backgroundColor: '#fef2f2', borderWidth: 1.5,
    borderColor: '#fca5a5', borderRadius: 8, paddingVertical: 9, alignItems: 'center',
  },
  btnDangerText: { color: C.danger, fontWeight: '700', fontSize: 13 },
  btnApprove: {
    flex: 1, backgroundColor: C.primary, borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  btnApproveText: { color: C.white, fontWeight: '700', fontSize: 13 },

  /* empty */
  empty:     { alignItems: 'center', padding: 48, backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.g200, borderStyle: 'dashed' },
  emptyTitle:{ fontSize: 17, fontWeight: '700', color: C.g700, marginBottom: 6 },
  emptySub:  { fontSize: 13, color: C.g400, textAlign: 'center' },

  /* modal */
  modalContainer: { flex: 1, backgroundColor: C.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.g200,
  },
  modalTitle:       { fontSize: 18, fontWeight: '800', color: C.navy },
  modalClose:       { fontSize: 20, color: C.g500, fontWeight: '700' },
  modalSectionHead: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8,
    color: C.g500, marginBottom: 12, marginTop: 4, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: C.g100,
  },

  /* form */
  row2:  { flexDirection: 'row', marginBottom: 0 },
  label: { fontSize: 13, fontWeight: '600', color: C.g700, marginBottom: 6 },
  input: {
    backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g200,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.navy, marginBottom: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5,
    borderColor: C.g200, borderRadius: 999, backgroundColor: C.white,
  },
  chipActive:    { borderColor: C.primary, backgroundColor: C.primaryLt },
  chipText:      { fontSize: 13, color: C.g500, fontWeight: '500' },
  chipTextActive:{ color: C.primary, fontWeight: '700' },
  btn: {
    backgroundColor: C.primary, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 4,
  },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700' },

  /* rentals */
  rentalItem: {
    backgroundColor: C.g50, borderWidth: 1.5, borderColor: C.g200,
    borderRadius: 12, padding: 16, marginBottom: 12,
  },
  rentalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rentalVehicle: { fontSize: 15, fontWeight: '700', color: C.navy, flex: 1, marginRight: 8 },
  rentalMeta:    { fontSize: 13, color: C.g500, marginBottom: 3 },
  rentalDates:   { fontSize: 12, color: C.g400, marginBottom: 10 },
  rentalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
});