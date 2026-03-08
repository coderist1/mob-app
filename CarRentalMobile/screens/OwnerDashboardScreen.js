// screens/OwnerDashboardScreen.js
// Bottom nav: Home | Rentals | Add Vehicle | Log Book | Profile
// Removed header action buttons — all navigation is via bottom bar

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useLogReport } from '../context/LogReportContext';
import BottomNav from '../components/BottomNav';
import ProfileAvatar from '../components/ProfileAvatar';
import LogReportScreen from './LogReportScreen';

/* ─── Design tokens ─── */
const C = {
  primary:   '#3F9B84',
  primaryDk: '#2d7a67',
  navy:      '#1a2c5e',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  success:   '#22c55e',
  g50:  '#f9fafb',
  g100: '#f3f4f6',
  g200: '#e5e7eb',
  g300: '#d1d5db',
  g400: '#9ca3af',
  g500: '#6b7280',
  g700: '#374151',
  g900: '#111827',
  white: '#ffffff',
};

/* ─── Vehicle Card ─── */
function VehicleCard({ vehicle, onEdit, onDelete }) {
  return (
    <View style={s.vehicleCard}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Text style={s.vehicleName}>{vehicle.name || 'Unnamed Vehicle'}</Text>
          <View style={[s.statusBadge, { backgroundColor: vehicle.status === 'available' ? '#d1fae5' : vehicle.status === 'rented' ? '#fee2e2' : '#fef3c7' }]}>
            <Text style={[s.statusText, { color: vehicle.status === 'available' ? '#065f46' : vehicle.status === 'rented' ? '#991b1b' : '#92400e' }]}>
              {(vehicle.status || 'available').charAt(0).toUpperCase() + (vehicle.status || 'available').slice(1)}
            </Text>
          </View>
        </View>
        <Text style={s.vehicleSub}>{vehicle.model || ''} {vehicle.year ? `· ${vehicle.year}` : ''}</Text>
        {vehicle.pricePerDay && (
          <Text style={s.vehiclePrice}>₱{parseFloat(vehicle.pricePerDay).toLocaleString()}/day</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={() => onEdit(vehicle)} style={s.iconBtn}>
          <Text style={{ fontSize: 15 }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(vehicle.id)} style={[s.iconBtn, { borderColor: '#fecaca' }]}>
          <Text style={{ fontSize: 15 }}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Vehicle Form ─── */
function VehicleFormModal({ visible, onClose, onSave, initial, isEdit }) {
  const blank = { name: '', model: '', year: '', pricePerDay: '', location: '', description: '', status: 'available', seats: '', fuel: '' };
  const [form, setForm] = useState(initial || blank);

  React.useEffect(() => { if (visible) setForm(initial || blank); }, [visible]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Vehicle name is required.'); return; }
    if (!form.pricePerDay) { Alert.alert('Required', 'Price per day is required.'); return; }
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: C.white }}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.modalClose}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {[
            { key: 'name',        label: 'Vehicle Name *',   placeholder: 'e.g. Toyota Vios' },
            { key: 'model',       label: 'Model',            placeholder: 'e.g. 1.3 E CVT' },
            { key: 'year',        label: 'Year',             placeholder: 'e.g. 2022', numeric: true },
            { key: 'pricePerDay', label: 'Price per Day (₱) *', placeholder: 'e.g. 2500', numeric: true },
            { key: 'location',    label: 'Pickup Location',  placeholder: 'e.g. Davao City' },
            { key: 'seats',       label: 'Seats',            placeholder: 'e.g. 5', numeric: true },
            { key: 'fuel',        label: 'Fuel Type',        placeholder: 'e.g. Gasoline' },
          ].map(f => (
            <View key={f.key} style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <TextInput style={s.input} placeholder={f.placeholder} placeholderTextColor={C.g400}
                value={String(form[f.key] || '')} onChangeText={v => set(f.key, v)}
                keyboardType={f.numeric ? 'numeric' : 'default'} />
            </View>
          ))}
          <View style={{ marginBottom: 14 }}>
            <Text style={s.fieldLabel}>Description</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} multiline
              placeholder="Describe your vehicle…" placeholderTextColor={C.g400}
              value={form.description} onChangeText={v => set('description', v)} />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text style={s.fieldLabel}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['available', 'unavailable'].map(st => (
                <TouchableOpacity key={st} onPress={() => set('status', st)}
                  style={[s.pillBtn, form.status === st && { backgroundColor: C.primary, borderColor: C.primary }]}>
                  <Text style={[s.pillBtnText, form.status === st && { color: C.white }]}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity onPress={handleSave} style={s.btnPrimary}>
            <Text style={s.btnPrimaryText}>{isEdit ? 'Save Changes' : 'Add Vehicle'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ─── Rental History Tab ─── */
function RentalsTab({ rentalHistory, vehicles }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = rentalHistory;
    if (filter !== 'all') list = list.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.vehicleName?.toLowerCase().includes(q) ||
        r.renterName?.toLowerCase().includes(q)
      );
    }
    return list.slice().reverse();
  }, [rentalHistory, filter, search]);

  const stats = useMemo(() => ({
    total:    rentalHistory.length,
    pending:  rentalHistory.filter(r => r.status === 'pending').length,
    approved: rentalHistory.filter(r => r.status === 'approved').length,
    completed:rentalHistory.filter(r => r.status === 'completed').length,
  }), [rentalHistory]);

  const TABS = ['all', 'pending', 'approved', 'completed', 'rejected'];
  const BADGE_COLORS = {
    pending:  { bg: '#fef3c7', color: '#92400e' },
    approved: { bg: '#d1fae5', color: '#065f46' },
    completed:{ bg: '#dbeafe', color: '#1e40af' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
  };

  const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <View style={{ flex: 1 }}>
      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 }}>
        {[
          { label: 'Total',    value: stats.total,    color: C.primary },
          { label: 'Pending',  value: stats.pending,  color: C.warning },
          { label: 'Active',   value: stats.approved, color: C.success },
          { label: 'Done',     value: stats.completed,color: '#3b82f6' },
        ].map(st => (
          <View key={st.label} style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: st.color, elevation: 2 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: st.color }}>{st.value}</Text>
            <Text style={{ fontSize: 10, color: C.g500 }}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => setFilter(t)}
              style={[s.filterTab, filter === t && s.filterTabActive]}>
              <Text style={[s.filterTabText, filter === t && s.filterTabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Search */}
      <View style={[s.searchWrap, { marginHorizontal: 16, marginBottom: 12 }]}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Search rentals…" placeholderTextColor={C.g400} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
            <Text style={s.emptyTitle}>No rentals found</Text>
          </View>
        ) : (
          filtered.map((rental, i) => {
            const bc = BADGE_COLORS[rental.status] || BADGE_COLORS.pending;
            return (
              <View key={rental.id || i} style={s.rentalCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: C.navy, flex: 1 }}>{rental.vehicleName || 'Vehicle'}</Text>
                  <View style={{ backgroundColor: bc.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: bc.color }}>{(rental.status || 'pending').toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: C.g500 }}>Renter: <Text style={{ color: C.g700, fontWeight: '600' }}>{rental.renterName || '—'}</Text></Text>
                <Text style={{ fontSize: 13, color: C.g500, marginTop: 2 }}>Period: <Text style={{ color: C.g700 }}>{fmtDate(rental.startDate)} – {fmtDate(rental.endDate)}</Text></Text>
                {rental.totalPrice && <Text style={{ fontSize: 13, color: C.primary, fontWeight: '700', marginTop: 4 }}>₱{parseFloat(rental.totalPrice).toLocaleString()}</Text>}

                {/* Approve / Reject for pending */}
                {rental.status === 'pending' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity style={[s.btnPrimary, { flex: 1, paddingVertical: 9 }]}
                      onPress={() => Alert.alert('Approve', `Approve rental for ${rental.vehicleName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Approve', onPress: () => { rental.status = 'approved'; } },
                      ])}>
                      <Text style={[s.btnPrimaryText, { fontSize: 13 }]}>✓ Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btnDanger, { flex: 1, paddingVertical: 9 }]}
                      onPress={() => Alert.alert('Reject', `Reject this rental request?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Reject', style: 'destructive', onPress: () => { rental.status = 'rejected'; } },
                      ])}>
                      <Text style={[s.btnPrimaryText, { fontSize: 13 }]}>✕ Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

/* ═══════════ HOME TAB ═══════════ */
function HomeTab({ vehicles, stats, searchQuery, setSearchQuery, filtered, onEdit, onDelete }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Stats row */}
      <View style={s.statsRow}>
        {[
          { label: 'Total',     value: stats.total,                                 color: C.primary },
          { label: 'Available', value: stats.available,                              color: C.success },
          { label: 'Rented',    value: stats.rented,                                 color: C.danger  },
          { label: 'Est./Day',  value: `₱${stats.earnings.toLocaleString()}`,        color: C.navy    },
        ].map(st => (
          <View key={st.label} style={s.statCard}>
            <Text style={[s.statNum, { color: st.color }]}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { marginHorizontal: 16 }]}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Search your vehicles…" placeholderTextColor={C.g400}
          value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Vehicle list */}
      <View style={{ paddingHorizontal: 16 }}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No vehicles found</Text>
            <Text style={s.emptySub}>Tap the "+" tab below to add your first car.</Text>
          </View>
        ) : (
          filtered.map(v => <VehicleCard key={v.id} vehicle={v} onEdit={onEdit} onDelete={onDelete} />)
        )}
      </View>
    </ScrollView>
  );
}

/* ═══════════ MAIN COMPONENT ═══════════ */
export default function OwnerDashboardScreen() {
  const router  = useRouter();
  const { user } = useAuth();
  const { reports } = useLogReport();

  const [activeTab, setActiveTab] = useState('home');

  // Vehicle state
  const [vehicles, setVehicles]       = useState([
    { id: 1, name: 'Toyota Vios', model: '1.3 E', year: '2022', pricePerDay: '2500', status: 'available', location: 'Davao City', seats: '5', fuel: 'Gasoline' },
    { id: 2, name: 'Honda City', model: '1.5 RS', year: '2021', pricePerDay: '3000', status: 'rented',    location: 'Davao City', seats: '5', fuel: 'Gasoline' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget]       = useState(null);

  // Rental history (demo data)
  const [rentalHistory] = useState([
    { id: 'r1', vehicleId: 2, vehicleName: 'Honda City', renterName: 'Juan Dela Cruz', startDate: '2026-03-01', endDate: '2026-03-05', totalPrice: 15000, status: 'approved' },
    { id: 'r2', vehicleId: 1, vehicleName: 'Toyota Vios', renterName: 'Maria Santos',   startDate: '2026-02-15', endDate: '2026-02-20', totalPrice: 12500, status: 'completed' },
    { id: 'r3', vehicleId: 1, vehicleName: 'Toyota Vios', renterName: 'Pedro Reyes',    startDate: '2026-03-10', endDate: '2026-03-12', totalPrice: 5000,  status: 'pending' },
  ]);

  const userName = user?.firstName || user?.fullName || 'Owner';

  const stats = useMemo(() => ({
    total:     vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    rented:    vehicles.filter(v => v.status === 'rented').length,
    earnings:  vehicles.reduce((acc, v) => acc + (parseFloat(v.pricePerDay) || 0), 0),
  }), [vehicles]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return vehicles;
    const q = searchQuery.toLowerCase();
    return vehicles.filter(v => v.name?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q));
  }, [vehicles, searchQuery]);

  // Pending badge for rentals tab
  const pendingCount = rentalHistory.filter(r => r.status === 'pending').length;

  const openEdit = v => { setEditTarget(v); setShowEditModal(true); };

  const handleAdd = form => {
    const newV = { ...form, id: Date.now() };
    setVehicles(prev => [...prev, newV]);
    setShowAddModal(false);
  };

  const handleEdit = form => {
    setVehicles(prev => prev.map(v => v.id === editTarget.id ? { ...v, ...form } : v));
    setShowEditModal(false);
    setEditTarget(null);
  };

  const handleDelete = id => {
    Alert.alert('Delete Vehicle?', 'This will permanently remove the vehicle listing.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setVehicles(prev => prev.filter(v => v.id !== id)) },
    ]);
  };

  const handleTabPress = tab => {
    if (tab === 'add') { setShowAddModal(true); return; }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            vehicles={vehicles}
            stats={stats}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filtered={filtered}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        );
      case 'rentals':
        return <RentalsTab rentalHistory={rentalHistory} vehicles={vehicles} />;
      case 'logbook':
        return <LogReportScreen />;
      case 'profile':
        router.push('/profile');
        return null;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#edf1f7' }}>
      {/* ── HEADER ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Owner Dashboard</Text>
          <Text style={s.headerSub}>Welcome back, {userName} 👋</Text>
        </View>
        <ProfileAvatar size={38} />
      </View>

      {/* ── CONTENT ── */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>

      {/* ── BOTTOM NAV ── */}
      <BottomNav
        role="owner"
        activeTab={activeTab}
        onTabPress={handleTabPress}
        badges={{ rentals: pendingCount }}
      />

      {/* ── ADD MODAL ── */}
      <VehicleFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
        initial={null}
        isEdit={false}
      />

      {/* ── EDIT MODAL ── */}
      <VehicleFormModal
        visible={showEditModal}
        onClose={() => { setShowEditModal(false); setEditTarget(null); }}
        onSave={handleEdit}
        initial={editTarget}
        isEdit
      />
    </View>
  );
}

/* ─── Styles ─── */
const s = StyleSheet.create({
  header: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.white },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 2 },
  statsRow:    { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  statCard:    { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  statNum:     { fontSize: 20, fontWeight: '800' },
  statLabel:   { fontSize: 11, color: C.g500, marginTop: 3 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.g200, paddingHorizontal: 12, marginBottom: 14 },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.g900 },
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.g200, elevation: 2,
  },
  vehicleName:  { fontSize: 15, fontWeight: '700', color: C.navy },
  vehicleSub:   { fontSize: 12, color: C.g500, marginTop: 2 },
  vehiclePrice: { fontSize: 13, color: C.primary, fontWeight: '700', marginTop: 4 },
  statusBadge:  { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:   { fontSize: 10, fontWeight: '700' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: C.g50,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g200,
  },
  rentalCard: {
    backgroundColor: C.white, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.g200, elevation: 2,
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.g200,
  },
  filterTabActive:     { backgroundColor: C.primary, borderColor: C.primary },
  filterTabText:       { fontSize: 13, color: C.g500 },
  filterTabTextActive: { color: C.white, fontWeight: '700' },
  empty: {
    alignItems: 'center', padding: 48, backgroundColor: C.g50,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.g200,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.g700, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.g400, textAlign: 'center' },
  // Modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.g200 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: C.navy },
  modalClose:  { fontSize: 22, color: C.g400 },
  // Form
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: C.g400, marginBottom: 6 },
  input: {
    padding: 12, borderWidth: 1.5, borderColor: C.g200, borderRadius: 10,
    fontSize: 14, color: C.g900, backgroundColor: C.white,
  },
  pillBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: C.g200, backgroundColor: C.white },
  pillBtnText: { fontSize: 13, fontWeight: '600', color: C.g500 },
  btnPrimary: {
    backgroundColor: C.primary, borderRadius: 10, paddingVertical: 13,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { color: C.white, fontSize: 14, fontWeight: '700' },
  btnDanger: {
    backgroundColor: C.danger, borderRadius: 10, paddingVertical: 13,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
  },
});