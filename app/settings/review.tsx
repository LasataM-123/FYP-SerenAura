import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Star, User } from 'lucide-react-native';

import Top from '@/components/top';
// Ensure these paths match your folder structure
import { getReviewsByCounselor, Review, GetReviewsResponse } from '@/lib/api/review'; 
import { useBackend } from '@/lib/useBackend';
import { useAuthStore } from '@/store/authStore';

/* =========================
   CONSTANTS & THEME
========================= */
const COLORS = {
  border: '#553434',
  text: '#553434',
  bg: '#fff',
  ratingBg: '#FFF3B0',
  cardBg: '#F5EFFF',
};

const FONTS = {
  bold: 'KodchasanSemiBold',
  medium: 'KodchasanMedium',
  regular: 'KodchasanRegular',
};

/* =========================
   COMPONENTS
========================= */

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const date = review.reviewDate 
    ? new Date(review.reviewDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) 
    : 'Recent';

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.shadowLayer} />
      <View style={styles.reviewBox}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarBorder}>
              {review.patientId?.profileUrl ? (
                <Image 
                  source={{ uri: review.patientId.profileUrl }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <User size={20} color={COLORS.border} />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.patientName}>{review.patientId?.name || "Anonymous User"}</Text>
              <Text style={styles.dateText}>{date}</Text>
            </View>
          </View>

          <View style={styles.starBadge}>
            <Star size={14} color="#F5A623" fill="#F5A623" />
            <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.reviewText}>{review.text}</Text>
      </View>
    </View>
  );
};

/* =========================
   MAIN SCREEN
========================= */
const CounselorReviews: React.FC = () => {
  const counselorId = useAuthStore((state)=>state.userId);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);

  // Passing the Response type to useBackend for type safety
  const { refetch, loading } = useBackend({
    fn: () => getReviewsByCounselor(counselorId??""),
  });

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') StatusBar.setBackgroundColor('#fff');
    
    loadReviews();
  }, [counselorId]);

  const loadReviews = async () => {
    try {
      const res = await refetch();
      if (res?.success) {
        setReviews(res.reviews || []);
        setAvgRating(res.averageRating || 0);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <Top label="User Reviews" onBack={() => router.back()} />
        {/* Rating Summary Card */}
        <View style={styles.summaryContainer}>
          <View style={styles.shadowLayer} />
          <View style={styles.summaryBox}>
            <View style={styles.ratingCircle}>
              <Text style={styles.bigRating}>{avgRating.toFixed(1)}</Text>
              <Star size={24} color="#F5A623" fill="#F5A623" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Overall Rating</Text>
              <Text style={styles.summarySub}>{reviews.length} total reviews</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Patient Feedback</Text>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.border} />
          </View>
        ) : reviews.length > 0 ? (
          <View style={styles.listGap}>
            {reviews.map((item) => (
              <ReviewCard key={item._id} review={item} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.infoText}>This counselor doesn't have any reviews yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CounselorReviews;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 30,
    marginBottom: 16,
  },
  
  /* Summary Section */
  summaryContainer: { marginTop: 20, position: 'relative' },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ratingBg,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: COLORS.border,
    padding: 20,
    zIndex: 1,
  },
  ratingCircle: {
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigRating: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
  summaryInfo: { marginLeft: 16 },
  summaryTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  summarySub: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, opacity: 0.7 },

  /* Review List & Cards */
  listGap: { gap: 24 },
  cardWrapper: { position: 'relative' },
  shadowLayer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: COLORS.border,
    borderRadius: 20,
  },
  reviewBox: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.border,
    padding: 16,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  patientName: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },
  dateText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text, opacity: 0.6 },
  
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.text, marginLeft: 4 },
  reviewText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  
  loaderContainer: { marginTop: 50, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  infoText: { fontFamily: FONTS.medium, color: COLORS.text, fontSize: 14, textAlign: 'center' },
});