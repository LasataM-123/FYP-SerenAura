import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  onOutline
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Keyboard.dismiss();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250, // fade in speed
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    return () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200, // fade out speed
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    };
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" style="light" />

      <View style={[styles.wrapper, { paddingBottom: insets.bottom + 16 }]}>
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

          {imageSource && (
            <View style={styles.iconWrapper}>
              <Image
                source={imageSource}
                style={{ width: 88, height: 88 }}
                resizeMode="contain"
              />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <Button label={label} onPress={onPress} variant="solid" />

          {includeOutlinedButton && (
            <>
            <View style={{marginTop:12}}/>
            <Button
              label={outlineLabel ?? ""}
              onPress={onOutline ?? (() => {})}
              variant="outline"
            />
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default Overlay;

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
  crossIconContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: 6,
  },
  crossIcon: {
    width: 30,
    height: 30,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#553434",
    textAlign: "center",
    fontFamily: "KodchasanLight",
    marginBottom: 24,
  },
});
