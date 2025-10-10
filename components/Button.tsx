import React from "react";
import { TouchableOpacity, Text, View, Image, StyleSheet } from "react-native";
import { ButtonProps } from "@/types";

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  imageSource,
  variant = "solid",
  width,
  height,
  textSize,
}) => {
  const isSolid = variant === "solid";

  // Defaults
  const buttonWidth = width || "100%";
  const buttonHeight = height || 56;
  const fontSize = textSize || 18;

  return (
    <View style={[styles.container, { width: buttonWidth, height: buttonHeight }]}>
      {/* Shadow layer */}
      <View
        style={[
          styles.shadow,
          { width: buttonWidth, height: buttonHeight, top: 2, left: 2 },
        ]}
      />

      {/* Main button */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.button,
          {
            width: buttonWidth,
            height: buttonHeight,
            backgroundColor: isSolid ? "#96D1BD" : "#FFFFFF",
            borderColor: "#553435",
            borderWidth: 4,
          },
        ]}
      >
        {/* Render image if passed */}
        {imageSource && (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
          />
        )}
        <Text style={[styles.label, { fontSize }]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  shadow: {
    position: "absolute",
    borderRadius: 12,
    backgroundColor: "#553434",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  image: {
    width: 26,
    height: 26,
    marginRight: 8,
  },
  label: {
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
  },
});

export default Button;
