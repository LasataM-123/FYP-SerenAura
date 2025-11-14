import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarDays, Clock, UserRound } from "lucide-react-native";
import Button from "@/components/Button";
import { images } from "@/constants";
import { useBackend } from "@/lib/useBackend";
import { acceptRequest, cancelRequest } from "@/lib/api/chat";
import { router } from "expo-router";
import { useChatStore } from "@/store/chatStore";

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
  showToast?: (message: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  _id,
  name,
  profileUrl,
  appointmentDate,
  status,
  showToast,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isAppointmentAvailable, setIsAppointmentAvailable] = useState(false);

  const { refetch: accept } = useBackend({ fn: acceptRequest });
  const { refetch: cancel } = useBackend({ fn: cancelRequest });
const setCurrentChatId = useChatStore((state) => state.setCurrentChatId);
  const setPatientName = useChatStore((state) => state.setPatientName);
  const setPatientProfileUrl = useChatStore((state) => state.setPatientProfileUrl);

  useEffect(() => {
    if (!appointmentDate) return;
    const updateAvailability = () => {
      const now = new Date();
      const appointment = new Date(appointmentDate);
      setIsAppointmentAvailable(now >= appointment);
    };
    updateAvailability();
    const timer = setInterval(updateAvailability, 30000);
    return () => clearInterval(timer);
  }, [appointmentDate]);

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
      }
    } catch {
      showToast?.("❌ Failed to decline chat");
    }
  };

  const handleStartChat = () => {
    if (!isAppointmentAvailable) return;
      setCurrentChatId(_id);
    setPatientName(name);
    setPatientProfileUrl(profileUrl || null);
     router.push("/user-chat");
  };

  const isActive = status === "active";

  return (
    <View style={{ marginBottom: 24 }}>
      <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.shadowLayer} />
          <View style={styles.card}>
            {/* Top Section */}
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

            {/* Buttons Section */}
            {isActive ? (
              <View style={[styles.buttonRow, styles.singleButtonRow]}>
                <TouchableOpacity
                  activeOpacity={isAppointmentAvailable ? 0.6 : 1}
                  onPress={handleStartChat}
                  style={{ width: CARD_WIDTH - 48, opacity: isAppointmentAvailable ? 1 : 0.6 }}
                >
                  <Button
                    label="Start Chat"
                    onPress={handleStartChat}
                    imageSource={images.ButtonChat}
                    height={46}
                    variant="solid"
                  />
                </TouchableOpacity>
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

          {/* Disabled Text Below Card */}
          {isActive && !isAppointmentAvailable && (
            <Text style={styles.disabledTextOutside}>
              Chat will open at your appointment time.
            </Text>
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    backgroundColor: "#E6F2EA",
    padding: 12,
    justifyContent: "flex-start",
    minHeight: CARD_HEIGHT,
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
  singleButtonRow: {
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "center",
  },
  disabledTextOutside: {
    fontSize: 12,
    color: "#7a7a7a",
    fontFamily: "KodchasanLight",
    textAlign: "center",
    marginTop: 6,
  },
});
