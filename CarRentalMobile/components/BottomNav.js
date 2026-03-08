// components/BottomNav.js
// NO SVG — uses only core RN primitives so nothing can silently crash.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

const PRIMARY = '#3F9B84';
const G400    = '#9ca3af';
const WHITE   = '#ffffff';
const DANGER  = '#ef4444';

const OWNER_TABS = [
  { key: 'home',    label: 'Home',     icon: '🏠' },
  { key: 'rentals', label: 'Rentals',  icon: '📋' },
  { key: 'add',     label: 'Add',      icon: '+',  isFab: true },
  { key: 'logbook', label: 'Log Book', icon: '📖' },
  { key: 'profile', label: 'Profile',  icon: '👤' },
];

const RENTER_TABS = [
  { key: 'home',     label: 'Home',     icon: '🏠' },
  { key: 'bookings', label: 'Bookings', icon: '📋' },
  { key: 'logbook',  label: 'Log Book', icon: '📖' },
  { key: 'profile',  label: 'Profile',  icon: '👤' },
];

export default function BottomNav({ role = 'owner', activeTab, onTabPress, badges = {} }) {
  const tabs = role === 'owner' ? OWNER_TABS : RENTER_TABS;

  return (
    <View style={st.container}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const badge    = badges[tab.key];

        if (tab.isFab) {
          return (
            <TouchableOpacity key={tab.key} style={st.fabWrap} onPress={() => onTabPress(tab.key)} activeOpacity={0.85}>
              <View style={st.fab}>
                <Text style={st.fabIcon}>+</Text>
              </View>
              <Text style={st.fabLabel}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={tab.key} style={st.tabItem} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
            {isActive && <View style={st.activePill} />}
            <View style={st.iconWrap}>
              <Text style={st.tabIcon}>{tab.icon}</Text>
              {!!badge && badge > 0 && (
                <View style={st.badge}>
                  <Text style={st.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
            <Text style={[st.label, isActive && st.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   WHITE,
    borderTopWidth:    1,
    borderTopColor:    '#e5e7eb',
    paddingBottom:     Platform.OS === 'ios' ? 24 : 12,
    paddingTop:        10,
    paddingHorizontal: 4,
    elevation:         16,
    shadowColor:       '#000',
    shadowOpacity:     0.08,
    shadowRadius:      12,
    shadowOffset:      { width: 0, height: -3 },
    minHeight:         Platform.OS === 'ios' ? 82 : 64,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 6, position: 'relative',
  },
  activePill: {
    position: 'absolute', top: 0,
    width: 32, height: 3, borderRadius: 2,
    backgroundColor: PRIMARY,
  },
  iconWrap:  { position: 'relative', marginBottom: 2 },
  tabIcon:   { fontSize: 22, textAlign: 'center' },
  label:     { fontSize: 10, color: G400, fontWeight: '500', marginTop: 1, textAlign: 'center' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
  badge: {
    position: 'absolute', top: -4, right: -8,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: WHITE,
  },
  badgeText: { fontSize: 9, color: WHITE, fontWeight: '800' },
  fabWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
    marginTop: -22, marginBottom: 2,
    elevation: 10,
    shadowColor: PRIMARY, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  fabIcon:  { fontSize: 30, color: WHITE, fontWeight: '300', lineHeight: 34, textAlign: 'center' },
  fabLabel: { fontSize: 10, color: PRIMARY, fontWeight: '700', textAlign: 'center' },
});