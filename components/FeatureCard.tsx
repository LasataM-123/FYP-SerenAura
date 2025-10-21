import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const CARD_SIZE = width * 0.41; 
const BORDER_COLOR = "#553434";

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
    width: CARD_SIZE,
    height: CARD_SIZE,
    position: "relative",
  },
  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: BORDER_COLOR,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: CARD_SIZE * 0.08,
    paddingHorizontal: CARD_SIZE * 0.06,
  },
  image: {
    width: CARD_SIZE * 0.35,
    height: CARD_SIZE * 0.35,
    marginBottom: CARD_SIZE * 0.06,
  },
  text: {
    fontSize: CARD_SIZE * 0.1, // scales with screen size
    fontWeight: "600",
    color: BORDER_COLOR,
    fontFamily: "KodchasanSemiBold",
  },
  description: {
    fontSize: CARD_SIZE * 0.08,
    textAlign: "center",
    color: BORDER_COLOR,
    marginTop: CARD_SIZE * 0.02,
  },
});

export default FeatureCard;
