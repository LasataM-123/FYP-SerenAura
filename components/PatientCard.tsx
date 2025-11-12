import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { CalendarDays, Clock, UserRound } from "lucide-react-native";
import Button from "@/components/Button";
import { images } from "@/constants";
import { useBackend } from "@/lib/useBackend";
import { acceptRequest, cancelRequest } from "@/lib/api/chat";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.56;
const BORDER_COLOR = "#553434";

interface UserCardProps {
  _id: string;
  name: string;
  profileUrl?: string;
  appointmentDate: string;
  status: "pending" | "active" | "closed" | "" | "ended";
  onStatusChange?: (chatId: string, newStatus: string) => void;
  showToast?: (message: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  _id,
  name,
  profileUrl,
  appointmentDate,
  status,
  onStatusChange,
  showToast,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { refetch: accept } = useBackend({ fn: acceptRequest });
  const { refetch: cancel } = useBackend({ fn: cancelRequest });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const dateObj = new Date(appointmentDate);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleAccept = async () => {
    try {
      const res = await accept({ chatId: _id });
      if (res?.status === "active") {
        showToast?.("✅ Chat accepted successfully");
        // onStatusChange?.(_id, "active"); // <-- This line is removed
      }
    } catch {
      showToast?.("❌ Something went wrong");
    }
  };

  const handleDecline = async () => {
    try {
      const res = await cancel({ chatId: _id });
      if (res?.status === "closed") {
        showToast?.("✅ Chat declined successfully");
        // onStatusChange?.(_id, "closed"); // <-- This line is removed
      }
    } catch {
      showToast?.("❌ Failed to decline chat");
    }
  };

  const handleStartChat = () => {
    // navigate to chat screen
  };

  const isActive = status === "active";

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.shadowLayer} />
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.imageWrapper}>
              <View style={styles.imageShadow} />
              {profileUrl ? (
                <Image source={{ uri: profileUrl }} style={styles.profileImage} resizeMode="cover" />
              ) : (
                <Image source={images.Avatar} style={styles.profileImage} resizeMode="cover" />
              )}
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <UserRound size={18} color={BORDER_COLOR} />
                <Text style={styles.infoText}>{name}</Text>
              </View>
              <View style={styles.infoRow}>
                <CalendarDays size={18} color={BORDER_COLOR} />
                <Text style={styles.infoText}>{formattedDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <Clock size={18} color={BORDER_COLOR} />
                <Text style={styles.infoText}>{formattedTime}</Text>
              </View>
            </View>
          </View>

          {isActive ? (
            <View style={[styles.buttonRow, styles.singleButtonRow]}>
              <Button
                label="Start Chat"
                width={CARD_WIDTH - 48}
                height={40}
                onPress={handleStartChat}
              />
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <Button
                label="Accept"
                width={(CARD_WIDTH - 56) / 2}
                height={38}
                onPress={handleAccept}
                imageSource={images.SimpleTick}
              />
              <Button
                label="Decline"
                width={(CARD_WIDTH - 56) / 2}
                height={38}
                variant="outline"
                onPress={handleDecline}
                imageSource={images.SimpleCross}
              />
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: CARD_HEIGHT,
    marginBottom: 20,
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
    backgroundColor: "#E6F2EA",
    padding: 12,
    justifyContent: "space-between",
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  imageWrapper: { height: 90, width: 80, marginRight: 14, position: "relative" },
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
  infoSection: { flex: 1, justifyContent: "center" },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  infoText: {
    fontSize: 12,
    marginLeft: 6,
    color: BORDER_COLOR,
    fontWeight: "500",
    fontFamily: "KodchasanSemiBold",
    flexShrink: 1,
  },
  buttonRow: { flexDirection: "row", marginTop: 8, gap: 16 },
  singleButtonRow: { justifyContent: "center" },
});