// screens/FeedbackScreen.js
// Feedback & Reviews - exchange feedback between owner and renter
// Shows rental history with associated feedback and ratings

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useFeedback } from '../context/FeedbackContext';

const C = {
  primary: '#3F9B84',
  primaryDk: '#2d7a67',
  primaryLt: '#ecfdf5',
  navy: '#1a2c5e',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  g50: '#f9fafb',
  g100: '#f3f4f6',
  g200: '#e5e7eb',
  g300: '#d1d5db',
  g400: '#9ca3af',
  g500: '#6b7280',
  g700: '#374151',
  g900: '#111827',
  white: '#ffffff',
};

function RentalHistoryCard({ booking, feedback = [], userRole, onLeaveFeedback }) {
  const days = Math.max(0, Math.round((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000));
  const dailyRate = days > 0 ? Math.round(booking.totalPrice / days) : 0;

  const otherParty = userRole === 'renter'
    ? { name: booking.ownerName, email: booking.ownerEmail }
    : { name: booking.renterName, email: booking.renterEmail };

  const hasFeedback = feedback.length > 0;
  const avgRating = hasFeedback 
    ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1)
    : 'N/A';

  const badgeColors = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    approved: { bg: '#d1fae5', text: '#065f46' },
    completed: { bg: '#dbeafe', text: '#1e40af' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
  };

  const badge = badgeColors[booking.status] || badgeColors.pending;

  return (
    <View style={s.rentalCard}>
      {/* Header */}
      <View style={s.rentalHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.vehicleName}>{booking.vehicleName}</Text>
          <Text style={s.modelInfo}>{booking.vehicleModel} • {booking.year || ''}</Text>
          <Text style={s.partyName}>
            {userRole === 'renter' ? '👤 Owner: ' : '👤 Renter: '}
            {otherParty.name || 'N/A'}
          </Text>
        </View>
        <View style={[s.badgeContainer, { backgroundColor: badge.bg }]}>
          <Text style={[s.badgeText, { color: badge.text }]}>
            {booking.status === 'pending' ? 'Pending' : booking.status === 'approved' ? 'Active' : booking.status === 'completed' ? 'Done' : 'Rejected'}
          </Text>
        </View>
      </View>

      {/* Date & Price */}
      <View style={s.datePrice}>
        <Text style={s.dateText}>
          📅 {new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' → '}
          {new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Text style={s.priceText}>₱{booking.totalPrice.toLocaleString()} ({days}d)</Text>
      </View>

      {/* Feedback Section */}
      <View style={s.feedbackSection}>
        <Text style={s.feedbackLabel}>Reviews & Feedback</Text>
        
        {hasFeedback ? (
          <View style={s.feedbackList}>
            {feedback.map((fb) => (
              <View key={fb.id} style={s.feedbackItem}>
                <View style={s.feedbackHeader}>
                  <Text style={s.feedbackFrom}>
                    {fb.fromUserRole === 'owner' ? '🏢 Owner' : '👤 Renter'}
                  </Text>
                  <Text style={s.feedbackRating}>{'⭐'.repeat(Math.round(fb.rating || 0))}</Text>
                </View>
                <Text style={s.feedbackMessage}>{fb.message}</Text>
                <Text style={s.feedbackDate}>
                  {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.noFeedback}>No feedback yet</Text>
        )}

        {booking.status === 'completed' && (
          <TouchableOpacity 
            style={s.btnAddFeedback}
            onPress={() => onLeaveFeedback(booking)}
          >
            <Text style={s.btnAddFeedbackText}>+ Leave Feedback</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function FeedbackModal({ visible, booking, userRole, userEmail, onSubmit, onClose }) {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');

  const handleSubmit = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    onSubmit({
      bookingId: booking.id,
      fromUserEmail: userEmail,
      fromUserRole: userRole,
      toUserEmail: userRole === 'renter' ? booking.ownerEmail : booking.renterEmail,
      toUserRole: userRole === 'renter' ? 'owner' : 'renter',
      rating,
      message: message.trim(),
      type: feedbackType,
    });

    setMessage('');
    setRating(5);
    setFeedbackType('general');
    onClose();
    Alert.alert('Success', 'Feedback submitted successfully!');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.btnClose}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>Leave Feedback</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
          {booking && (
            <>
              <Text style={s.modalLabel}>For:</Text>
              <View style={s.bookingInfo}>
                <Text style={s.infoText}>{booking.vehicleName}</Text>
                <Text style={s.infoSubtext}>
                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                </Text>
              </View>

              {/* Rating */}
              <Text style={s.modalLabel}>Rating</Text>
              <View style={s.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={s.starButton}
                  >
                    <Text style={[s.star, rating >= star && s.starActive]}>⭐</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback Type */}
              <Text style={s.modalLabel}>Feedback Type</Text>
              <View style={s.typeContainer}>
                {['general', 'praise', 'complaint'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[s.typeButton, feedbackType === type && s.typeButtonActive]}
                    onPress={() => setFeedbackType(type)}
                  >
                    <Text style={[s.typeButtonText, feedbackType === type && s.typeButtonTextActive]}>
                      {type === 'general' ? '💬 General' : type === 'praise' ? '👍 Praise' : '⚠️ Complaint'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message */}
              <Text style={s.modalLabel}>Your Feedback</Text>
              <TextInput
                style={s.messageInput}
                placeholder="Share your experience..."
                placeholderTextColor={C.g400}
                multiline={true}
                numberOfLines={5}
                value={message}
                onChangeText={setMessage}
              />

              {/* Submit Button */}
              <TouchableOpacity style={s.btnSubmitFeedback} onPress={handleSubmit}>
                <Text style={s.btnSubmitFeedbackText}>📤 Submit Feedback</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function FeedbackScreen() {
  const { user } = useAuth();
  const { bookings, refreshBookings } = useBookings();
  const { addFeedback, refreshFeedback, getRentalHistoryWithFeedback } = useFeedback();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshBookings(), refreshFeedback()]);
    setRefreshing(false);
  };

  useFocusEffect(React.useCallback(() => {
    handleRefresh();
  }, []));

  const rentalHistory = useMemo(() => {
    return getRentalHistoryWithFeedback(user?.email, user?.role, bookings).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [user, bookings, getRentalHistoryWithFeedback]);

  const stats = useMemo(() => ({
    total: rentalHistory.length,
    completed: rentalHistory.filter(b => b.status === 'completed').length,
    withFeedback: rentalHistory.filter(b => b.feedback && b.feedback.length > 0).length,
  }), [rentalHistory]);

  const handleLeaveFeedback = (booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  const handleSubmitFeedback = (feedbackData) => {
    addFeedback(feedbackData);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Feedback & Reviews</Text>
        <Text style={s.headerSubtitle}>Your rental history and feedback</Text>
      </View>

      <ScrollView
        style={s.content}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Total Rentals', value: stats.total, color: C.primary },
            { label: 'Completed', value: stats.completed, color: C.success },
            { label: 'With Feedback', value: stats.withFeedback, color: C.warning },
          ].map((stat) => (
            <View key={stat.label} style={[s.statCard, { borderLeftColor: stat.color }]}>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Rental History */}
        {rentalHistory.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTitle}>No rental history</Text>
            <Text style={s.emptySubtitle}>Your completed rentals will appear here</Text>
          </View>
        ) : (
          rentalHistory.map((booking) => (
            <RentalHistoryCard
              key={booking.id}
              booking={booking}
              feedback={booking.feedback || []}
              userRole={user?.role}
              onLeaveFeedback={handleLeaveFeedback}
            />
          ))
        )}
      </ScrollView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={modalVisible}
        booking={selectedBooking}
        userRole={user?.role}
        userEmail={user?.email}
        onSubmit={handleSubmitFeedback}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.g50,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.g200,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.navy,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.g500,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: C.g500,
    marginTop: 4,
  },
  rentalCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.g200,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.navy,
  },
  modelInfo: {
    fontSize: 12,
    color: C.g500,
    marginTop: 2,
  },
  partyName: {
    fontSize: 13,
    color: C.g600,
    marginTop: 6,
    fontWeight: '500',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  datePrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.g200,
  },
  dateText: {
    fontSize: 12,
    color: C.g600,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  feedbackSection: {
    marginTop: 8,
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.navy,
    marginBottom: 8,
  },
  feedbackList: {
    marginBottom: 10,
  },
  feedbackItem: {
    backgroundColor: C.g50,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedbackFrom: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
  feedbackRating: {
    fontSize: 12,
  },
  feedbackMessage: {
    fontSize: 12,
    color: C.g700,
    lineHeight: 16,
    marginBottom: 6,
  },
  feedbackDate: {
    fontSize: 10,
    color: C.g400,
  },
  noFeedback: {
    fontSize: 12,
    color: C.g400,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  btnAddFeedback: {
    backgroundColor: C.primaryLt,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.primary,
  },
  btnAddFeedbackText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.navy,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.g500,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: C.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.g200,
  },
  btnClose: {
    fontSize: 14,
    color: C.g500,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.navy,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.navy,
    marginTop: 16,
    marginBottom: 8,
  },
  bookingInfo: {
    backgroundColor: C.g50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.navy,
  },
  infoSubtext: {
    fontSize: 12,
    color: C.g500,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 28,
    opacity: 0.3,
  },
  starActive: {
    opacity: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.g300,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  typeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.g600,
  },
  typeButtonTextActive: {
    color: C.white,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: C.g300,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: C.navy,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  btnSubmitFeedback: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 32,
  },
  btnSubmitFeedbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
  },
});
