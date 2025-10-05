import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
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
  onPress,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.wrapper}>
        {/* Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* Main Container */}
        <View style={styles.card}>
         
         

          {/* Icon */}
          {imageSource && (
            <View style={styles.iconWrapper}>
              <Image source={imageSource} width={88} height={88} />
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
            <Button label={outlineLabel ?? ""} onPress={() => {}} variant="outline" />
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
    zIndex: 50,
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
  title: {
    fontSize: 20,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    textAlign: "center",
  },
  iconWrapper: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#553434",
    textAlign: "center",
    fontFamily: "KodchasanMedium",
    marginBottom: 24,
  },
  solidButton: {
    backgroundColor: "#553434",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: "100%",
    marginBottom: 12,
  },
});
