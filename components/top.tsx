import { View, Text, TouchableOpacity, ImageBackground, Image, StyleSheet } from "react-native";
import React from "react";
import { images } from "@/constants";
import { HeaderProps } from "@/types";

const Top = ({ label, onBack }: HeaderProps) => {
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Image source={images.arrowBack} style={styles.backImage} />
      </TouchableOpacity>

      {/* Ribbon Background */}
      <View style={styles.ribbonContainer}>
        <ImageBackground
          source={images.ribbon}
          resizeMode="stretch"
          style={styles.ribbonBackground}
        >
          <Text style={styles.label}>{label}</Text>
        </ImageBackground>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: 4, 
    top: 0,
  },
  backImage: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  ribbonContainer: {
    marginTop: 32, 
  },
  ribbonBackground: {
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    minWidth: 240,
    maxWidth: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontFamily: "Schoolbell",
    fontWeight: "600", 
    fontSize: 24,
    textAlign: "center",
    flexWrap: "wrap",
  },
});

export default Top;
