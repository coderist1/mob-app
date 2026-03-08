// screens/LogReportScreen.js
// Mobile port of OwnerLogReport.jsx
// Owner: full CRUD (create check-in, add check-out, edit, delete, comments, signatures)
// Renter: read-only view of reports linked to their rentals

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLogReport } from '../context/LogReportContext';

/* ─── Design tokens ─── */
const C = {
  primary:   '#3F9B84',
  primaryDk: '#2e7d67',
  primaryLt: '#ecfdf5',
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

const FUEL_OPTS         = ['Full', '3/4', '1/2', '1/4', 'Empty'];
const CONDITION_RATINGS = ['Excellent', 'Good', 'Fair', 'Poor'];

const COND_COLORS = {
  Excellent: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Good:      { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Fair:      { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Poor:      { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtDateTime = iso => iso ? new Date(iso).toLocaleString() : '—';

/* ═══════════ SMALL COMPONENTS ═══════════ */

function Pill({ label, bg, color, border }) {
  return (
    <View style={{ backgroundColor: bg, borderColor: border || bg, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color, letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 20 }}>
      {title && (
        <View style={{ borderBottomWidth: 1, borderBottomColor: C.g100, paddingBottom: 6, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.g400, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

function FieldRow({ label, value }) {
  return (
    <View style={{ backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: C.g200, padding: 12, marginBottom: 8 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: C.g400, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.g900 }}>{value || '—'}</Text>
    </View>
  );
}

/* ═══════════ STATS BAR ═══════════ */
function StatsBar({ reports }) {
  const complete  = reports.filter(r => !!r.checkout).length;
  const awaiting  = reports.filter(r => !r.checkout).length;
  const newDmg    = reports.filter(r => {
    if (!r.checkout) return false;
    const ci = r.issues || [], co = r.checkout.issues || [];
    return co.some(i => !ci.includes(i));
  }).length;
  const stats = [
    { label: 'Total',    value: reports.length, color: C.primary },
    { label: 'Complete', value: complete,        color: '#3b82f6' },
    { label: 'Pending',  value: awaiting,        color: C.warning },
    { label: 'Damage',   value: newDmg,          color: C.danger  },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
      {stats.map(s => (
        <View key={s.label} style={{ flex: 1, backgroundColor: C.white, borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: s.color, borderWidth: 1, borderColor: s.color + '22', elevation: 2 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: s.color }}>{s.value}</Text>
          <Text style={{ fontSize: 10, color: C.g500, fontWeight: '500', marginTop: 2 }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ═══════════ CHECKLIST EDITOR ═══════════ */
function ChecklistEditor({ issues, onChange }) {
  const [customInput, setCustomInput] = useState('');
  const [customItems, setCustomItems] = useState([]);

  const allItems = [...DEFAULT_CHECKLIST, ...customItems];

  const toggle = id => {
    if (issues.includes(id)) onChange(issues.filter(i => i !== id));
    else onChange([...issues, id]);
  };

  const addCustom = () => {
    const t = customInput.trim();
    if (!t) return;
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
    <Section title="Condition Checklist">
      {allItems.map(item => {
        const checked = issues.includes(item.id);
        const isCustom = !DEFAULT_CHECKLIST.find(d => d.id === item.id);
        return (
          <TouchableOpacity key={item.id} onPress={() => toggle(item.id)} style={[styles.checkItem, checked && styles.checkItemActive]}>
            <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
              {checked && <Text style={{ color: C.white, fontSize: 10, fontWeight: '800' }}>✓</Text>}
            </View>
            <Text style={[styles.checkLabel, checked && { color: C.primaryDk, fontWeight: '600' }]}>{item.label}</Text>
            {isCustom && (
              <TouchableOpacity onPress={() => removeCustom(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: C.danger, fontSize: 12, fontWeight: '700', marginLeft: 8 }}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Add custom issue…"
          value={customInput}
          onChangeText={setCustomInput}
          onSubmitEditing={addCustom}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={addCustom} style={[styles.btnPrimary, { paddingHorizontal: 16, marginBottom: 0 }]}>
          <Text style={styles.btnPrimaryText}>Add</Text>
        </TouchableOpacity>
      </View>
    </Section>
  );
}

/* ═══════════ REPORT FORM ═══════════ */
function ReportForm({ initial, subtitle, onSave, onCancel, isCheckout = false, checkinIssues = [] }) {
  const [issues,    setIssues]   = useState(initial?.issues || []);
  const [notes,     setNotes]    = useState(initial?.notes || '');
  const [odometer,  setOdometer] = useState(initial?.odometer || '');
  const [fuelLevel, setFuel]     = useState(initial?.fuelLevel || '');
  const [cRating,   setCRating]  = useState(initial?.conditionRating || '');
  const [dmgCost,   setDmgCost]  = useState(initial?.damageCost || '');

  const newIssues = isCheckout ? issues.filter(i => !checkinIssues.includes(i)) : [];

  const handleSave = () => {
    Alert.alert('Save Report?', 'Are you sure you want to save this condition record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save', onPress: () => onSave({
          issues, notes, odometer, fuelLevel,
          conditionRating: cRating,
          damageCost: dmgCost || undefined,
        })
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {subtitle && <Text style={{ fontSize: 13, color: C.g500, marginBottom: 20 }}>{subtitle}</Text>}

      {/* Vehicle data */}
      <Section title="Vehicle Data">
        <Text style={styles.fieldLabel}>Odometer (km)</Text>
        <TextInput style={styles.input} placeholder="e.g. 45230" keyboardType="numeric" value={odometer} onChangeText={setOdometer} />
        <Text style={styles.fieldLabel}>Fuel Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FUEL_OPTS.map(f => (
              <TouchableOpacity key={f} onPress={() => setFuel(f === fuelLevel ? '' : f)}
                style={[styles.pillBtn, fuelLevel === f && { backgroundColor: C.primary, borderColor: C.primary }]}>
                <Text style={[styles.pillBtnText, fuelLevel === f && { color: C.white }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Section>

      {/* Overall condition */}
      <Section title="Overall Condition">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CONDITION_RATINGS.map(r => {
            const cc = COND_COLORS[r];
            const active = cRating === r;
            return (
              <TouchableOpacity key={r} onPress={() => setCRating(active ? '' : r)}
                style={[styles.pillBtn, active && { backgroundColor: cc.bg, borderColor: cc.border }]}>
                <Text style={[styles.pillBtnText, active && { color: cc.color, fontWeight: '700' }]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Section>

      <ChecklistEditor issues={issues} onChange={setIssues} />

      {/* Damage cost if checkout with new issues */}
      {isCheckout && newIssues.length > 0 && (
        <View style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <Text style={{ color: '#991b1b', fontWeight: '700', fontSize: 13, marginBottom: 10 }}>
            ⚠ {newIssues.length} new issue{newIssues.length > 1 ? 's' : ''} found at check-out
          </Text>
          <Text style={styles.fieldLabel}>Estimated Damage Cost (₱) — optional</Text>
          <TextInput style={[styles.input, { borderColor: '#fca5a5' }]} placeholder="e.g. 5000" keyboardType="numeric" value={dmgCost} onChangeText={setDmgCost} />
        </View>
      )}

      {/* Notes */}
      <Section title="Notes">
        <TextInput style={[styles.input, { height: 88, textAlignVertical: 'top' }]} multiline
          placeholder="Describe the vehicle condition, any observations…" value={notes} onChangeText={setNotes} />
      </Section>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <TouchableOpacity onPress={() => Alert.alert('Discard?', 'Cancel without saving?', [
          { text: 'No' },
          { text: 'Yes, Discard', style: 'destructive', onPress: onCancel },
        ])} style={[styles.btnSecondary, { flex: 1 }]}>
          <Text style={styles.btnSecondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={[styles.btnPrimary, { flex: 2 }]}>
          <Text style={styles.btnPrimaryText}>Save Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ═══════════ DETAIL VIEW ═══════════ */
function DetailView({ report, ownerName, isOwner, onEdit, onAddCheckout, onEditCheckout, onBack, onReply }) {
  const [comment, setComment] = useState('');
  const ciIssues = report.issues || [];
  const coIssues = report.checkout?.issues || [];
  const newDmg   = coIssues.filter(i => !ciIssues.includes(i));

  const getLabelForId = id => {
    const found = DEFAULT_CHECKLIST.find(d => d.id === id);
    return found ? found.label : (report.customLabels?.[id] || id.replace('custom_', '').replace(/_/g, ' '));
  };

  const submitComment = () => {
    if (!comment.trim()) return;
    onReply({ authorName: ownerName || (isOwner ? 'Owner' : 'Renter'), authorRole: isOwner ? 'owner' : 'renter', text: comment.trim() });
    setComment('');
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Back */}
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 15, color: C.primary, fontWeight: '600' }}>← Back to List</Text>
      </TouchableOpacity>

      {/* Status tags */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <Pill label="Check-in" bg="rgba(16,185,129,.1)" color="#059669" border="rgba(16,185,129,.25)" />
        {report.checkout
          ? <Pill label="✓ Trip Complete"      bg={C.primary + '14'} color={C.primary}  border={C.primary + '35'} />
          : <Pill label="⏳ Awaiting Check-out" bg="rgba(245,158,11,.1)" color="#b45309" border="rgba(245,158,11,.3)" />}
        {report.conditionRating && (() => {
          const cc = COND_COLORS[report.conditionRating] || {};
          return <Pill label={report.conditionRating} bg={cc.bg} color={cc.color} border={cc.border} />;
        })()}
        {newDmg.length > 0 && <Pill label={`${newDmg.length} New Damage`} bg="#fef2f2" color="#991b1b" border="#fca5a5" />}
      </View>

      {/* Vehicle & rental info */}
      <View style={{ backgroundColor: C.primaryLt, borderWidth: 1, borderColor: C.primary + '28', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.g400, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Rental Info</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: C.navy, marginBottom: 4 }}>{report.vehicleName}</Text>
        <Text style={{ fontSize: 13, color: C.g500 }}>Renter: <Text style={{ fontWeight: '600', color: C.g700 }}>{report.renterName || '—'}</Text></Text>
        {report.startDate && <Text style={{ fontSize: 13, color: C.g500, marginTop: 2 }}>Period: <Text style={{ fontWeight: '600', color: C.g700 }}>{fmtDate(report.startDate)} → {fmtDate(report.endDate)}</Text></Text>}
        {report.amount && <Text style={{ fontSize: 13, color: C.g500, marginTop: 2 }}>Rate: <Text style={{ fontWeight: '600', color: C.primary }}>₱{report.amount}/day</Text></Text>}
      </View>

      {/* Compare grid: Check-in vs Check-out */}
      {report.checkout ? (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {/* Check-in */}
          <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,.2)', overflow: 'hidden' }}>
            <View style={{ backgroundColor: 'rgba(16,185,129,.08)', padding: '10px 14px', padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,.2)' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#065f46' }}>Check-in</Text>
              <Text style={{ fontSize: 10, color: C.g500 }}>{fmtDate(report.createdAt)}</Text>
            </View>
            <View style={{ padding: 10 }}>
              <Text style={styles.miniLabel}>Odometer</Text><Text style={styles.miniVal}>{report.odometer ? report.odometer + ' km' : '—'}</Text>
              <Text style={styles.miniLabel}>Fuel</Text><Text style={styles.miniVal}>{report.fuelLevel || '—'}</Text>
              {report.conditionRating && <><Text style={styles.miniLabel}>Condition</Text><Text style={styles.miniVal}>{report.conditionRating}</Text></>}
              <Text style={[styles.miniLabel, { marginTop: 8 }]}>Issues</Text>
              {ciIssues.length === 0
                ? <Text style={{ fontSize: 12, color: C.success, fontWeight: '600' }}>✓ None</Text>
                : ciIssues.map(k => <Text key={k} style={{ fontSize: 12, color: C.g700, marginVertical: 1 }}>• {getLabelForId(k)}</Text>)}
            </View>
          </View>
          {/* Check-out */}
          <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,.2)', overflow: 'hidden' }}>
            <View style={{ backgroundColor: 'rgba(245,158,11,.08)', padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(245,158,11,.2)' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400e' }}>Check-out</Text>
              <Text style={{ fontSize: 10, color: C.g500 }}>{fmtDate(report.checkout.createdAt)}</Text>
            </View>
            <View style={{ padding: 10 }}>
              <Text style={styles.miniLabel}>Odometer</Text><Text style={styles.miniVal}>{report.checkout.odometer ? report.checkout.odometer + ' km' : '—'}</Text>
              <Text style={styles.miniLabel}>Fuel</Text><Text style={styles.miniVal}>{report.checkout.fuelLevel || '—'}</Text>
              {report.checkout.conditionRating && <><Text style={styles.miniLabel}>Condition</Text><Text style={styles.miniVal}>{report.checkout.conditionRating}</Text></>}
              <Text style={[styles.miniLabel, { marginTop: 8 }]}>Issues</Text>
              {coIssues.length === 0
                ? <Text style={{ fontSize: 12, color: C.success, fontWeight: '600' }}>✓ None</Text>
                : coIssues.map(k => {
                    const isNew = !ciIssues.includes(k);
                    return (
                      <View key={k} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 1 }}>
                        <Text style={{ fontSize: 12, color: isNew ? '#991b1b' : C.g700 }}>• {getLabelForId(k)}</Text>
                        {isNew && <Text style={{ fontSize: 9, backgroundColor: '#ef4444', color: '#fff', borderRadius: 999, paddingHorizontal: 5, marginLeft: 4, fontWeight: '800' }}>NEW</Text>}
                      </View>
                    );
                  })}
              {report.checkout.damageCost && (
                <Text style={{ fontSize: 12, color: C.danger, fontWeight: '700', marginTop: 6 }}>Damage: ₱{parseFloat(report.checkout.damageCost).toLocaleString()}</Text>
              )}
            </View>
          </View>
        </View>
      ) : (
        /* Check-in only */
        <View style={{ marginBottom: 16 }}>
          <Section title="Check-in Details">
            <FieldRow label="Odometer" value={report.odometer ? report.odometer + ' km' : null} />
            <FieldRow label="Fuel Level" value={report.fuelLevel} />
            {report.conditionRating && <FieldRow label="Condition" value={report.conditionRating} />}
          </Section>
          <Section title="Issues">
            {ciIssues.length === 0
              ? <Text style={{ color: C.success, fontWeight: '600', fontSize: 13 }}>✓ No issues flagged</Text>
              : ciIssues.map(k => (
                  <View key={k} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: C.g50, borderRadius: 8, borderWidth: 1, borderColor: C.g200, marginBottom: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger, marginRight: 8 }} />
                    <Text style={{ fontSize: 13, color: C.g700 }}>{getLabelForId(k)}</Text>
                  </View>
                ))}
          </Section>
          {/* Awaiting checkout banner */}
          <View style={{ backgroundColor: 'rgba(245,158,11,.07)', borderColor: 'rgba(245,158,11,.5)', borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: 13, marginBottom: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: '#92400e', textAlign: 'center', lineHeight: 20 }}>
              ⏳ Awaiting check-out.{'\n'}Record the vehicle condition when the renter returns.
            </Text>
          </View>
        </View>
      )}

      {/* Notes */}
      {(report.notes || report.checkout?.notes) && (
        <Section title="Notes">
          {report.notes && (
            <View style={{ backgroundColor: C.g50, borderWidth: 1, borderColor: C.g200, borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: C.g400, fontWeight: '700', marginBottom: 4 }}>CHECK-IN</Text>
              <Text style={{ fontSize: 13, color: C.g700, lineHeight: 20 }}>{report.notes}</Text>
            </View>
          )}
          {report.checkout?.notes && (
            <View style={{ backgroundColor: C.g50, borderWidth: 1, borderColor: C.g200, borderRadius: 8, padding: 12 }}>
              <Text style={{ fontSize: 11, color: C.g400, fontWeight: '700', marginBottom: 4 }}>CHECK-OUT</Text>
              <Text style={{ fontSize: 13, color: C.g700, lineHeight: 20 }}>{report.checkout.notes}</Text>
            </View>
          )}
        </Section>
      )}

      {/* Signatures */}
      <Section title="Signatures">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.sigBox, { flex: 1 }]}>
            <Text style={styles.sigLabel}>Owner Signature</Text>
            <Text style={styles.sigName}>{report.ownerSignature || '(not provided)'}</Text>
          </View>
          <View style={[styles.sigBox, { flex: 1 }]}>
            <Text style={styles.sigLabel}>Renter Acknowledgement</Text>
            <Text style={styles.sigName}>{report.renterSignature || '(not provided)'}</Text>
          </View>
        </View>
      </Section>

      {/* Comments */}
      <Section title={`Comments${(report.comments || []).length ? ` (${report.comments.length})` : ''}`}>
        {(report.comments || []).length === 0
          ? <Text style={{ color: C.g400, fontSize: 13, marginBottom: 10 }}>No comments yet.</Text>
          : (report.comments || []).map(c => {
              const isOw = c.authorRole === 'owner';
              return (
                <View key={c.id} style={{
                  borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3,
                  borderLeftColor: isOw ? C.primary : '#6366f1',
                  borderWidth: 1, borderColor: isOw ? C.primary + '22' : '#6366f122',
                  backgroundColor: isOw ? C.primary + '05' : 'rgba(99,102,241,.03)',
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isOw ? C.primary : '#4338ca' }}>{c.authorName}</Text>
                    <Text style={{ fontSize: 11, color: C.g400 }}>{fmtDateTime(c.createdAt)}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: C.g700, lineHeight: 18 }}>{c.text}</Text>
                </View>
              );
            })}
        {/* Reply box */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder={isOwner ? 'Reply as owner…' : 'Add a comment…'}
            value={comment} onChangeText={setComment} multiline />
          <TouchableOpacity onPress={submitComment} style={[styles.btnPrimary, { paddingHorizontal: 16, alignSelf: 'flex-end', marginBottom: 0 }]}>
            <Text style={styles.btnPrimaryText}>Send</Text>
          </TouchableOpacity>
        </View>
      </Section>

      {/* Owner action buttons */}
      {isOwner && (
        <View style={{ gap: 10, marginTop: 8 }}>
          <TouchableOpacity onPress={onEdit} style={styles.btnOutline}>
            <Text style={styles.btnOutlineText}>✏️ Edit Check-in</Text>
          </TouchableOpacity>
          {!report.checkout
            ? <TouchableOpacity onPress={onAddCheckout} style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>+ Record Check-out</Text>
              </TouchableOpacity>
            : <TouchableOpacity onPress={onEditCheckout} style={styles.btnOutline}>
                <Text style={styles.btnOutlineText}>✏️ Edit Check-out</Text>
              </TouchableOpacity>}
        </View>
      )}
    </ScrollView>
  );
}

/* ═══════════ MAIN SCREEN ═══════════ */
export default function LogReportScreen() {
  const { user } = useAuth();
  const {
    reports,
    createCheckin,
    editCheckin,
    addCheckoutReport,
    editCheckout,
    removeReport,
    postComment,
  } = useLogReport();

  const isOwner = user?.role === 'owner';

  const [view,    setView]   = useState('list'); // list | detail | add-checkin | edit-checkin | add-checkout | edit-checkout
  const [sel,     setSel]    = useState(null);
  const [search,  setSearch] = useState('');

  // Filter reports by role
  const myReports = useMemo(() => {
    if (isOwner) return reports;
    // Renter sees reports where they are the renter
    return reports.filter(r => r.renterName === user?.fullName || r.renterName === user?.firstName || r.rentalId && true);
  }, [reports, isOwner, user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return myReports;
    const q = search.toLowerCase();
    return myReports.filter(r =>
      r.vehicleName?.toLowerCase().includes(q) ||
      r.renterName?.toLowerCase().includes(q)
    );
  }, [myReports, search]);

  const open = report => { setSel(report); setView('detail'); };
  const backToList = () => { setSel(null); setView('list'); };

  const handleSaveCI = updates => {
    editCheckin(sel.id, updates);
    // Refresh sel
    setSel(prev => ({ ...prev, ...updates }));
    setView('detail');
  };

  const handleAddCO = data => {
    addCheckoutReport(sel.id, data);
    setSel(prev => ({ ...prev, checkout: { ...data, createdAt: new Date().toISOString() } }));
    setView('detail');
  };

  const handleSaveCO = data => {
    editCheckout(sel.id, data);
    setSel(prev => ({ ...prev, checkout: { ...prev.checkout, ...data } }));
    setView('detail');
  };

  const handleDelete = id => {
    Alert.alert('Delete Entry?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { removeReport(id); if (sel?.id === id) backToList(); } },
    ]);
  };

  const handleReply = comment => {
    postComment(sel.id, comment);
    setSel(prev => ({ ...prev, comments: [...(prev.comments || []), { ...comment, id: `cmt-${Date.now()}`, createdAt: new Date().toISOString() }] }));
  };

  /* ── View: Detail ── */
  if (view === 'detail' && sel) {
    return (
      <DetailView
        report={sel}
        ownerName={user?.fullName || user?.firstName}
        isOwner={isOwner}
        onEdit={() => setView('edit-checkin')}
        onAddCheckout={() => setView('add-checkout')}
        onEditCheckout={() => setView('edit-checkout')}
        onBack={backToList}
        onReply={handleReply}
      />
    );
  }

  /* ── View: Edit check-in ── */
  if (view === 'edit-checkin' && sel) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderTitle}>Edit Check-in</Text>
        </View>
        <ReportForm
          initial={sel}
          subtitle="Update the check-in condition record."
          onSave={handleSaveCI}
          onCancel={() => setView('detail')}
        />
      </View>
    );
  }

  /* ── View: Add checkout ── */
  if (view === 'add-checkout' && sel) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderTitle}>Record Check-out</Text>
        </View>
        <ReportForm
          initial={{ ...sel, issues: [], notes: '', odometer: '', fuelLevel: '', conditionRating: '' }}
          subtitle="Record the vehicle condition upon return."
          isCheckout
          checkinIssues={sel.issues || []}
          onSave={handleAddCO}
          onCancel={() => setView('detail')}
        />
      </View>
    );
  }

  /* ── View: Edit checkout ── */
  if (view === 'edit-checkout' && sel) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.subHeader}>
          <Text style={styles.subHeaderTitle}>Edit Check-out</Text>
        </View>
        <ReportForm
          initial={{ ...sel.checkout, vehicleName: sel.vehicleName }}
          subtitle="Update the check-out condition record."
          isCheckout
          checkinIssues={sel.issues || []}
          onSave={handleSaveCO}
          onCancel={() => setView('detail')}
        />
      </View>
    );
  }

  /* ── View: List ── */
  return (
    <View style={{ flex: 1, backgroundColor: '#edf1f7' }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Log Book</Text>
          <Text style={styles.headerSub}>
            {isOwner ? 'Vehicle condition records' : 'Your rental condition reports'}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <StatsBar reports={myReports} />

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput}
            placeholder="Search by vehicle or renter…"
            placeholderTextColor={C.g400}
            value={search} onChangeText={setSearch}
          />
        </View>

        {/* Empty */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
            <Text style={styles.emptyTitle}>No log entries yet</Text>
            <Text style={styles.emptySub}>
              {isOwner
                ? 'Use "Record to Log Book" on an approved rental to create a log entry.'
                : 'Your rental condition reports will appear here.'}
            </Text>
          </View>
        ) : (
          filtered.slice().reverse().map(r => {
            const ciIssues = r.issues || [];
            const coIssues = r.checkout?.issues || [];
            const newDmg   = r.checkout ? coIssues.filter(i => !ciIssues.includes(i)) : [];
            return (
              <TouchableOpacity key={r.id} onPress={() => open(r)} style={styles.logCard} activeOpacity={0.85}>
                <View style={{ flex: 1 }}>
                  {/* Tags */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                    <Pill label="Check-in" bg="rgba(16,185,129,.1)" color="#059669" border="rgba(16,185,129,.25)" />
                    {r.checkout
                      ? <Pill label="✓ Complete"  bg={C.primary + '14'} color={C.primary}  border={C.primary + '35'} />
                      : <Pill label="⏳ Pending"  bg="rgba(245,158,11,.1)" color="#b45309" border="rgba(245,158,11,.3)" />}
                    {newDmg.length > 0 && <Pill label={`${newDmg.length} New Damage`} bg="#fef2f2" color="#991b1b" border="#fca5a5" />}
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: C.navy, marginBottom: 4 }}>{r.vehicleName}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    <Text style={{ fontSize: 12, color: C.g500 }}>{fmtDate(r.createdAt)}</Text>
                    {ciIssues.length > 0
                      ? <Text style={{ fontSize: 12, color: '#b45309', fontWeight: '600' }}>⚠ {ciIssues.length} issue{ciIssues.length > 1 ? 's' : ''}</Text>
                      : <Text style={{ fontSize: 12, color: C.success, fontWeight: '600' }}>✓ Clean</Text>}
                    <Text style={{ fontSize: 12, color: C.g500 }}>👤 {r.renterName || '—'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {isOwner && (
                    <TouchableOpacity onPress={e => { e && e.stopPropagation?.(); handleDelete(r.id); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ color: C.danger, fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={{ fontSize: 18, color: C.g400 }}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
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
  subHeader: {
    backgroundColor: C.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  subHeaderTitle: { fontSize: 18, fontWeight: '800', color: C.white },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
    borderRadius: 10, borderWidth: 1, borderColor: C.g200, paddingHorizontal: 12, marginBottom: 14,
  },
  searchIcon:  { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.g900 },
  logCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: C.g200, elevation: 2,
  },
  empty: { alignItems: 'center', padding: 50, backgroundColor: C.g50, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.g200 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.g700, marginBottom: 8 },
  emptySub:   { fontSize: 13, color: C.g400, textAlign: 'center' },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderWidth: 1, borderColor: C.g200, borderRadius: 8, marginBottom: 6,
    backgroundColor: C.g50,
  },
  checkItemActive: { borderColor: C.primary + '55', backgroundColor: C.primary + '08' },
  checkBox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: C.g300,
    alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0,
  },
  checkBoxActive: { backgroundColor: C.primary, borderColor: C.primary },
  checkLabel: { flex: 1, fontSize: 13, color: C.g700 },
  input: {
    width: '100%', padding: 12, borderWidth: 1.5, borderColor: C.g200,
    borderRadius: 10, fontSize: 14, color: C.g900, backgroundColor: C.white, marginBottom: 14,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: C.g400, marginBottom: 6 },
  pillBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: C.g200, backgroundColor: C.white,
  },
  pillBtnText: { fontSize: 13, fontWeight: '600', color: C.g500 },
  btnPrimary: {
    backgroundColor: C.primary, borderRadius: 10, paddingVertical: 13,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', elevation: 3,
  },
  btnPrimaryText: { color: C.white, fontSize: 14, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: C.g100, borderRadius: 10, paddingVertical: 13,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.g200,
  },
  btnSecondaryText: { color: C.g700, fontSize: 14, fontWeight: '600' },
  btnOutline: {
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.white,
  },
  btnOutlineText: { color: C.primary, fontSize: 14, fontWeight: '600' },
  miniLabel: { fontSize: 10, color: C.g400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  miniVal:   { fontSize: 12, color: C.g700, fontWeight: '600', marginBottom: 2 },
  sigBox: {
    backgroundColor: C.g50, borderRadius: 10, borderWidth: 1, borderColor: C.g200, padding: 12,
    borderTopWidth: 3, borderTopColor: C.primary,
  },
  sigLabel: { fontSize: 10, color: C.g400, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  sigName:  { fontSize: 14, color: C.g700, fontWeight: '600', fontStyle: 'italic' },
});