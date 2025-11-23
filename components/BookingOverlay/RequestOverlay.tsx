import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Keyboard,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useSessionStore } from "@/store/sessionStore";
import { images } from "@/constants";
import Button from "../Button";

interface RequestOverlayProps {
  title: string;
  description: string;
  status: "pending" | "active" | "closed" | "ended";
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  disabled?: boolean;
}

const RequestOverlay: React.FC<RequestOverlayProps> = ({
  title,
  description,
  status,
  onPrimaryAction,
  onSecondaryAction,
  disabled = false,
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { counselorName, appointmentDate } = useSessionStore();

  useEffect(() => {
    Keyboard.dismiss();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    return () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    };
  }, []);

  const formattedAppointmentDate = appointmentDate
    ? new Date(appointmentDate).toLocaleString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
    : "Not Scheduled";

  const renderStatusIndicator = () => {
    switch (status) {
      case "pending":
        return (
          <ActivityIndicator
            size="large"
            color="#553434"
            style={{ transform: [{ scale: 2 }], marginTop: 24 }}
          />
        );

      case "active":
      case "ended": 
        return (
          <Image
            source={images.tick}
            style={{ width: 60, height: 60, marginTop: 24 }}
            resizeMode="contain"
          />
        );

      case "closed":
        return (
          <Image
            source={images.BlockCross}
            style={{ width: 60, height: 60, marginTop: 24 }}
            resizeMode="contain"
          />
        );

      default:
        return null;
    }
  };

  const renderButtons = () => {
    if (status === "active") {
      return (
        <>
<TouchableOpacity
  activeOpacity={0.7}
  style={{ width: "100%", opacity: disabled ? 0.5 : 1, marginBottom: 12 }}
>
  <Button
    label={"Start Chat"}
    imageSource={images.ButtonChat}
    variant="solid"
    onPress={() => {
      if (disabled) return; 
      onPrimaryAction();    
    }}
  />
</TouchableOpacity>

{disabled && (
  <Text style={styles.disabledText}>
    Chat will be available at your appointment time.
  </Text>
)}



          {onSecondaryAction && (
            <Button
              label="Go back to counselors"
              onPress={onSecondaryAction}
              variant="outline"
            />
          )}
        </>
      );
    }

    // ended and closed both behave like "go back"
    if (status === "closed" || status === "ended") {
      return (
        <Button
          label="Go back"
          onPress={onSecondaryAction || onPrimaryAction}
          variant="outline"
        />
      );
    }

    if (status === "pending") {
      return (
        <Button
          label="Cancel Request"
          onPress={onSecondaryAction || onPrimaryAction}
          variant="solid"
        />
      );
    }
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <StatusBar style="light" backgroundColor="rgba(0,0,0,0.5)" />

      <View style={[styles.wrapper, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.shadowLayer} />

        <View style={styles.card}>
          {renderStatusIndicator()}

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.description}>
            {description.replace("{counselorName}", counselorName || "your counselor")}
          </Text>

          <View style={styles.sessionContainer}>
            <Text style={styles.sessionText}>Appointment:</Text>
            <Text style={styles.sessionText}>{formattedAppointmentDate}</Text>
          </View>

          {renderButtons()}
        </View>
      </View>
    </Animated.View>
  );
};

export default RequestOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  wrapper: {
    width: "80%",
    position: "relative",
  },
  shadowLayer: {
    position: "absolute",
    top: 3,
    left: 3,
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#553434",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    position: "relative",
    borderWidth: 4,
    borderColor: "#553434",
  },
  title: {
    fontSize: 18,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    textAlign: "center",
    marginTop: 24,
  },
  description: {
    fontSize: 13,
    color: "#553434",
    textAlign: "center",
    fontFamily: "KodchasanLight",
    marginTop: 8,
  },
  sessionText: {
    fontSize: 13,
    color: "#553434",
    textAlign: "center",
    fontFamily: "KodchasanMedium",
  },
  sessionContainer: {
    width: "100%",
    marginTop: 24,
    backgroundColor: "#F5EFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderColor: "#553434",
    borderWidth: 2,
  },
  disabledText: {
    fontSize: 12,
    color: "#7a7a7a",
    fontFamily: "KodchasanLight",
    textAlign: "center",
    marginBottom: 10,
  },
});
