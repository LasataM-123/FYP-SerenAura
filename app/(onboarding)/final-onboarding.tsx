import React, { use } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import Button from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { images } from "@/constants";

const Final = () => {
    const {completeOnboarding} = useAuthStore();
    const handleSubmit = () => {
      completeOnboarding();
      router.replace('/home');
        
    }
  return (
    <SafeAreaView style={styles.container}>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={[styles.progressDot, styles.activeDot]} />
        <View style={[styles.progressDot, styles.activeDot]} />
      </View>
      <View style={styles.main}>
        {/* Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={images.success}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={styles.description}>
         You're all set! We've curated the best relaxation techniques for you. Breathe in, relax, and enjoy your personalized journey.
        </Text>
      </View>
      </View>
      

      {/* Button */}
      <View style={styles.buttonContainer}>
       <Button label="Continue" onPress={handleSubmit}/>
      </View>
    </SafeAreaView>
  );
};

export default Final;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  main:{
    flex :1,
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 68,
  },
  progressDot: {
  height: 6,
  width: 55,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#553434",
  marginHorizontal: 4,
  shadowColor: "#553434",
  shadowOffset: { width: 2, height: 0 }, 
  shadowOpacity: 1, 
  shadowRadius: 0, 
  elevation: 2, 
},
  activeDot: { backgroundColor: "#553434", borderRadius: 3 },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 240, 
    height: 240,
    borderRadius: 20,
  },
  textContainer: {
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  description: {
    textAlign: "center",
    color: "#553434", 
    fontSize: 18,
    fontFamily: "KodchasanSemiBold",
  },
  buttonContainer: {
    marginBottom: 32,
  },
});
