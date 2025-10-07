import React, { useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from "react-native";

type AnswerCardProps = {
  item: { label: string; image: any };
  selectedAnswer: string | null;
  setSelectedAnswer: (label: string) => void;
};

const CARD_WIDTH = (Dimensions.get("window").width - 72) / 2;

const AnswerCard = ({ item, selectedAnswer, setSelectedAnswer }: AnswerCardProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
    setSelectedAnswer(item.label);
  };

  const isSelected = selectedAnswer === item.label;

  return (
    <TouchableWithoutFeedback onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={styles.imageContainer}>
          {/* shadow layer (color changes when selected) */}
          <View
            style={[
              styles.shadowLayer,
              isSelected && styles.selectedShadowLayer,
            ]}
          />
          <View
            style={[
              styles.imageWrapper,
              isSelected && styles.selectedImageWrapper,
            ]}
          >
            <Image source={item.image} style={styles.image} resizeMode="stretch" />
          </View>
        </View>

        <Text style={[styles.label, isSelected && styles.selectedLabel]}>
          {item.label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default AnswerCard;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
    width: CARD_WIDTH,
  },
  imageContainer: {
    width: 140,
    height: 140,
    position: "relative",
  },
  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#553434",
    top: 4,
    left: 4,
  },
  selectedShadowLayer: {
    borderColor: "#AEEBD9",
    backgroundColor: "#AEEBD9",
  },
  imageWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedImageWrapper: {
    borderColor: "#AEEBD9",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#553434",
    marginTop: 10,
    textAlign: "center",
    fontFamily: "KodchasanSemiBold",
  },
  selectedLabel: {
    color: "#3B8C73",
  },
});
