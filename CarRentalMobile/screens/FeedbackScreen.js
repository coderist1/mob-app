// screens/FeedbackScreen.js
// Enhanced Feedback & Reviews - exchange feedback between owner and renter

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
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useFeedback } from '../context/FeedbackContext';
import ProfileAvatar from '../components/ProfileAvatar';

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

const formatDate = (dateStr, format = 'short') => {
  const date = new Date(dateStr);
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysBetween = (start, end) => {
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
};

const StarRating = ({ rating, size = 16, onPress }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.starRatingContainer}>
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress?.(star)}
          disabled={!onPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.starIcon, { fontSize: size }, rating >= star && styles.starActive]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

function RentalHistoryCard({ booking, feedback = [], userRole, onLeaveFeedback }) {
  const days = getDaysBetween(booking.startDate, booking.endDate);
  const otherParty = userRole === 'renter'
    ? { name: booking.ownerName, email: booking.ownerEmail }
    : { name: booking.renterName, email: booking.renterEmail };

  const hasFeedback = feedback.length > 0;
  const avgRating = hasFeedback 
    ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1)
    : null;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return { bg: C.primaryLighter, text: C.primary };
      case 'approved':
        return { bg: '#E3FCF2', text: C.success };
      case 'pending':
        return { bg: '#FFF3E0', text: C.warning };
      default:
        return { bg: C.gray100, text: C.gray600 };
    }
  };
  const statusStyle = getStatusStyle(booking.status);

  return (
    <View style={styles.rentalCard}>
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
          <Text style={styles.vehicleMeta}>{booking.vehicleModel} • {booking.year || '2024'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {booking.status === 'completed' ? 'Completed' : booking.status === 'approved' ? 'Active' : booking.status === 'pending' ? 'Pending' : 'Rejected'}
          </Text>
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.participantRow}>
          <Text style={styles.participantLabel}>{userRole === 'renter' ? 'Owner' : 'Renter'}</Text>
          <Text style={styles.participantName}>{otherParty.name || 'N/A'}</Text>
        </View>
        <View style={styles.datePriceRow}>
          <View style={styles.dateChip}>
            <Text style={styles.dateText}>
              {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
            </Text>
            <Text style={styles.durationText}> • {days} {days === 1 ? 'day' : 'days'}</Text>
          </View>
          <Text style={styles.priceText}>₱{booking.totalPrice.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.feedbackSection}>
        <View style={styles.feedbackHeaderRow}>
          <Text style={styles.feedbackTitle}>Reviews & Feedback</Text>
          {hasFeedback && avgRating && (
            <View style={styles.ratingChip}>
              <StarRating rating={parseInt(avgRating)} size={12} />
              <Text style={styles.ratingValue}>{avgRating}</Text>
            </View>
          )}
        </View>

        {hasFeedback ? (
          <View style={styles.feedbackList}>
            {feedback.map((fb, idx) => (
              <View key={fb.id || idx} style={styles.feedbackItem}>
                <View style={styles.feedbackItemHeader}>
                  <Text style={styles.feedbackAuthor}>
                    {fb.fromUserRole === 'owner' ? 'Owner' : 'Renter'}
                  </Text>
                  <StarRating rating={fb.rating || 0} size={12} />
                  <Text style={styles.feedbackDate}>
                    {formatDate(fb.createdAt, 'full')}
                  </Text>
                </View>
                <Text style={styles.feedbackMessage}>{fb.message}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noFeedbackContainer}>
            <Text style={styles.noFeedbackText}>No feedback yet</Text>
            <Text style={styles.noFeedbackSubtext}>Be the first to share your experience</Text>
          </View>
        )}

        {booking.status === 'completed' && (
          <TouchableOpacity 
            style={styles.addFeedbackBtn}
            onPress={() => onLeaveFeedback(booking)}
          >
            <Text style={styles.addFeedbackBtnText}>Write a Review</Text>
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
      Alert.alert('Missing Info', 'Please share your feedback message.');
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
    Alert.alert('Thank You', 'Your feedback has been submitted successfully.');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share Your Experience</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {booking && (
              <>
                <View style={styles.modalBookingCard}>
                  <Text style={styles.modalVehicleName}>{booking.vehicleName}</Text>
                  <Text style={styles.modalDateRange}>
                    {formatDate(booking.startDate, 'full')} → {formatDate(booking.endDate, 'full')}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Your Rating</Text>
                  <StarRating rating={rating} size={32} onPress={setRating} />
                  <Text style={styles.ratingHint}>
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating <= 2 ? 'Needs improvement' : ''}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Feedback Type</Text>
                  <View style={styles.typeSelector}>
                    {[
                      { key: 'general', label: 'General' },
                      { key: 'praise', label: 'Praise' },
                      { key: 'complaint', label: 'Complaint' },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.key}
                        style={[
                          styles.typeOption,
                          feedbackType === type.key && styles.typeOptionActive,
                        ]}
                        onPress={() => setFeedbackType(type.key)}
                      >
                        <Text style={[
                          styles.typeOptionText,
                          feedbackType === type.key && styles.typeOptionTextActive,
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>Your Message</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="What was your experience like?"
                    placeholderTextColor={C.gray500}
                    multiline={true}
                    numberOfLines={5}
                    value={message}
                    onChangeText={setMessage}
                  />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitBtnText}>Submit Feedback</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export default function FeedbackScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookings, refreshBookings } = useBookings();
  const { addFeedback, refreshFeedback, getRentalHistoryWithFeedback } = useFeedback();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

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

  const filteredHistory = useMemo(() => {
    if (activeFilter === 'all') return rentalHistory;
    if (activeFilter === 'completed') return rentalHistory.filter((b) => b.status === 'completed');
    if (activeFilter === 'with-feedback') return rentalHistory.filter((b) => (b.feedback || []).length > 0);
    if (activeFilter === 'needs-feedback') return rentalHistory.filter((b) => b.status === 'completed' && (b.feedback || []).length === 0);
    return rentalHistory;
  }, [rentalHistory, activeFilter]);

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

  const filters = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'completed', label: 'Completed', count: stats.completed, color: C.success },
    { key: 'with-feedback', label: 'With Reviews', count: stats.withFeedback, color: C.primary },
    { key: 'needs-feedback', label: 'Need Review', count: stats.completed - stats.withFeedback, color: C.warning },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header with Back Button - No Background Color */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Feedback & Reviews</Text>
          <Text style={styles.headerSubtitle}>Share your experience and help others</Text>
        </View>
        <ProfileAvatar size={40} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.primary]} />}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroBadge}>VOICE YOUR EXPERIENCE</Text>
          <Text style={styles.heroTitle}>Every trip tells a story</Text>
          <Text style={styles.heroSubtitle}>
            Your honest feedback helps owners improve and future renters make better choices.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {filters.map(stat => (
            <TouchableOpacity 
              key={stat.key}
              style={[styles.statCard, activeFilter === stat.key && styles.statCardActive]}
              onPress={() => setActiveFilter(stat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statValue, { color: stat.color || C.gray700 }]}>{stat.count}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No rentals found</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'needs-feedback' 
                ? "You don't have any completed rentals waiting for feedback."
                : "Your rental history will appear here."}
            </Text>
          </View>
        ) : (
          filteredHistory.map((booking) => (
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

const styles = StyleSheet.create({
  safeArea: {
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

  // Header with Back Button - No Background Color
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
    marginBottom: 20,
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

  filterScroll: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.gray300,
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.gray700,
  },
  filterChipTextActive: {
    color: C.white,
  },

  rentalCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '800',
    color: C.navy,
  },
  vehicleMeta: {
    fontSize: 13,
    color: C.gray600,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    padding: 16,
    paddingTop: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  participantLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.gray600,
    marginRight: 8,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.navy,
  },
  datePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 12,
    color: C.gray700,
  },
  durationText: {
    fontSize: 12,
    color: C.gray500,
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.primary,
  },

  feedbackSection: {
    backgroundColor: C.gray50,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: C.gray100,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.navy,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
  feedbackList: {
    gap: 12,
    marginBottom: 12,
  },
  feedbackItem: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  feedbackItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  feedbackAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },
  feedbackDate: {
    fontSize: 10,
    color: C.gray500,
  },
  feedbackMessage: {
    fontSize: 13,
    color: C.gray800,
    lineHeight: 18,
  },
  noFeedbackContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFeedbackText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.gray600,
  },
  noFeedbackSubtext: {
    fontSize: 12,
    color: C.gray500,
    marginTop: 4,
  },
  addFeedbackBtn: {
    backgroundColor: C.primaryLight,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addFeedbackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
  },

  starRatingContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starIcon: {
    color: C.gray400,
    marginHorizontal: 2,
  },
  starActive: {
    color: '#FFB800',
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
    paddingHorizontal: 32,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  modalCloseBtn: {
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: C.gray600,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.navy,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalBookingCard: {
    backgroundColor: C.primaryLighter,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalVehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: C.primary,
  },
  modalDateRange: {
    fontSize: 13,
    color: C.gray700,
    marginTop: 4,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.gray800,
    marginBottom: 12,
  },
  ratingHint: {
    fontSize: 12,
    color: C.gray500,
    marginTop: 8,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    backgroundColor: C.gray100,
    paddingVertical: 12,
    borderRadius: 40,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: C.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.gray700,
  },
  typeOptionTextActive: {
    color: C.white,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: C.gray300,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: C.gray900,
    textAlignVertical: 'top',
    minHeight: 120,
    backgroundColor: C.white,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 30,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
  },
});