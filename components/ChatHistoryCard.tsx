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

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.33;
const BORDER_COLOR = "#553434";

type ChatHistoryProps = {
  chatId: string;
  patientName: string;
  counselorName: string;
  counselorProfileUrl?: string;
  speciality?: string;
  experience?: number;
  appointmentDate: string;    // where ended date is derived
};

const ChatHistoryCard: React.FC<ChatHistoryProps> = ({
  chatId,
  patientName,
  counselorName,
  counselorProfileUrl,
  speciality,
  experience,
  appointmentDate,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const role = useAuthStore.getState().role;

  // ---- CALCULATE TIME AGO ----
  const daysAgo = (() => {
    const today = new Date();
    const date = new Date(appointmentDate);
    const diff = today.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  })();

  const timeString = new Date(appointmentDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 4, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
  };

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        
        <View style={styles.shadowLayer} />

        <View style={styles.card}>
          {/* Image Section */}
          <View style={styles.imageWrapper}>
            <View style={styles.imageShadow} />
            <Image
              source={counselorProfileUrl ? { uri: counselorProfileUrl } : require("@/assets/images/avatar.png")}
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
                  <Text style={styles.infoText}>{daysAgo} • {timeString}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <UserRound size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>
                    {counselorName}  
                    <Text style={styles.agoText}> • {daysAgo}</Text>
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Stethoscope size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>{speciality}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Hourglass size={18} color={BORDER_COLOR} />
                  <Text style={styles.infoText}>{experience} yrs</Text>
                </View>
              </>
            )}
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <Button 
              label="View" 
              width={80} 
              height={38} 
              onPress={() => {}} 
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
    paddingRight: 90,
  },

  imageWrapper: {
    height: "68%",
    width: CARD_HEIGHT * 0.60,
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
    flexWrap: "nowrap",
    width: "100%",
    marginVertical: 1,
  },

  infoText: {
    fontSize: 12,
    marginLeft: 6,
    color: "#553434",
    fontFamily: "KodchasanSemiBold",
    flexShrink: 1,
  },

  agoText: {
    fontSize: 11,
    color: "#553434aa",
    marginLeft: 4,
  },

  buttonContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
});
