import React, { useState } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
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

  return (
    <View style={styles.container}>
      {/* Shadow layer */}
      <View style={styles.shadowLayer} />

      {/* Main Input */}
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        placeholder={placeholder}
        placeholderTextColor="#553434"
        style={styles.input}
      />

      {/* Eye Icon (if password field) */}
      {secureTextEntry && (
        <Pressable
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.eyeIcon}
          hitSlop={10}
        >
          {isPasswordVisible ? (
            <Eye size={22} color="#553434" />
          ) : (
            <EyeOff size={22} color="#553434" />
          )}
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
    width: "100%",
    height: 56,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#553434",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -11 }], // half of icon height
  },
});
