import React, { JSX, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Button from "@/components/Button";
import { images } from "@/constants";
import Top from "@/components/top";
import { getExerciseById, IBreathingExercise } from "@/lib/api/breathe";
import { useBackend } from "@/lib/useBackend";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
type Phase = "inhale" | "hold" | "exhale";

export default function BreathingScreen(): JSX.Element {
  const router = useRouter();
  const { breatheId } = useLocalSearchParams<{ breatheId: string }>();

  const [exercise, setExercise] = useState<IBreathingExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [cycleIndex, setCycleIndex] = useState(0);
  const [phaseSecondIndex, setPhaseSecondIndex] = useState(0);

  // Animation refs
  const lungsScale = useRef(new Animated.Value(0.9)).current;
  const holdPulse = useRef(new Animated.Value(1)).current;

  // Timer refs
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const perSecondIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartTimestampRef = useRef<number | null>(null);
  const phaseRemainingMsRef = useRef<number | null>(null);

  const { refetch } = useBackend({ fn: getExerciseById });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        if (!breatheId) throw new Error("No breatheId provided");
        const res = await refetch({ breatheId });
        setExercise(res?.breathingExercise ?? null);
      } catch (err) {
        console.error("Failed to load exercise:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => cleanupTimers();
  }, [breatheId]);

  useEffect(() => {
    if (!loading && exercise && isPlaying) startCycleFromPhase(phase);
  }, [loading, exercise]);

  function startCycleFromPhase(startPhase: Phase) {
    cleanupTimers();
    setPhase(startPhase);
    beginPhase(startPhase);
  }

  function pauseAll() {
    setIsPlaying(false);
    if (phaseStartTimestampRef.current != null) {
      const elapsed = Date.now() - phaseStartTimestampRef.current;
      const phaseDuration = getPhaseMs(phase);
      phaseRemainingMsRef.current = Math.max(0, phaseDuration - elapsed);
    }
    cleanupTimers();
    lungsScale.stopAnimation();
    holdPulse.stopAnimation();
  }

  function resumeAll() {
    setIsPlaying(true);
    const remaining = phaseRemainingMsRef.current;
    beginPhase(phase, remaining ?? undefined);
  }

  function togglePlayPause() {
    if (isPlaying) pauseAll();
    else resumeAll();
  }

  function cleanupTimers() {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    if (perSecondIntervalRef.current) {
      clearInterval(perSecondIntervalRef.current);
      perSecondIntervalRef.current = null;
    }
  }

  function getPhaseMs(p: Phase) {
    if (!exercise) return 1000;
    if (p === "inhale") return (exercise.inhaleTime ?? 4) * 1000;
    if (p === "hold") return (exercise.holdTime ?? 0) * 1000; // default 0
    return (exercise.exhaleTime ?? 6) * 1000;
  }

  function beginPhase(p: Phase, overrideMs?: number) {
    if (!exercise) return;

    const fullMs = getPhaseMs(p);
    const totalMs = overrideMs ?? fullMs;
    const alreadyElapsedMs = overrideMs ? fullMs - overrideMs : 0;
    const elapsedSeconds = Math.floor(alreadyElapsedMs / 1000);

    setPhaseSecondIndex(elapsedSeconds);
    phaseStartTimestampRef.current = Date.now() - alreadyElapsedMs;
    phaseRemainingMsRef.current = null;

    const secondsForDots =
      (p === "inhale"
        ? exercise.inhaleTime
        : p === "hold"
        ? exercise.holdTime
        : exercise.exhaleTime) || 0; // safe fallback

    if (perSecondIntervalRef.current)
      clearInterval(perSecondIntervalRef.current);

    let sec = elapsedSeconds;
    perSecondIntervalRef.current = setInterval(() => {
      sec += 1;
      const idx = Math.min(sec, secondsForDots - 1);
      setPhaseSecondIndex(idx);
    }, 1000);

    const animDuration = totalMs + 1000; 

    if (p === "inhale") {
      Animated.timing(lungsScale, {
        toValue: 1.2,
        duration: animDuration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (p === "hold") {
      Animated.timing(lungsScale, {
        toValue: 1.15,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => startHoldPulse(totalMs));
    } else {
      Animated.timing(lungsScale, {
        toValue: 0.9,
        duration: animDuration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }

    // --- Transition logic ---
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    phaseTimerRef.current = setTimeout(() => {
      if (perSecondIntervalRef.current) {
        clearInterval(perSecondIntervalRef.current);
        perSecondIntervalRef.current = null;
      }

      if (p === "inhale") {
        // FIXED: Check if holdTime exists and is greater than 0
        if (exercise.holdTime && exercise.holdTime > 0) {
          setPhase("hold");
          beginPhase("hold");
        } else {
          // Skip hold entirely, go straight to exhale
          setPhase("exhale");
          beginPhase("exhale");
        }
      } else if (p === "hold") {
        setPhase("exhale");
        beginPhase("exhale");
      } else {
        setCycleIndex((prev) => {
          const total = exercise.cycles ?? 1;
          const isLast = prev + 1 >= total;

          if (isLast) {
            cleanupTimers();
            setTimeout(
              () =>
                router.push({
                  pathname: "/media/moodTracker",
                  params: { from: "breathe" },
                }),
              300
            );
            return prev;
          } else {
            const next = prev + 1;
            setTimeout(() => {
              setPhase("inhale");
              beginPhase("inhale");
            }, 150);
            return next;
          }
        });
      }
    }, totalMs);
  }

  function startHoldPulse(durationMs: number) {
    holdPulse.setValue(1);
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(holdPulse, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(holdPulse, {
          toValue: 1.0,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();
    setTimeout(() => {
      pulseAnim.stop();
      holdPulse.setValue(1);
    }, durationMs);
  }

  if (loading || !exercise) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currentPhaseTime =
    (phase === "inhale"
      ? exercise.inhaleTime
      : phase === "hold"
      ? exercise.holdTime
      : exercise.exhaleTime) || 0;

  return (
    <SafeAreaView style={styles.screen}>
      <Top
        label={`Deep breathing for ${exercise.title}`}
        onBack={() => router.back()}
      />

      <View style={styles.mainWrapper}>
        <View style={styles.lungsFixedContainer}>
          <Text style={styles.phaseLabel}>{phase.toUpperCase()}</Text>
          <Animated.Image
            source={images.Lungs}
            resizeMode="contain"
            style={[
              styles.lungsImage,
              {
                transform: [
                  {
                    scale: Animated.multiply(lungsScale, holdPulse),
                  },
                ],
              },
            ]}
          />
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {phase === "inhale"
              ? exercise.inhaleDescription
              : phase === "hold"
              ? exercise.holdDescription
              : exercise.exhaleDescription}
          </Text>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomFixed}>
        <View style={styles.dotsRow}>
          {new Array(currentPhaseTime).fill(0).map((_, idx) => {
            const active = idx <= phaseSecondIndex;
            return (
              <View key={idx} style={styles.dotWrapperSmall}>
                <View style={styles.dotShadowSmall} />
                <View
                  style={[styles.dotSmall, active && styles.dotSmallActive]}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.controls}>
          <Text style={styles.cyclesText}>
            Cycle {cycleIndex + 1} / {exercise.cycles}
          </Text>
          <Button
            label={isPlaying ? "Pause" : "Play"}
            imageSource={isPlaying ? images.pause : images.play}
            onPress={togglePlayPause}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const LUNGS_SIZE = Math.round(width * 0.75);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  mainWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  lungsFixedContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: LUNGS_SIZE + 80,
  },
  lungsImage: {
    width: LUNGS_SIZE,
    height: LUNGS_SIZE,
  },
  phaseLabel: {
    position: "absolute",
    top: "1%", 
    color: "#4F2F2F",
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "KodchasanSemiBold",
    letterSpacing: 1,
  },
  descriptionContainer: {
    position: "absolute",
    bottom: 20,
    width: "90%",
    alignSelf: "center",
  },
  descriptionText: {
    textAlign: "center",
    fontFamily: "KodchasanSemiBold",
    color: "#4F2F2F",
    fontSize: 16,
  },
  bottomFixed: {
    paddingBottom: 40,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dotWrapperSmall: {
    width: 10,
    height: 10,
    marginHorizontal: 4,
    position: "relative",
  },
  dotShadowSmall: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#553434",
    top: 1,
    left: 1,
  },
  dotSmall: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#F5EFFF",
    borderWidth: 1,
    borderColor: "#553434",
  },
  dotSmallActive: {
    backgroundColor: "#553434",
  },
  controls: {
    marginTop: 20,
    alignItems: "center",
  },
  cyclesText: {
    marginTop: 8,
    marginBottom: 12,
    color: "#553434",
    fontFamily: "KodchasanMedium",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});