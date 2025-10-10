import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface CardProps {
  color: string;
  image: any;
  text: string;
  description: string;
}

const FeatureCard: React.FC<CardProps> = ({ color, image, text, description }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.shadowLayer]} />
      <View style={[styles.card, { backgroundColor: color }]}>
        <Image source={image} style={styles.image} resizeMode="contain" />
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 158,
    height: 158,
    position: "relative",
  },
  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: 156,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#553434",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  image: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#553434",
    fontFamily:"KodchasanSemiBold"
  },
  description: {
    fontSize: 12,
    textAlign: "center",
    color: "#553434",
    marginTop: 2,
  },
});

export default FeatureCard;
