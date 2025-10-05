import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const OnboardingScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar with skip */}
      <View style={styles.topBar}>
        <Text />
        <Text style={styles.skipText}>SKIP</Text>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      {/* Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/869/869869.png" }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={styles.description}>
          Take a deep breath... your path to calm, clarity, and balance begins here.
        </Text>
      </View>

      {/* Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            router.push("/next-onboarding");
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  skipText: {
    color: "#6B7280", // gray-500
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  progressDot: {
    height: 6, // 1.5 * 4 for better scaling
    width: 40, // 10 * 4
    borderRadius: 3, // rounded full
    backgroundColor: "#D1D5DB", // gray-300
  },
  activeDot: {
    backgroundColor: "#000000", // dark
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 240, // 60*4
    height: 240,
    borderRadius: 24,
  },
  textContainer: {
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  description: {
    textAlign: "center",
    color: "#4B5563", // gray-700
    fontSize: 16,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: "#BBF7D0", // green-200
    borderColor: "#000000",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  buttonText: {
    textAlign: "center",
    color: "#000000",
    fontWeight: "600",
    fontSize: 16,
  },
});
