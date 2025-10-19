import React, { useRef } from "react";
import { 
  Animated, 
  TouchableWithoutFeedback, 
  Text, 
  View, 
  Image, 
  StyleSheet 
} from "react-native";
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

  // Animation value for whole button
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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

  // Defaults
  const buttonWidth = width || "100%";
  const buttonHeight = height || 56;
  const fontSize = textSize || 18;

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.container,
          { 
            width: buttonWidth, 
            height: buttonHeight,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Shadow layer */}
        <View
          style={[
            styles.shadow,
            { width: buttonWidth, height: buttonHeight, top: 2, left: 2 },
          ]}
        />

        {/* Main button */}
        <View
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
          {imageSource && (
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
            />
          )}
          <Text style={[styles.label, { fontSize }]}>{label}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
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
