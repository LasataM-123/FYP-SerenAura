import React, { JSX, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Button from "@/components/Button";
import { images } from "@/constants";
import Top from "@/components/top";
import {
  getExerciseById,
  IBreathingExercise,
} from "@/lib/api/breathe";
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

  // animations
  const rotation = useRef(new Animated.Value(0)).current;
  const groupScale = useRef(new Animated.Value(0.9)).current;
  const petalsTranslate = useRef(new Animated.Value(0)).current;
  const holdPulse = useRef(new Animated.Value(1)).current;

  // timers and refs
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

    return () => {
      cleanupTimers();
      rotation.stopAnimation();
    };
  }, [breatheId]);

  useEffect(() => {
    if (!loading && exercise && isPlaying) {
      startCycleFromPhase(phase);
    }
  }, [loading, exercise]);

  function startCycleFromPhase(startPhase: Phase) {
    cleanupTimers();
    startRotation();
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
    rotation.stopAnimation();
  }

  function resumeAll() {
    setIsPlaying(true);
    startRotation();
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
    if (p === "hold") return (exercise.holdTime ?? 2) * 1000;
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
      p === "inhale"
        ? exercise.inhaleTime
        : p === "hold"
        ? exercise.holdTime
        : exercise.exhaleTime;

    if (perSecondIntervalRef.current)
      clearInterval(perSecondIntervalRef.current);

    let sec = elapsedSeconds;
    perSecondIntervalRef.current = setInterval(() => {
      sec += 1;
      const idx = Math.min(sec, secondsForDots - 1);
      setPhaseSecondIndex(idx);
    }, 1000);

    if (p === "inhale") {
      Animated.parallel([
        Animated.timing(petalsTranslate, {
          toValue: 0,
          duration: totalMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(groupScale, {
          toValue: 1.05,
          duration: totalMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (p === "hold") {
      Animated.parallel([
        Animated.timing(petalsTranslate, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(groupScale, {
          toValue: 0.95,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => startHoldPulse(totalMs));
    } else {
      Animated.parallel([
        Animated.timing(petalsTranslate, {
          toValue: 0,
          duration: totalMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(groupScale, {
          toValue: 0.9,
          duration: totalMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    phaseTimerRef.current = setTimeout(() => {
      if (perSecondIntervalRef.current) {
        clearInterval(perSecondIntervalRef.current);
        perSecondIntervalRef.current = null;
      }

      if (p === "inhale") {
        setPhase("hold");
        beginPhase("hold");
      } else if (p === "hold") {
        setPhase("exhale");
        beginPhase("exhale");
      } else {
        //increment cycle AFTER full exhale
       setCycleIndex((prev) => {
        const total = exercise.cycles ?? 1;
        const isLast = prev + 1 >= total;

        if (isLast) {
          cleanupTimers();
          // stay showing last cycle (8/8)
          setTimeout(() => router.push("/media/moodTracker"), 300);
          return prev; // don't increment past total
        } else {
          const next = prev + 1;
          setTimeout(() => {
            setPhase("inhale");
            beginPhase("inhale");
          }, 100);
          return next;
        }
      });

      }
    }, totalMs);
  }

  function startRotation() {
    rotation.setValue(0);
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }

  // Slower pulse for calm hold phase
  function startHoldPulse(durationMs: number) {
    holdPulse.setValue(1);
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(holdPulse, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(holdPulse, {
          toValue: 1.0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(400),
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

  const petals = new Array(6).fill(0);
  const maxTranslate = width * 0.06;
  const rotateInter = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const petalTranslateInter = petalsTranslate.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const currentPhaseTime =
    phase === "inhale"
      ? exercise.inhaleTime
      : phase === "hold"
      ? exercise.holdTime
      : exercise.exhaleTime;

  return (
    <SafeAreaView style={styles.screen}>
      <Top label={`Deep breathing for ${exercise.title}`} onBack={()=>router.back()}/>
      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.petalsGroup,
            {
              transform: [
                { rotate: rotateInter },
                { scale: Animated.multiply(groupScale, holdPulse) },
              ],
            },
          ]}
        >
          {petals.map((_, i) => {
            const angle = (i / petals.length) * Math.PI * 2;
            const tx = Animated.multiply(
              petalTranslateInter,
              Math.cos(angle) * maxTranslate
            );
            const ty = Animated.multiply(
              petalTranslateInter,
              Math.sin(angle) * maxTranslate
            );
            return (
              <Animated.View
                key={i}
                style={[styles.petal, { transform: [{ translateX: tx }, { translateY: ty }] }]}
              />
            );
          })}
        </Animated.View>
        <Text style={styles.phaseLabel}>{phase.toUpperCase()}</Text>
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

      <View style={styles.dotsRow}>
        {new Array(currentPhaseTime).fill(0).map((_, idx) => {
          const active = idx <= phaseSecondIndex;
          return (
            <View key={idx} style={styles.dotWrapperSmall}>
              <View style={styles.dotShadowSmall} />
              <View style={[styles.dotSmall, active && styles.dotSmallActive]} />
            </View>
          );
        })}
      </View>

      <View style={styles.controls}>
        <Button
          label={isPlaying ? "Pause" : "Play"}
          imageSource={isPlaying ? images.pause : images.play}
          onPress={togglePlayPause}
        />
        <Text style={styles.cyclesText}>
          Cycle {cycleIndex + 1} / {exercise.cycles}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const PETAL_SIZE = Math.round(width * 0.7);
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  centerContainer: {
    width: "100%",
    height: PETAL_SIZE + 20,
    alignItems: "center",
    justifyContent: "center",
  },
  petalsGroup: {
    width: PETAL_SIZE,
    height: PETAL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  petal: {
    position: "absolute",
    width: PETAL_SIZE * 0.6,
    height: PETAL_SIZE * 0.6,
    borderRadius: PETAL_SIZE * 0.3,
    backgroundColor: "rgba(235, 135, 120, 0.4)",
    opacity: 0.85,
  },
  phaseLabel: {
    position: "absolute",
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  descriptionContainer: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  descriptionText: {
    textAlign: "center",
    color: "#4F2F2F",
    fontSize: 16,
  },
  dotsRow: {
    flexDirection: "row",
    marginTop: 18,
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
    marginTop: 28,
    alignItems: "center",
  },
  cyclesText: {
    marginTop: 8,
    color: "#6A4B4B",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
