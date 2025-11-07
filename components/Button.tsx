import React, { useRef } from "react";
import { 
  Animated, 
  TouchableWithoutFeedback, 
  Text, 
  View, 
  Image, 
  StyleSheet,
  useWindowDimensions,
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
  const { width: wWidth } = useWindowDimensions();
  const isSolid = variant === "solid";

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, friction: 4, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }).start();
  };

  // Responsive height based on screen width
  const buttonHeight = height || Math.max(56, wWidth * 0.13);
  const fontSize = textSize || Math.max(14, buttonHeight * 0.33);
  const borderRadius = 10;
  const borderWidth = Math.max(2, buttonHeight * 0.05);
  const imageSize = buttonHeight * 0.45;
  const shadowOffset = Math.max(2, buttonHeight * 0.05);

  const buttonWidth = width || "100%";

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.container,
          { width: buttonWidth, height: buttonHeight, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Shadow layer */}
        <View
          style={[
            styles.shadow,
            { width: buttonWidth, height: buttonHeight, top: shadowOffset, left: shadowOffset, borderRadius },
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
              borderWidth,
              borderRadius,
            },
          ]}
        >
          {imageSource && (
            <Image
              source={imageSource}
              style={[styles.image, { width: imageSize, height: imageSize }]}
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
    position: "relative" 
  },
  shadow: { 
    position: "absolute", 
    backgroundColor: "#553434" 
  },
  button: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  image: { 
    marginRight: 8 
  },
  label: { 
    fontFamily: "KodchasanSemiBold", 
    color: "#553434" 
  },
});

export default Button;
