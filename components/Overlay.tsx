import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Keyboard
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { OverlayProps } from "@/types";
import Button from "./Button";
import { images } from "@/constants";

const Overlay: React.FC<OverlayProps> = ({
  title,
  description,
  label,
  imageSource,
  outlineLabel,
  includeOutlinedButton = false,
  crossIcon = false,
  onClose,
  onPress,
}) => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
   Keyboard.dismiss();
  }, []);

  return (
    <View
      style={[
        styles.overlay,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" style="light" />

      <View style={styles.wrapper}>
        {/* Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* Main Card */}
        <View style={styles.card}>
          {crossIcon && (
            <TouchableOpacity
              style={styles.crossIconContainer}
              onPress={onClose}
            >
              <Image
                source={images.cross}
                style={styles.crossIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          {/* Icon */}
          {imageSource && (
            <View style={styles.iconWrapper}>
              <Image
                source={imageSource}
                style={{ width: 88, height: 88 }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Solid Button */}
          <Button label={label} onPress={onPress} variant="solid" />

          {/* Optional Outlined Button */}
          {includeOutlinedButton && (
            <Button
              label={outlineLabel ?? ""}
              onPress={() => {}}
              variant="outline"
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default Overlay;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    width: "100%",
    height: "100%",
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
    padding: 24,
    alignItems: "center",
    position: "relative",
    zIndex: 10,
    borderWidth: 4,
    borderColor: "#553434",
  },
  crossIconContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: 6,
  },
  crossIcon: {
    width: 20,
    height: 20,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#553434",
    textAlign: "center",
    fontFamily: "KodchasanMedium",
    marginBottom: 24,
  },
});
