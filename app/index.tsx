import { router, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

export default function Index() {
   const router = useRouter();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      router.replace("/welcome");
    });
  }, []);

  // Interpolated width
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  return (
   <View style={styles.container}>
      <Text style={styles.title}>SerenAura</Text>

      <View style={styles.progressContainer}>
        {/* Shadow layer */}
        <View style={styles.shadow} />

        {/* Main bar */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progressFill,{width}]}
          />
        </View>
      </View>

      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // bg-white
    padding: 24,
  },
  title: {
    color: "#553434", // text-dark
    fontFamily: "Pacifico",
    fontSize: 40, // text-5xl
    marginBottom: 28,
  },
  progressContainer: {
    width: "100%",
    height: 20,
    position: "relative",
    marginBottom: 8,
  },
  shadow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 5,
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#FFFFFF",
    top: 2,
    left: 2,
  },
  progressBar: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 5,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#C76350", 
    borderRadius: 2,
  },
  loadingText: {
    fontFamily: "Schoolbell",
    fontSize: 24, 
    marginTop: 4,
    color: "#553434",
  },
});