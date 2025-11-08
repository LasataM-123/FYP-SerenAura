import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { useBackend } from "@/lib/useBackend";
import { getAllExercises, IFormattedExercise } from "@/lib/api/breathe";
import ExerciseCard from "@/components/ExerciseCard";
import { useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_SIZE = width * 0.408;

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
    useFocusEffect(
      useCallback(() => {
          StatusBar.setBarStyle('dark-content');
          StatusBar.setBackgroundColor('#ffffff');
        
      }, [])
    );

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
 
});
