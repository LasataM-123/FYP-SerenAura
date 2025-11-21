import { 
  Animated,
  Dimensions, 
  Image, 
  StyleSheet, 
  Text, 
  TouchableWithoutFeedback, 
  View 
} from "react-native";
import React, { useRef } from "react";
import Button from "@/components/Button";
import { UserRound, Hourglass, Stethoscope } from "lucide-react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { images } from "@/constants";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.40; // exactly like CounselorCard
const BORDER_COLOR = "#553434";

type ChatHistoryProps = {
  chatId: string;
  patientName: string;
  counselorName: string;
  profileUrl?: string;
  speciality?: string;
  experience?: number;
  appointmentDate: string;
  endTime: string;
};

const ChatHistoryCard: React.FC<ChatHistoryProps> = ({
  chatId,
  patientName,
  counselorName,
  profileUrl,
  speciality,
  experience,
  appointmentDate,
  endTime,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const role = useAuthStore.getState().role;
  const historyId = chatId;

  const formatAMPM = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const daysAgoFrom = (dateString: string): string => {
    const past = new Date(dateString);
    if (isNaN(past.getTime())) return "";
    const seconds = Math.floor((Date.now() - past.getTime()) / 1000);

    const intervals: Record<string, number> = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const key in intervals) {
      const interval = Math.floor(seconds / intervals[key]);
      if (interval >= 1) return `${interval} ${key}${interval > 1 ? "s" : ""} ago`;
    }
    return "just now";
  };

  const daysAgoEnd = daysAgoFrom(endTime);
  const appointmentTime = formatAMPM(appointmentDate);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 4, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>

        {/* Shadow border */}
        <View style={styles.shadowLayer} />

        <View style={styles.card}>
          
          {/* Profile Image */}
          <View style={styles.imageWrapper}>
            <View style={styles.imageShadow} />
            <Image
              source={profileUrl ? { uri: profileUrl } : images.Avatar}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>

            {role === "counselor" ? (
              <>
                <View style={styles.infoRow}>
                  <UserRound size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>{patientName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Hourglass size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>{appointmentTime}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <UserRound size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>{counselorName}</Text>
                </View>

                {speciality && (
                  <View style={styles.infoRow}>
                    <Stethoscope size={18} color={BORDER_COLOR} />
                    <Text style={styles.infoText}>{speciality}</Text>
                  </View>
                )}

                {experience !== undefined && (
                  <View style={styles.infoRow}>
                    <Hourglass size={18} color={BORDER_COLOR} />
                    <Text style={styles.infoText}>{experience} yrs</Text>
                  </View>
                )}
              </>
            )}

          </View>

          {/* Days Ago (top-right) */}
          <View style={styles.daysAgoContainer}>
            <Text style={styles.daysAgoText}>{daysAgoEnd}</Text>
          </View>

          {/* View Button */}
          <View style={styles.buttonContainer}>
            <Button
              label="View"
              width={80}
              height={38}
              onPress={() => router.push(`/chatHistory/${historyId}`)}
            />
          </View>

        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default ChatHistoryCard;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: CARD_HEIGHT,
    position: "relative",
  },

  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },

  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F2EA",
    overflow: "hidden",
    position: "relative",
    paddingRight: 90, // exact same spacing as CounselorCard for button
  },

  imageWrapper: {
    height: "68%",
    width: CARD_HEIGHT * 0.58,
    marginRight: 14,
    marginLeft: 12,
    position: "relative",
  },

  imageShadow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
  },

  infoSection: {
    flex: 1,
    justifyContent: "center",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 1,
  },

  infoText: {
    fontSize: 12,
    marginLeft: 6,
    color: BORDER_COLOR,
    fontFamily: "KodchasanSemiBold",
  },

  daysAgoContainer: {
    position: "absolute",
    top: 12,
    right: 12,
  },

  daysAgoText: {
    fontSize: 12,
    color: BORDER_COLOR,
    fontFamily: "KodchasanSemiBold",
  },

  buttonContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
});
