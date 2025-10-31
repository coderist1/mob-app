
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { boardingHouses } from '../../data/mockData';

export default function LandlordPortal() {
  const [listings, setListings] = useState(boardingHouses);

  const handleDeleteListing = (id) => {
    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => setListings(currentListings => currentListings.filter(listing => listing.id !== id)),
          style: "destructive" 
        }
      ]
    );
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Manage your properties and inquiries</Text>
        </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Feather name="list" size={22} color={Colors.primary} />
          <Text style={styles.statValue}>{listings.length}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="message-square" size={22} color={Colors.primary} />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Inquiries</Text>
        </View>
        <View style={styles.statCard}>
          <Feather name="home" size={22} color={Colors.primary} />
          <Text style={styles.statValue}>89%</Text>
          <Text style={styles.statLabel}>Occupancy</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Listings</Text>
      <View style={styles.listingsRow}>
        {listings.map((listing) => (
          <View key={listing.id} style={styles.card}>
            <TouchableOpacity style={styles.cardClickable} onPress={() => router.push('/landlord/create-listing')}>
              <Image source={{ uri: listing.images[0] }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{listing.name}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{listing.location}</Text>
                <Text style={styles.cardPrice}>₱{listing.price.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteListing(listing.id)}>
                <Feather name="trash-2" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/landlord/create-listing')}>
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f7fb' },
  container: { padding: 12 },
  header: { 
    marginBottom: 24 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#1a202c' 
  },
  subtitle: { color: '#666', marginTop: 4, fontSize: 16 },
  primaryBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary, 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 12 
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 24,
    gap: 12,
  },
  statCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2,
    alignItems: 'center',
    gap: 8,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  statLabel: { color: '#666', fontSize: 12, fontWeight: '500' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1a202c' },
  listingsRow: { },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2,
  },
  cardClickable: {
    flexDirection: 'row',
    flex: 1,
  },
  cardImage: { width: 100, height: 100 },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a202c' },
  cardSub: { color: '#777', marginTop: 4 },
  cardPrice: { marginTop: 8, color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  cardActions: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});