import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, Animated, StyleSheet } from "react-native";

const BORDER = "#553434";

const DeletingAccountOverlay = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" style="light" />
        
      <View style={styles.cardWrapper}>
        <View style={styles.shadowLayer} />
        <View style={styles.cardMain}>
          <ActivityIndicator size="large" color={BORDER} />
          <Text style={styles.text}>Deleting Account...</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default DeletingAccountOverlay;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  cardWrapper: {
    width: 255,
    height: 160,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  shadowLayer: {
    position: "absolute",
    top: 3,
    left: 3,
    width: "100%",
    height: "100%",
    backgroundColor: BORDER,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER,
  },
  cardMain: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 18,
    color: BORDER,
    fontFamily: "Schoolbell",
    fontSize: 20,
  },
});
