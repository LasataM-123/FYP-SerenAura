import { View, Text, Image, StyleSheet } from "react-native";
import React from "react";
import { images } from "@/constants";
import { Link, router } from "expo-router";
import Button from "@/components/Button";
const Welcome = () => {
  return (
    <View style={styles.container}>
      {/* Top section */}
      <View style={styles.topSection}>
        <Text style={styles.title}>SerenAura</Text>
        <Image source={images.welcomeImage} style={styles.image} />
        <Text style={styles.subtitle}>
          Where your mind finds peace{"\n"}Relax, unwind and find your inner peace
        </Text>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <Button
          label="Get Started"
          onPress={() => {router.push('/signup')}}
          variant="solid"
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Already have an account?{" "}
          </Text>
          <Link href="/login" asChild>
            <Text style={styles.loginLink}>Login</Text>
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    position: "relative",
  },
  topSection: {
    alignItems: "center",
    marginTop: 112,
    gap: 28, 
  },
  title: {
    color: "#553435", 
    fontFamily: "Pacifico",
    fontSize: 40, 
  },
  image: {
    width: 250, 
    height: 250,
    resizeMode: "contain",
  },
  subtitle: {
    fontSize: 18, // text-xl
    fontFamily: "KodchasanSemiBold",
    textAlign: "center",
    color: "#553434", 
  },
  bottomSection: {
    position: "absolute",
    bottom: 48, // bottom-12
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loginContainer: {
    marginTop: 16, 
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#553434", 
    fontFamily: "KodchasanMedium",
    fontSize: 16,
  },
  loginLink: {
    color: "#553434", 
    fontFamily: "KodchasanSemiBold",
    fontSize: 18,
  },
});

export default Welcome;
