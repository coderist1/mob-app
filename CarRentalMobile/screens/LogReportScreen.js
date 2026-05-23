// screens/LogReportScreen.js
// Enhanced Log Report — owner CRUD + renter read-only
// No emojis in any text or comments

import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useLogReport } from '../context/LogReportContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Modern color palette
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

// SVG Icons
const Ic = {
  Search: ({ size = 16, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Circle cx="11" cy="11" r="8" /><Path d="M21 21l-4.35-4.35" />
    </Svg>
  ),
  Trash: ({ size = 16, color = C.danger }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6" /><Path d="M9 6V4h6v2" />
    </Svg>
  ),
  Edit: ({ size = 15, color = C.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  ),
  Back: ({ size = 20, color = C.white }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  ),
  Check: ({ size = 14, color = C.white }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
      <Path d="M5 13l4 4L19 7" />
    </Svg>
  ),
  Close: ({ size = 14, color = C.gray500 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  ),
  Send: ({ size = 16, color = C.white }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
    </Svg>
  ),
  Car: ({ size = 16, color = C.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <Circle cx="7" cy="17" r="2" /><Path d="M9 17h6" /><Circle cx="17" cy="17" r="2" />
    </Svg>
  ),
  Fuel: ({ size = 16, color = C.gray600 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Path d="M3 22h12M4 22v-8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v8" />
      <Path d="M7 10V6a4 4 0 0 1 8 0v4" /><Path d="M7 14h6M10 18h6" />
    </Svg>
  ),
  Odometer: ({ size = 16, color = C.gray600 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" />
    </Svg>
  ),
};

// Constants
const DEFAULT_CHECKLIST = [
  { id: 'exterior_scratches', label: 'Exterior scratches / dents' },
  { id: 'windshield',         label: 'Windshield cracks / chips'  },
  { id: 'tires',              label: 'Tire damage / flat tires'   },
  { id: 'interior',           label: 'Interior damage'            },
  { id: 'missing_parts',      label: 'Missing parts / accessories'},
  { id: 'engine',             label: 'Engine / mechanical issue'  },
  { id: 'lights',             label: 'Lights / signals broken'    },
  { id: 'fuel_low',           label: 'Fuel level low'             },
];

const FUEL_OPTS = ['Full', '3/4', '1/2', '1/4', 'Empty'];
const COND_OPTS = [
  { v: 'Excellent', bg: '#D8F3DC', color: '#2D6A4F', border: '#40916C' },
  { v: 'Good',      bg: '#E3F2FD', color: '#1E88E5', border: '#64B5F6' },
  { v: 'Fair',      bg: '#FFF3E0', color: '#E67E22', border: '#FFB74D' },
  { v: 'Poor',      bg: '#FFEBEE', color: '#E63946', border: '#EF9A9A' },
];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---';
const fmtDateTime = d => d ? new Date(d).toLocaleString() : '---';

// Shared Components
function Pill({ label, bg, color }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FuelGauge({ level }) {
  if (!level) return null;
  const idx = FUEL_OPTS.indexOf(level);
  const pct = [1, 0.75, 0.5, 0.25, 0.05][idx];
  const color = pct >= 0.5 ? C.success : pct >= 0.25 ? C.warning : C.danger;
  return (
    <View style={styles.fuelContainer}>
      <View style={styles.fuelHeader}>
        <Ic.Fuel size={12} color={C.gray600} />
        <Text style={styles.fuelLabel}>Fuel Level</Text>
        <Text style={[styles.fuelValue, { color }]}>{level}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function CondBadge({ value }) {
  const opt = COND_OPTS.find(o => o.v === value);
  if (!opt) return null;
  return (
    <View style={[styles.condBadge, { backgroundColor: opt.bg, borderColor: opt.border }]}>
      <Text style={[styles.condBadgeText, { color: opt.color }]}>{value}</Text>
    </View>
  );
}

function StatsBar({ reports }) {
  const total = reports.length;
  const complete = reports.filter(r => !!r.checkout).length;
  const awaiting = reports.filter(r => !r.checkout).length;
  const newDmg = reports.filter(r => {
    if (!r.checkout) return false;
    const ci = r.checkin?.issues || [], co = r.checkout?.issues || [];
    return co.some(i => !ci.includes(i));
  }).length;
  const stats = [
    { label: 'Total', value: total, color: C.primary },
    { label: 'Complete', value: complete, color: C.success },
    { label: 'Awaiting', value: awaiting, color: C.warning },
    { label: 'New Damage', value: newDmg, color: C.danger },
  ];
  return (
    <View style={styles.statsGrid}>
      {stats.map(s => (
        <View key={s.label} style={[styles.statCard, { borderLeftColor: s.color }]}>
          <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

function ChecklistEditor({ issues, onChange, isCheckout = false, checkinIssues = [] }) {
  const [customInput, setCustomInput] = useState('');
  const [customItems, setCustomItems] = useState([]);
  const allItems = [...DEFAULT_CHECKLIST, ...customItems];

  const toggle = id => {
    issues.includes(id) ? onChange(issues.filter(i => i !== id)) : onChange([...issues, id]);
  };
  const addCustom = () => {
    const t = customInput.trim(); if (!t) return;
    const id = `custom_${Date.now()}`;
    setCustomItems(prev => [...prev, { id, label: t }]);
    onChange([...issues, id]);
    setCustomInput('');
  };
  const removeCustom = id => {
    setCustomItems(prev => prev.filter(c => c.id !== id));
    onChange(issues.filter(i => i !== id));
  };

  return (
    <View style={styles.checklistSection}>
      <SectionHeader title="Condition Checklist" />
      {allItems.map(item => {
        const checked = issues.includes(item.id);
        const isNew = isCheckout && checked && !checkinIssues.includes(item.id);
        const isCustom = !DEFAULT_CHECKLIST.find(d => d.id === item.id);
        return (
          <TouchableOpacity key={item.id} onPress={() => toggle(item.id)} style={[styles.checkRow, checked && styles.checkRowActive, isNew && styles.checkRowNew]}>
            <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
              {checked && <Ic.Check size={10} color={C.white} />}
            </View>
            <Text style={[styles.checkLabel, checked && styles.checkLabelActive]}>{item.label}</Text>
            {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
            {isCustom && (
              <TouchableOpacity onPress={() => removeCustom(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ic.Close size={13} color={C.danger} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
      <View style={styles.customRow}>
        <TextInput style={styles.customInput} placeholder="Add custom issue..." value={customInput} onChangeText={setCustomInput} onSubmitEditing={addCustom} returnKeyType="done" />
        <TouchableOpacity onPress={addCustom} style={styles.addCustomBtn}><Text style={styles.addCustomBtnText}>Add</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function ReportForm({ initial = {}, onSave, onCancel, isCheckout = false, checkinIssues = [], rental = {} }) {
  const [odometer, setOdometer] = useState(String(initial.odometer || ''));
  const [fuel, setFuel] = useState(initial.fuel || '');
  const [condition, setCondition] = useState(initial.condition || '');
  const [issues, setIssues] = useState(initial.issues || []);
  const [notes, setNotes] = useState(initial.notes || '');
  const [dmgCost, setDmgCost] = useState(String(initial.damageCost || ''));

  const newIssues = isCheckout ? issues.filter(i => !checkinIssues.includes(i)) : [];

  const doSave = () => {
    Alert.alert('Save Record', 'Confirm this condition report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: () => onSave({
          odometer: parseFloat(odometer) || 0, fuel, condition, issues, notes,
          damageCost: isCheckout ? (parseFloat(dmgCost) || 0) : 0,
        }) }
    ]);
  };

  return (
    <ScrollView style={styles.flex1} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
      <RentalBanner rental={rental} />
      {isCheckout && newIssues.length > 0 && (
        <View style={styles.warningBox}><Text style={styles.warningText}>! {newIssues.length} new issue{newIssues.length > 1 ? 's' : ''} detected at check-out</Text></View>
      )}

      <View style={styles.formSection}>
        <SectionHeader title="Vehicle Data" />
        <View style={styles.inputRow}>
          <Ic.Odometer size={18} color={C.gray600} />
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Odometer (km)" value={odometer} onChangeText={setOdometer} />
        </View>
        <Text style={styles.fieldLabel}>Fuel Level</Text>
        <View style={styles.optionsRow}>
          {FUEL_OPTS.map(f => (
            <TouchableOpacity key={f} onPress={() => setFuel(fuel === f ? '' : f)} style={[styles.optionChip, fuel === f && styles.optionChipActive]}>
              <Text style={[styles.optionChipText, fuel === f && styles.optionChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <FuelGauge level={fuel} />
      </View>

      <View style={styles.formSection}>
        <SectionHeader title="Overall Condition" />
        <View style={styles.optionsRow}>
          {COND_OPTS.map(o => (
            <TouchableOpacity key={o.v} onPress={() => setCondition(condition === o.v ? '' : o.v)} style={[styles.condChip, condition === o.v && { backgroundColor: o.bg, borderColor: o.border }]}>
              <Text style={[styles.condChipText, condition === o.v && { color: o.color }]}>{o.v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ChecklistEditor issues={issues} onChange={setIssues} isCheckout={isCheckout} checkinIssues={checkinIssues} />

      <View style={styles.formSection}>
        <SectionHeader title="Notes" />
        <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} placeholder="Any additional observations..." value={notes} onChangeText={setNotes} />
      </View>

      {isCheckout && (
        <View style={styles.formSection}>
          <SectionHeader title="Damage Assessment" />
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Estimated Damage Cost (₱)" value={dmgCost} onChangeText={setDmgCost} />
        </View>
      )}

      <View style={styles.formActions}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity onPress={doSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>Save Record</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function RentalBanner({ rental }) {
  if (!rental || !rental.vehicleName) return null;
  return (
    <View style={styles.rentalBanner}>
      <View style={styles.rentalBannerRow}>
        <Ic.Car size={18} color={C.primary} />
        <Text style={styles.rentalBannerTitle}>{rental.vehicleName}</Text>
      </View>
      <View style={styles.rentalBannerDetails}>
        {rental.renterName && <Text style={styles.rentalBannerText}>Renter: {rental.renterName}</Text>}
        {rental.startDate && <Text style={styles.rentalBannerText}>{fmtDate(rental.startDate)} – {fmtDate(rental.endDate)}</Text>}
        {rental.pricePerDay && <Text style={styles.rentalBannerText}>₱{parseFloat(rental.pricePerDay).toLocaleString()}/day</Text>}
      </View>
    </View>
  );
}

function TripSummary({ report }) {
  const { checkin, checkout, rental } = report;
  if (!checkin || !checkout) return null;
  const start = rental?.startDate ? new Date(rental.startDate) : null;
  const end = rental?.endDate ? new Date(rental.endDate) : null;
  const days = (start && end) ? Math.max(1, Math.ceil((end - start) / 86400000)) : null;
  const rate = parseFloat(rental?.pricePerDay) || 0;
  const rev = days ? days * rate : null;
  const kmDriven = (checkout.odometer > checkin.odometer) ? checkout.odometer - checkin.odometer : null;
  const ciIssues = checkin.issues || [], coIssues = checkout.issues || [];
  const newDmg = coIssues.filter(i => !ciIssues.includes(i));
  let statusLabel = 'Clean Return', statusBg = C.primaryLighter, statusColor = C.primary;
  if (newDmg.length > 0) { statusLabel = 'Damage Reported'; statusBg = '#FFEBEE'; statusColor = C.danger; }
  else if (coIssues.length > 0) { statusLabel = 'Minor Issues'; statusBg = '#FFF3E0'; statusColor = C.warning; }
  return (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripTitle}>Trip Summary</Text>
        <View style={[styles.tripStatusBadge, { backgroundColor: statusBg }]}><Text style={[styles.tripStatusText, { color: statusColor }]}>{statusLabel}</Text></View>
      </View>
      <View style={styles.metricsGrid}>
        {days != null && <MetricBox label="Days Rented" value={String(days)} />}
        {rev != null && <MetricBox label="Revenue" value={`₱${rev.toLocaleString()}`} />}
        {kmDriven != null && <MetricBox label="km Driven" value={`${kmDriven.toLocaleString()} km`} />}
        <MetricBox label="New Issues" value={String(newDmg.length)} danger={newDmg.length > 0} />
        {checkout.damageCost > 0 && <MetricBox label="Damage Est." value={`₱${checkout.damageCost.toLocaleString()}`} danger />}
      </View>
    </View>
  );
}

function MetricBox({ label, value, danger = false }) {
  return (
    <View style={[styles.metricBox, danger && styles.metricBoxDanger]}>
      <Text style={[styles.metricValue, danger && { color: C.danger }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ConditionColumn({ title, data, newIssues = [], onEdit, isOwner }) {
  if (!data) return <View style={styles.condColumnEmpty}><Text style={styles.condColumnEmptyText}>No data</Text></View>;
  return (
    <View style={styles.condColumn}>
      <View style={styles.condColumnHeader}>
        <Text style={styles.condColumnTitle}>{title}</Text>
        {isOwner && onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
            <Ic.Edit size={12} color={C.primary} /><Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.condField}><Text style={styles.condLabel}>Odometer</Text><Text style={styles.condValue}>{data.odometer ? `${data.odometer.toLocaleString()} km` : '—'}</Text></View>
      <View style={styles.condField}><Text style={styles.condLabel}>Fuel</Text><Text style={styles.condValue}>{data.fuel || '—'}</Text><FuelGauge level={data.fuel} /></View>
      {data.condition && (<View style={styles.condField}><Text style={styles.condLabel}>Condition</Text><CondBadge value={data.condition} /></View>)}
      {data.issues?.length > 0 && (
        <View style={styles.condField}>
          <Text style={styles.condLabel}>Issues</Text>
          {data.issues.map(id => {
            const item = DEFAULT_CHECKLIST.find(d => d.id === id);
            const label = item ? item.label : id;
            const isNew = newIssues.includes(id);
            return (
              <View key={id} style={styles.issueRow}>
                <View style={[styles.issueDot, { backgroundColor: isNew ? C.danger : C.gray400 }]} />
                <Text style={[styles.issueText, isNew && styles.issueTextNew]}>{label}</Text>
                {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
              </View>
            );
          })}
        </View>
      )}
      {!!data.notes && (<View style={styles.condField}><Text style={styles.condLabel}>Notes</Text><Text style={styles.notesText}>{data.notes}</Text></View>)}
    </View>
  );
}

function SignaturesSection({ report, onUpdate, isOwner }) {
  const [editing, setEditing] = useState(false);
  const [ownerSig, setOwnerSig] = useState(report.ownerSignature?.name || '');
  const [renterSig, setRenterSig] = useState(report.renterSignature?.name || '');
  const doSave = () => {
    Alert.alert('Save Signatures', 'Confirm signatures?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: () => {
          onUpdate({
            ownerSignature: { name: ownerSig, signedAt: new Date().toISOString() },
            renterSignature: { name: renterSig, signedAt: new Date().toISOString() },
          });
          setEditing(false);
        } }
    ]);
  };
  return (
    <View style={styles.sigSection}>
      <View style={styles.sigHeader}>
        <Text style={styles.sigTitle}>Signatures</Text>
        {isOwner && !editing && (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
            <Ic.Edit size={12} color={C.primary} /><Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      {editing ? (
        <>
          <Text style={styles.fieldLabel}>Owner Signature</Text>
          <TextInput style={styles.input} value={ownerSig} onChangeText={setOwnerSig} placeholder="Type name to sign..." />
          <Text style={styles.fieldLabel}>Renter Acknowledgment</Text>
          <TextInput style={styles.input} value={renterSig} onChangeText={setRenterSig} placeholder="Type name to sign..." />
          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={doSave} style={styles.saveBtn}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.sigRow}>
          <SigBox label="Owner Signature" sig={report.ownerSignature} />
          <SigBox label="Renter Acknowledgment" sig={report.renterSignature} />
        </View>
      )}
    </View>
  );
}

function SigBox({ label, sig }) {
  return (
    <View style={styles.sigBox}>
      <Text style={styles.sigBoxLabel}>{label}</Text>
      {sig?.name ? (
        <>
          <Text style={styles.sigName}>{sig.name}</Text>
          <Text style={styles.sigDate}>{fmtDateTime(sig.signedAt)}</Text>
        </>
      ) : (
        <Text style={styles.sigEmpty}>Not signed</Text>
      )}
    </View>
  );
}

function CommentsSection({ report, onAddComment, currentUser }) {
  const [text, setText] = useState('');
  const comments = report.comments || [];
  const doSend = () => {
    const t = text.trim(); if (!t) return;
    onAddComment(report.id, { text: t, authorName: currentUser.fullName || currentUser.firstName, authorRole: currentUser.role });
    setText('');
  };
  return (
    <View style={styles.commentsSection}>
      <Text style={styles.commentsTitle}>Comments</Text>
      {comments.length === 0 ? <Text style={styles.noComments}>No comments yet.</Text> : (
        comments.map((c, i) => (
          <View key={c.id || i} style={[styles.commentCard, { borderLeftColor: c.authorRole === 'owner' ? C.primary : C.info }]}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{c.authorName}</Text>
              <View style={[styles.commentRoleBadge, { backgroundColor: c.authorRole === 'owner' ? C.primaryLighter : '#E3F2FD' }]}>
                <Text style={[styles.commentRoleText, { color: c.authorRole === 'owner' ? C.primary : C.info }]}>{c.authorRole === 'owner' ? 'Owner' : 'Renter'}</Text>
              </View>
              <Text style={styles.commentDate}>{fmtDateTime(c.createdAt)}</Text>
            </View>
            <Text style={styles.commentText}>{c.text}</Text>
          </View>
        ))
      )}
      <View style={styles.commentInputRow}>
        <TextInput style={styles.commentInput} placeholder="Write a comment..." value={text} onChangeText={setText} multiline />
        <TouchableOpacity onPress={doSend} disabled={!text.trim()} style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}>
          <Ic.Send size={16} color={C.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailView({ report, onBack, onUpdateReport, isOwner, currentUser, onAddComment }) {
  const [view, setView] = useState('detail');
  const ciIssues = report.checkin?.issues || [];
  const coIssues = report.checkout?.issues || [];
  const newIssues = report.checkout ? coIssues.filter(i => !ciIssues.includes(i)) : [];

  if (view === 'editCI') {
    return (
      <View style={styles.flex1}>
        <View style={styles.subHeader}><Text style={styles.subHeaderTitle}>Edit Check-in</Text></View>
        <ReportForm initial={report.checkin} rental={report.rental} onSave={data => { onUpdateReport(report.id, { checkin: { ...report.checkin, ...data } }); setView('detail'); }} onCancel={() => setView('detail')} />
      </View>
    );
  }
  if (view === 'addCO' || view === 'editCO') {
    return (
      <View style={styles.flex1}>
        <View style={styles.subHeader}><Text style={styles.subHeaderTitle}>{view === 'addCO' ? 'Add Check-out' : 'Edit Check-out'}</Text></View>
        <ReportForm initial={view === 'editCO' ? report.checkout : {}} rental={report.rental} isCheckout checkinIssues={ciIssues} onSave={data => { onUpdateReport(report.id, { checkout: { ...data } }); setView('detail'); }} onCancel={() => setView('detail')} />
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Ic.Back size={20} color={C.white} /></TouchableOpacity>
        <Text style={styles.subHeaderTitle}>Log Report Detail</Text>
      </View>
      <ScrollView contentContainerStyle={styles.detailContent}>
        <RentalBanner rental={report.rental} />
        <TripSummary report={report} />
        {report.checkout ? (
          <>
            <Text style={styles.comparisonTitle}>Condition Comparison</Text>
            <View style={styles.comparisonRow}>
              <ConditionColumn title="Before Trip" data={report.checkin} onEdit={isOwner ? () => setView('editCI') : null} isOwner={isOwner} />
              <ConditionColumn title="After Trip" data={report.checkout} newIssues={newIssues} onEdit={isOwner ? () => setView('editCO') : null} isOwner={isOwner} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.pendingNotice}><Text style={styles.pendingNoticeText}>No check-out report yet. Add one when the vehicle is returned.</Text></View>
            {isOwner && (
              <View style={styles.formActions}>
                <TouchableOpacity onPress={() => setView('editCI')} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Edit Check-in</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setView('addCO')} style={styles.saveBtn}><Text style={styles.saveBtnText}>Add Check-out</Text></TouchableOpacity>
              </View>
            )}
            {report.checkin && <ConditionColumn title="Check-in Record" data={report.checkin} onEdit={isOwner ? () => setView('editCI') : null} isOwner={isOwner} />}
          </>
        )}
        <SignaturesSection report={report} isOwner={isOwner} onUpdate={updates => onUpdateReport(report.id, updates)} />
        <CommentsSection report={report} onAddComment={onAddComment} currentUser={currentUser} />
      </ScrollView>
    </View>
  );
}

function NewEntryForm({ rental, onSave, onCancel }) {
  return (
    <View style={styles.flex1}>
      <View style={styles.subHeader}><Text style={styles.subHeaderTitle}>New Check-in Record</Text></View>
      <ReportForm initial={{}} rental={rental} onSave={data => onSave({ rental, checkin: data })} onCancel={onCancel} />
    </View>
  );
}

// MAIN COMPONENT
export default function LogReportScreen({ hideHeader = false, pendingRental, onClearPendingRental }) {
  const { user } = useAuth();
  const { reports, addReport, updateReport, deleteReport, addComment } = useLogReport();
  const isOwner = user?.role === 'owner';
  const isRenter = user?.role === 'renter';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [newEntry, setNewEntry] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 500); };
  useEffect(() => { if (pendingRental) { setNewEntry(pendingRental); onClearPendingRental?.(); } }, [pendingRental]);

  const myReports = useMemo(() => {
    if (isOwner) return reports;
    if (isRenter) return reports.filter(r => r.rental?.renterId === user?.id);
    return [];
  }, [reports, user]);

  const filteredReports = useMemo(() => {
    let result = myReports;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => r.rental?.vehicleName?.toLowerCase().includes(q));
    }
    if (filter === 'awaiting') return result.filter(r => !r.checkout);
    if (filter === 'complete') return result.filter(r => !!r.checkout);
    if (filter === 'damaged') {
      return result.filter(r => {
        if (!r.checkout) return false;
        const ci = r.checkin?.issues || [], co = r.checkout?.issues || [];
        return co.some(i => !ci.includes(i));
      });
    }
    return result;
  }, [myReports, search, filter]);

  const handleNewSave = async ({ rental, checkin }) => { await addReport({ rental, checkin, checkout: null, comments: [] }); setNewEntry(null); };
  const handleUpdateReport = async (id, updates) => { await updateReport(id, updates); setSelected(prev => prev ? { ...prev, ...updates } : prev); };
  const handleDelete = id => {
    Alert.alert('Delete Entry?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteReport(id); setSelected(null); } },
    ]);
  };

  if (newEntry) return <NewEntryForm rental={newEntry} onSave={handleNewSave} onCancel={() => setNewEntry(null)} />;
  if (selected) {
    const fresh = reports.find(r => r.id === selected.id) || selected;
    return <DetailView report={fresh} onBack={() => setSelected(null)} onUpdateReport={handleUpdateReport} onAddComment={addComment} isOwner={isOwner} currentUser={user} />;
  }

  const listContent = (
    <>
      {!hideHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log Report</Text>
          <Text style={styles.headerSub}>{isOwner ? 'Vehicle condition records' : 'Your rental condition reports'}</Text>
        </View>
      )}
      <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>
        <StatsBar reports={myReports} />
        <View style={styles.searchWrapper}>
          <Ic.Search size={18} color={C.gray500} />
          <TextInput style={styles.searchInput} placeholder="Search by vehicle or renter..." value={search} onChangeText={setSearch} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {[
              { key: 'all', label: 'All' },
              { key: 'awaiting', label: 'Awaiting C/O' },
              { key: 'complete', label: 'Complete' },
              { key: 'damaged', label: 'Damaged' },
            ].map(item => (
              <TouchableOpacity key={item.key} onPress={() => setFilter(item.key)} style={[styles.filterChip, filter === item.key && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No log entries yet</Text>
            <Text style={styles.emptySub}>{isOwner ? 'Go to Rentals, open an approved rental and tap "Record Log Report".' : 'Your rental condition reports will appear here.'}</Text>
          </View>
        ) : (
          filteredReports.map(report => {
            const ciIssues = report.checkin?.issues || [];
            const coIssues = report.checkout?.issues || [];
            const newDmg = report.checkout ? coIssues.filter(i => !ciIssues.includes(i)) : [];
            const condOpt = COND_OPTS.find(o => o.v === report.checkin?.condition);
            return (
              <TouchableOpacity key={report.id} onPress={() => setSelected(report)} style={styles.logCard} activeOpacity={0.85}>
                <View style={styles.logCardContent}>
                  <View style={styles.logCardTags}>
                    <Pill label="Check-in" bg={C.primaryLighter} color={C.primary} />
                    {report.checkout ? <Pill label="Trip Complete" bg={C.primaryBg} color={C.primary} /> : <Pill label="Awaiting C/O" bg="#FFF3E0" color={C.warning} />}
                    {condOpt && <Pill label={report.checkin.condition} bg={condOpt.bg} color={condOpt.color} />}
                    {newDmg.length > 0 && <Pill label={`${newDmg.length} New Damage`} bg="#FFEBEE" color={C.danger} />}
                  </View>
                  <Text style={styles.logCardTitle}>{report.rental?.vehicleName || 'Vehicle'}</Text>
                  <View style={styles.logCardMeta}>
                    <Text style={styles.logCardDate}>{fmtDate(report.checkin?.createdAt || report.createdAt)}</Text>
                    {ciIssues.length > 0 ? <Text style={styles.logCardIssues}>{ciIssues.length} issue{ciIssues.length > 1 ? 's' : ''}</Text> : <Text style={styles.logCardClean}>Clean check-in</Text>}
                    {report.rental?.renterName && <Text style={styles.logCardRenter}>{report.rental.renterName}</Text>}
                  </View>
                </View>
                {isOwner && (
                  <TouchableOpacity onPress={() => handleDelete(report.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ic.Trash size={18} color={C.danger} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </>
  );

  if (hideHeader) return <View style={styles.flex1Bg}>{listContent}</View>;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {listContent}
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.gray50 },
  flex1: { flex: 1 },
  flex1Bg: { flex: 1, backgroundColor: C.gray50 },
  header: { backgroundColor: C.navy, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  subHeader: { backgroundColor: C.navy, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  subHeaderTitle: { fontSize: 18, fontWeight: '700', color: C.white, flex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  detailContent: { padding: 16, paddingBottom: 40 },
  formContent: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, minWidth: (SCREEN_WIDTH - 56) / 4 - 8, backgroundColor: C.white, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1, borderColor: C.gray200, borderLeftWidth: 4, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: C.gray600, marginTop: 2, fontWeight: '500' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 14, marginBottom: 16, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: C.gray900 },
  filterScroll: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, backgroundColor: C.white, borderWidth: 1, borderColor: C.gray300 },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.gray700 },
  filterChipTextActive: { color: C.white },
  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.gray100, shadowColor: C.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  logCardContent: { flex: 1 },
  logCardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  logCardTitle: { fontSize: 17, fontWeight: '700', color: C.navy, marginBottom: 6 },
  logCardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  logCardDate: { fontSize: 12, color: C.gray600 },
  logCardIssues: { fontSize: 12, color: C.warning, fontWeight: '600' },
  logCardClean: { fontSize: 12, color: C.success, fontWeight: '600' },
  logCardRenter: { fontSize: 12, color: C.gray500 },
  emptyState: { alignItems: 'center', paddingVertical: 60, backgroundColor: C.white, borderRadius: 24, marginTop: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.gray800, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.gray500, textAlign: 'center', paddingHorizontal: 32 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  sectionHeader: { borderBottomWidth: 1, borderBottomColor: C.gray100, paddingBottom: 8, marginBottom: 14, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.8 },
  rentalBanner: { backgroundColor: C.primaryLighter, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.primaryLight + '40' },
  rentalBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rentalBannerTitle: { fontSize: 16, fontWeight: '700', color: C.primary },
  rentalBannerDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rentalBannerText: { fontSize: 12, color: C.gray700 },
  tripCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.gray100, shadowColor: C.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripTitle: { fontSize: 15, fontWeight: '800', color: C.navy },
  tripStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tripStatusText: { fontSize: 11, fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricBox: { backgroundColor: C.gray50, borderRadius: 12, padding: 10, minWidth: 80, borderWidth: 1, borderColor: C.gray200, alignItems: 'center' },
  metricBoxDanger: { borderColor: C.danger + '40', backgroundColor: '#FFF5F5' },
  metricValue: { fontSize: 15, fontWeight: '800', color: C.navy },
  metricLabel: { fontSize: 10, color: C.gray600, marginTop: 2 },
  comparisonTitle: { fontSize: 12, fontWeight: '800', color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 4 },
  comparisonRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  condColumn: { flex: 1, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.gray200, padding: 12 },
  condColumnEmpty: { flex: 1, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.gray200, padding: 24, alignItems: 'center', justifyContent: 'center' },
  condColumnEmptyText: { fontSize: 13, color: C.gray400, fontStyle: 'italic' },
  condColumnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  condColumnTitle: { fontSize: 13, fontWeight: '800', color: C.navy },
  condField: { marginBottom: 12 },
  condLabel: { fontSize: 10, fontWeight: '700', color: C.gray500, textTransform: 'uppercase', marginBottom: 4 },
  condValue: { fontSize: 14, fontWeight: '600', color: C.gray900 },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  issueDot: { width: 6, height: 6, borderRadius: 3 },
  issueText: { fontSize: 12, color: C.gray700, flex: 1 },
  issueTextNew: { color: C.danger, fontWeight: '600' },
  notesText: { fontSize: 12, color: C.gray700, lineHeight: 16 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryLighter, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  editBtnText: { fontSize: 11, color: C.primary, fontWeight: '600' },
  fuelContainer: { marginTop: 8 },
  fuelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  fuelLabel: { fontSize: 11, color: C.gray600, flex: 1 },
  fuelValue: { fontSize: 11, fontWeight: '700' },
  progressBar: { height: 6, backgroundColor: C.gray200, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  condBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  condBadgeText: { fontSize: 11, fontWeight: '700' },
  checklistSection: { marginBottom: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: C.gray200, borderRadius: 12, marginBottom: 8, backgroundColor: C.white, gap: 12 },
  checkRowActive: { borderColor: C.primary + '60', backgroundColor: C.primaryLighter },
  checkRowNew: { borderColor: C.danger + '60', backgroundColor: '#FFF5F5' },
  checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: C.gray400, alignItems: 'center', justifyContent: 'center' },
  checkBoxActive: { backgroundColor: C.primary, borderColor: C.primary },
  checkLabel: { flex: 1, fontSize: 13, color: C.gray800 },
  checkLabelActive: { color: C.primary, fontWeight: '600' },
  newBadge: { backgroundColor: C.danger, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },
  customRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  customInput: { flex: 1, borderWidth: 1, borderColor: C.gray200, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: C.white },
  addCustomBtn: { backgroundColor: C.primaryLight, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  addCustomBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },
  formSection: { marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.gray200, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, gap: 8, backgroundColor: C.white },
  input: { flex: 1, fontSize: 14, color: C.gray900, paddingVertical: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.gray500, marginBottom: 8, textTransform: 'uppercase' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: C.gray300, backgroundColor: C.white },
  optionChipActive: { borderColor: C.primary, backgroundColor: C.primaryLighter },
  optionChipText: { fontSize: 13, fontWeight: '500', color: C.gray700 },
  optionChipTextActive: { color: C.primary, fontWeight: '700' },
  condChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 30, borderWidth: 1, borderColor: C.gray300, backgroundColor: C.white },
  condChipText: { fontSize: 13, fontWeight: '600', color: C.gray700 },
  warningBox: { backgroundColor: '#FFF5F5', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFCDD2' },
  warningText: { fontSize: 13, fontWeight: '700', color: C.danger, textAlign: 'center' },
  pendingNotice: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FFE0B2' },
  pendingNoticeText: { fontSize: 13, color: C.warning, fontWeight: '600', textAlign: 'center' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, backgroundColor: C.gray100, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.gray300 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: C.gray700 },
  saveBtn: { flex: 2, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: C.white },
  sigSection: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.gray100 },
  sigHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sigTitle: { fontSize: 14, fontWeight: '700', color: C.navy },
  sigRow: { flexDirection: 'row', gap: 12 },
  sigBox: { flex: 1, backgroundColor: C.gray50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.gray200, borderTopWidth: 3, borderTopColor: C.primary },
  sigBoxLabel: { fontSize: 10, fontWeight: '700', color: C.gray500, textTransform: 'uppercase' },
  sigName: { fontSize: 13, fontWeight: '600', color: C.navy, marginTop: 4 },
  sigDate: { fontSize: 9, color: C.gray400, marginTop: 2 },
  sigEmpty: { fontSize: 12, color: C.gray400, fontStyle: 'italic', marginTop: 4 },
  commentsSection: { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.gray100 },
  commentsTitle: { fontSize: 14, fontWeight: '700', color: C.navy, marginBottom: 12 },
  noComments: { fontSize: 13, color: C.gray400, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  commentCard: { borderLeftWidth: 3, backgroundColor: C.gray50, borderRadius: 12, padding: 12, marginBottom: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: C.gray900 },
  commentRoleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  commentRoleText: { fontSize: 10, fontWeight: '700' },
  commentDate: { fontSize: 10, color: C.gray500, marginLeft: 'auto' },
  commentText: { fontSize: 13, color: C.gray700, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: C.gray200, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: C.white, maxHeight: 80 },
  sendBtn: { backgroundColor: C.primary, borderRadius: 12, width: 44, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});