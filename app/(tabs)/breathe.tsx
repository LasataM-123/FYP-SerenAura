import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { useBackend } from "@/lib/useBackend";
import { getAllExercises, IFormattedExercise } from "@/lib/api/breathe";

const { width } = Dimensions.get("window");
const CARD_SIZE = width * 0.408;
const BORDER_COLOR = "#553434";

const COLORS = [
  "#CFDAED",
  "#FFB3B3",
  "#B5EAD7",
  "#FFD6A5",
  "#E0BBFF",
  "#FFF3B0",
  "#CFDAED",
];

// ✅ Each Card Component
const ExerciseCard = ({
  item,
  index,
}: {
  item: IFormattedExercise;
  index: number;
}) => {
  const color = COLORS[index % COLORS.length];
  const isEven = index % 2 === 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {}}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          { marginTop: isEven ? 0 : 30, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* Main Card */}
        <View style={[styles.card, { backgroundColor: color }]}>
          {/* Text section (left side) */}
          <View style={styles.textContainer}>
            <Text style={styles.text}>{item.title}</Text>
            <Text style={styles.description}>{item.totalTime} min</Text>
          </View>

          {/* Image bottom-right */}
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const Breathe = () => {
  const [exercise, setExercise] = useState<IFormattedExercise[]>([]);
  const { refetch } = useBackend({ fn: getAllExercises });

  useEffect(() => {
    const fetchExercise = async () => {
      const res = await refetch();
      if (res?.success) setExercise(res.breathingExercises);
    };
    fetchExercise();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerText}>Breathing Exercises</Text>
        <FlatList
        data={exercise}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ExerciseCard item={item} index={index} />
        )}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      
        columnWrapperStyle={{
          gap:16,
        }}
        ListFooterComponent={
          exercise.length % 2 !== 0 ? (
            <View
              style={{
                width: CARD_SIZE,
                height: CARD_SIZE,
              }}
            />
          ) : null
        }
      />

      </ScrollView>
    </SafeAreaView>
  );
};

export default Breathe;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerText: {
    marginTop: 4,
    marginBottom: 22,
    fontFamily: "KodchasanSemiBold",
    fontSize: 22,
    color: "#553434",
  },
  row: {
    justifyContent: "space-around",
    marginBottom: 25,
  },
  cardContainer: {
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
  paddingTop: CARD_SIZE * 0.08,
  paddingHorizontal: CARD_SIZE * 0.08,
  paddingBottom: 0,
  overflow: "hidden",
  justifyContent: "space-between",
},

  textContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  image: {
  position: "absolute",
  bottom: 0,
  right: 0,
  width: CARD_SIZE * 0.6,
  height: CARD_SIZE * 0.6,
  resizeMode: "cover", 
},

  text: {
    fontSize: CARD_SIZE * 0.1,
    color: BORDER_COLOR,
    fontFamily: "KodchasanSemiBold",
  },
  description: {
    fontSize: CARD_SIZE * 0.08,
    color: BORDER_COLOR,
  fontFamily: "KodchasanSemiBold",

  },
});
