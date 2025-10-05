import { View, Text, StyleSheet } from "react-native";
import React from "react";
import Button from "./Button";

interface OtpExpiredOverlayProps {
  visible: boolean;
  onPress: () => void; // callback when button is pressed
}

const OtpExpiredOverlay: React.FC<OtpExpiredOverlayProps> = ({
  visible,
  onPress,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.containerWrapper}>
        {/* Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* Foreground Card */}
        <View style={styles.card}>
          <Text style={styles.title}>OTP Expired</Text>
          <Text style={styles.message}>
            Your OTP has expired. Go back to request a new one.
          </Text>
          <Button label="Ok" onPress={onPress} variant="solid" />
        </View>
      </View>
    </View>
  );
};

export default OtpExpiredOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  containerWrapper: {
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
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#553434",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#553434",
    justifyContent: "center",
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: "KodchasanMedium",
    color: "#553434",
    textAlign: "center",
    marginBottom: 32,
  },
});
