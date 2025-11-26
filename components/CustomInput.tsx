import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { CustomInputProps } from "@/types";

const CustomInput = ({
  placeholder = "Enter text",
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
}: CustomInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { width: wWidth } = useWindowDimensions();

  // responsive sizes
  const inputHeight = Math.min(56, wWidth * 0.13); // height scales with width
  const borderRadius = Math.min(20, wWidth * 0.05);
  const borderWidth = Math.max(2, wWidth * 0.008);
  const paddingHorizontal = Math.min(16, wWidth * 0.04);
  const eyeSize = Math.min(22, wWidth * 0.06);
  const eyeTranslateY = eyeSize / 2;

  return (
    <View style={[styles.container, { height: inputHeight }]}>
      {/* Shadow layer */}
      <View
        style={[
          styles.shadowLayer,
          {
            width: "100%",
            height: inputHeight,
            borderRadius,
            borderWidth,
            top: 2,
            left: 2,
          },
        ]}
      />

      {/* Main Input */}
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        placeholder={placeholder}
        placeholderTextColor="#646464ff"
        style={[
          styles.input,
          {
            height: inputHeight,
            borderRadius,
            borderWidth,
            paddingHorizontal,
            fontSize: Math.min(16, wWidth * 0.04),
             textAlignVertical: "center", 
      paddingVertical: 0,
          },
        ]}
      />

      {/* Eye Icon (if password field) */}
      {secureTextEntry && (
        <Pressable
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={[
            styles.eyeIcon,
            { right: paddingHorizontal, top: "50%", transform: [{ translateY: -eyeTranslateY }] },
          ]}
          hitSlop={10}
        >
          {isPasswordVisible ? <Eye size={eyeSize} color="#553434" /> : <EyeOff size={eyeSize} color="#553434" />}
        </Pressable>
      )}
    </View>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
  },
  shadowLayer: {
    position: "absolute",
    backgroundColor: "#fff",
    borderColor: "#553434",
  },
  input: {
    width: "100%",
    borderColor: "#553434",
    backgroundColor: "#fff",
    fontFamily: "KodchasanMedium",
  },
  eyeIcon: {
    position: "absolute",
  },
});
