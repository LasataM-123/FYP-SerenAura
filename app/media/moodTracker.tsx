import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  StatusBar,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Top from "@/components/top";
import { router, useLocalSearchParams, useSegments } from "expo-router";
import { images } from "@/constants";
import Button from "@/components/Button";
import { useBackend } from "@/lib/useBackend";
import { createOrUpdateMood } from "@/lib/api/mood";
import Overlay from "@/components/Overlay";
import { useMusic } from "../../context/MusicContext";

const moods = [
  { id: "1", name: "Happy", image: images.Happy, color: "#FFE37A" },
  { id: "2", name: "Good", image: images.Good, color: "#74CEE2" },
  { id: "3", name: "Okay", image: images.Okay, color: "#96D1BD" },
  { id: "4", name: "Sad", image: images.Sad, color: "#CB9DF0" },
  { id: "5", name: "Anxious", image: images.Anxious, color: "#7395D0" },
  { id: "6", name: "Angry", image: images.Angry, color: "#E87964" },
];

const feelings = [
  { id: "1", name: "Grateful", image: images.Grateful },
  { id: "2", name: "Energetic", image: images.Energetic },
  { id: "3", name: "Calm", image: images.Calm },
  { id: "4", name: "Stressed", image: images.Stressed },
  { id: "5", name: "Tired", image: images.Tired },
  { id: "6", name: "Excited", image: images.Excited },
];

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [showOverlay, setShowOverlay] = useState(false);
  const [journal, setJournal] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { updateMusicMood } = useMusic();

  const { refetch } = useBackend({
    fn: createOrUpdateMood,
  });

  const { from } = useLocalSearchParams();
const isFromBreathe = from === "breathe";


  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#fff");
      StatusBar.setTranslucent(false);
    }
  }, []);

  const handleChange = (input: string) => {
    if (input.length <= 100) setJournal(input);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    toastAnim.setValue(0);

    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowToast(false));
    }, 2000);
  };

  const handleLogMood = async () => {
    if (!selectedMood) {
      showToastMessage("❌ Please select your mood!");
      return;
    }

    const selectedMoodObj = moods.find((m) => m.id === selectedMood);
    const selectedFeelingObj = feelings.find((f) => f.id === feeling);

    const moodName = selectedMoodObj ? selectedMoodObj.name : null;
    const feelingName = selectedFeelingObj ? selectedFeelingObj.name : null;

    const res = await refetch({
      mood: moodName,
      feeling: feelingName,
      journal,
    });

    if (res?.success) {
      if(moodName){
        updateMusicMood(moodName);
      }
      setSuccessMessage(res?.successMessage || "Mood Added Successfully!");
      setShowOverlay(true);
      
    }
  };

  const MoodItem = ({
    item,
    selectedMood,
    onSelect,
  }: {
    item: any;
    selectedMood: string | null;
    onSelect: (id: string) => void;
  }) => {
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

    const opacity = selectedMood === item.id ? 0.6 : 1;

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onSelect(item.id)}
      >
        <Animated.View
          style={[
            styles.moodContainer,
            { transform: [{ scale: scaleAnim }], opacity },
          ]}
        >
          <View style={styles.shadowLayer} />
          <View style={[styles.moodBox, { backgroundColor: item.color }]}>
            <Image source={item.image} style={styles.moodImage} />
            <Text style={styles.moodText}>{item.name}</Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  const FeelingItem = ({
    item,
    selectedFeeling,
    onSelect,
  }: {
    item: any;
    selectedFeeling: string | null;
    onSelect: (id: string | null) => void;
  }) => {
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

    const isSelected = selectedFeeling === item.id;
    const opacity = isSelected ? 0.6 : 1;

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onSelect(isSelected ? null : item.id)}
      >
        <Animated.View
          style={[
            styles.feelingItem,
            { transform: [{ scale: scaleAnim }], opacity },
          ]}
        >
          <View style={styles.shadowLayerFeeling} />
          <View style={styles.feelingBox}>
            <Image source={item.image} style={styles.feelingImage} />
            <Text style={styles.feelingText}>{item.name}</Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
         <Top
          label="Select Your Mood"
          onBack={() => {
            if (isFromBreathe) {
              router.push("/breathe"); 
            } else {
              router.back();
            }
          }}
        />

          {/* === MOOD SECTION === */}
          <View style={styles.section}>
             <Text style={styles.headerText}>
        {isFromBreathe
          ? "Great job completing your breathing exercise! How do you feel now?"
          : "How would you describe your overall mood today?"}
      </Text>
            <FlatList
              scrollEnabled={false}
              data={moods}
              keyExtractor={(item) => item.id}
              numColumns={3}
              renderItem={({ item }) => (
                <MoodItem
                  item={item}
                  selectedMood={selectedMood}
                  onSelect={setSelectedMood}
                />
              )}
              contentContainerStyle={styles.listContainer}
              columnWrapperStyle={styles.row}
            />
          </View>

          {/* === FEELINGS SECTION === */}
          <View style={styles.section}>
            <View style={{flexDirection:'row', alignItems:"center", gap: 10}}>

            <Text style={styles.feelingHeaderText}>Additional Feelings</Text>
            <Text style={{
                    fontFamily: "KodchasanMedium",
                    fontStyle: "italic",
                    fontSize: 16,
                    color: "#553434",
                  }}>(optional)</Text>
            </View>
            <FlatList
              scrollEnabled={false}
              data={feelings}
              keyExtractor={(item) => item.id}
              numColumns={3}
              renderItem={({ item }) => (
                <FeelingItem
                  item={item}
                  selectedFeeling={feeling}
                  onSelect={setFeeling}
                />
              )}
              contentContainerStyle={styles.listContainer}
              columnWrapperStyle={styles.feelingRow}
            />
          </View>

          {/* === JOURNAL SECTION === */}
          <View style={styles.section}>
            <Text style={styles.journalHeaderText}>Journal Entry</Text>
            <View style={styles.messageContainer}>
              <View style={styles.shadowLayerInput} />
              <View style={styles.inputBox}>
                <Text style={styles.label}>Share Your Thoughts</Text>
                <Text
                  style={{
                    fontFamily: "KodchasanMedium",
                    fontStyle: "italic",
                    fontSize: 16,
                    color: "#553434",
                  }}
                >
                  (optional)
                </Text>

                <View style={styles.inputContainer}>
                  <View style={styles.inputShadowLayer} />
                  <TextInput
                    style={styles.input}
                    value={journal}
                    onChangeText={handleChange}
                    placeholder="What’s on your mind today? How are you feeling? What made you happy or worried? Write anything you’d like to remember about today..."
                    multiline
                    placeholderTextColor="#553434"
                  />
                </View>

                <Text style={styles.counter}>{journal.length}/100</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 30, marginBottom: 30 }}>
            <Button
              label="Log Mood"
              onPress={handleLogMood}
              imageSource={images.Plus}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* === TOAST === */}
      {showToast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* === OVERLAY === */}
      {showOverlay && (
        <Overlay
        title={successMessage}
        description="Your mood has been recorded. Keep tracking your emotional wellness journey."
        label="Continue"
        onPress={() => {
          if (isFromBreathe) {
            router.push("/breathe");
          } else {
            router.back();
          }
        }}
        imageSource={images.tick}
        />

      )}
    </SafeAreaView>
  );
};

export default MoodTracker;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  section: { marginTop: 24 },
  headerText: {
    fontSize: 18,
    color: "#553434",
    fontFamily: "KodchasanSemiBold",
    textAlign: "center",
    marginBottom: 20,
  },
  feelingHeaderText: {
    fontSize: 18,
    color: "#553434",
    fontFamily: "KodchasanSemiBold",
    marginBottom: 12,
  },
  journalHeaderText: {
    fontSize: 18,
    color: "#553434",
    fontFamily: "KodchasanSemiBold",
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  row: { gap: 16 },
  feelingRow: { gap: 10 },
  moodContainer: {
    width: 92,
    height: 114,
    marginVertical: 10,
    position: "relative",
  },
  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 2,
    left: 2,
    zIndex: 0,
  },
  moodBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#553434",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  moodImage: {
    width: 45,
    height: 45,
    resizeMode: "contain",
    marginBottom: 4,
  },
  moodText: {
    fontSize: 15,
    color: "#553434",
    fontFamily: "KodchasanSemiBold",
  },
  feelingItem: {
    position: "relative",
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  shadowLayerFeeling: {
    position: "absolute",
    top: 1,
    left: 1,
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#553434",
    backgroundColor: "#fff",
    zIndex: 0,
  },
  feelingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#553434",
    backgroundColor: "#FFF3B0",
    paddingVertical: 8,
    paddingHorizontal: 7,
    zIndex: 1,
    gap: 6,
  },
  feelingImage: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  feelingText: {
    fontSize: 13,
    color: "#553434",
    fontFamily: "KodchasanSemiBold",
    flexShrink: 1,
    textAlign: "center",
  },
  messageContainer: { position: "relative", marginTop: 10, marginBottom: 10 },
  shadowLayerInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 2,
    left: 2,
    zIndex: 0,
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#F5EFFF",
    padding: 16,
    zIndex: 1,
  },
  inputContainer: { position: "relative", marginTop: 10 },
  inputShadowLayer: {
    position: "absolute",
    top: 2,
    left: 2,
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#fff",
    zIndex: 0,
  },
  input: {
    borderWidth: 2,
    borderColor: "#553434",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "KodchasanLight",
    minHeight: 124,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    fontStyle: "italic",
    zIndex: 1,
  },
  counter: {
    textAlign: "right",
    marginTop: 4,
    color: "#553434",
    fontFamily: "KodchasanRegular",
    fontSize: 14,
  },
  toast: {
    position: "absolute",
    bottom: 60,
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 3,
    borderColor: "#553434",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  toastText: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
  },
});
