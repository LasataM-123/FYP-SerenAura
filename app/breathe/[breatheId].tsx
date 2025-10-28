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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSearchParams } from "expo-router/build/hooks";

const { width } = Dimensions.get("window");

type Phase = "inhale" | "hold" | "exhale";

export default function BreathingScreen(): JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const breatheId = (params?.breatheId as string) || (params?.id as string);

  // fetched exercise
  const [exercise, setExercise] = useState<IBreathingExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true); // auto-start on mount
  const [phase, setPhase] = useState<Phase>("inhale");
  const [cycleIndex, setCycleIndex] = useState(0); // 0-based
  const [phaseSecondIndex, setPhaseSecondIndex] = useState(0); // 0-based seconds in the current phase

  // animation refs
  const rotation = useRef(new Animated.Value(0)).current; // 0..1 rotate loop
  const groupScale = useRef(new Animated.Value(0.9)).current; // used to scale petals group
  const petalsTranslate = useRef(new Animated.Value(0)).current; // 0 => spread, 1 => merged
  const holdPulse = useRef(new Animated.Value(1)).current; // pulsing when holding

  // timers refs
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const perSecondIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartTimestampRef = useRef<number | null>(null); // ms when phase started
  const phaseRemainingMsRef = useRef<number | null>(null); // ms remaining when paused

  // helpers for durations
  const inhaleMs = (exercise?.inhaleTime ?? 4) * 1000;
  const holdMs = (exercise?.holdTime ?? 2) * 1000;
  const exhaleMs = (exercise?.exhaleTime ?? 6) * 1000;

  useEffect(() => {
    // fetch exercise
    async function load() {
      try {
        setLoading(true);
        if (!breatheId) {
          throw new Error("No breatheId provided");
        }
        const res = await getExerciseById({ breatheId });
        setExercise(res);
      } catch (err) {
        console.error("Failed to load exercise:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
    // cleanup on unmount
    return () => {
      cleanupTimers();
      rotation.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breatheId]);

  useEffect(() => {
    // when exercise loaded and auto-play enabled, start cycles
    if (!loading && exercise && isPlaying) {
      startCycleFromPhase(phase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, exercise]);

  // start or resume
  function startCycleFromPhase(startPhase: Phase) {
    cleanupTimers();

    // start rotation continuous loop
    startRotation();

    // set the phase and begin that phase's animations/timers
    setPhase(startPhase);
    beginPhase(startPhase);
  }

  // Pause: stop timers and animations (retain progress)
  function pauseAll() {
    setIsPlaying(false);
    // store remaining ms for current phase
    if (phaseStartTimestampRef.current != null) {
      const elapsed = Date.now() - phaseStartTimestampRef.current;
      const phaseDuration = getPhaseMs(phase);
      phaseRemainingMsRef.current = Math.max(0, phaseDuration - elapsed);
    }
    // stop timers & animations
    cleanupTimers();
    rotation.stopAnimation(); // rotation can be restarted with remaining progress (we choose to restart fresh on resume)
  }

  // Resume: continue from stored remaining durations or start fresh if none
  function resumeAll() {
    setIsPlaying(true);
    // resume rotation (fresh)
    startRotation();
    // begin phase with remaining ms if exists, otherwise full duration
    const remaining = phaseRemainingMsRef.current;
    beginPhase(phase, remaining ?? undefined);
  }

  function togglePlayPause() {
    if (isPlaying) {
      pauseAll();
    } else {
      resumeAll();
    }
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
    phaseStartTimestampRef.current = null;
    phaseRemainingMsRef.current = null;
  }

  function getPhaseMs(p: Phase) {
    if (!exercise) return 1000;
    if (p === "inhale") return (exercise.inhaleTime ?? 4) * 1000;
    if (p === "hold") return (exercise.holdTime ?? 2) * 1000;
    return (exercise.exhaleTime ?? 6) * 1000;
  }

  function beginPhase(p: Phase, overrideMs?: number) {
    if (!exercise) return;
    // reset per-second index
    setPhaseSecondIndex(0);

    const totalMs = overrideMs ?? getPhaseMs(p);
    phaseStartTimestampRef.current = Date.now();
    phaseRemainingMsRef.current = null;

    // start per-second progress interval (ticks every 1s)
    // compute how many full seconds this phase should represent (use ceiling)
    const secondsForDots =
      p === "inhale"
        ? exercise.inhaleTime
        : p === "hold"
        ? exercise.holdTime
        : exercise.exhaleTime;

    // clear old interval if any
    if (perSecondIntervalRef.current) {
      clearInterval(perSecondIntervalRef.current);
      perSecondIntervalRef.current = null;
    }

    // calculate tick offset so we mark seconds as they pass
    let elapsedSeconds = 0;
    setPhaseSecondIndex(0);

    perSecondIntervalRef.current = setInterval(() => {
      elapsedSeconds += 1;
      // cap to secondsForDots - 1 (0-based index); on last tick we still set to last index
      const idx = Math.min(elapsedSeconds, Math.max(0, secondsForDots - 1));
      setPhaseSecondIndex(idx);
    }, 1000);

    // Start visual animations depending on phase
    if (p === "inhale") {
      // petals spread & rotate (scale up)
      Animated.parallel([
        Animated.timing(petalsTranslate, {
          toValue: 0, // 0 = spread out
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
      // merge petals -> petalsTranslate to 1, scale down slightly, then pulse per second
      Animated.parallel([
        Animated.timing(petalsTranslate, {
          toValue: 1, // merged
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
      ]).start(() => {
        // start pulse animation that runs for the hold duration
        startHoldPulse(totalMs);
      });
    } else {
      // exhale: petals move back out & scale down
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

    // schedule end of phase
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }

    phaseTimerRef.current = setTimeout(() => {
      // clear per-second interval for this phase
      if (perSecondIntervalRef.current) {
        clearInterval(perSecondIntervalRef.current);
        perSecondIntervalRef.current = null;
      }
      // move to next phase or next cycle
      if (p === "inhale") {
        setPhase("hold");
        beginPhase("hold");
      } else if (p === "hold") {
        setPhase("exhale");
        beginPhase("exhale");
      } else {
        // completed exhale of this cycle
        const nextCycle = cycleIndex + 1;
        if (nextCycle >= (exercise.cycles ?? 1)) {
          // finished all cycles
          cleanupTimers();
          // small delay to allow UI update then navigate
          setTimeout(() => router.push("/mood-tracker"), 300);
        } else {
          setCycleIndex(nextCycle);
          setPhase("inhale");
          beginPhase("inhale");
        }
      }
    }, totalMs);
  }

  // Rotation loop (we choose a slow rotation)
  function startRotation() {
    rotation.setValue(0);
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 12000, // 12s full rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }

  // Pulse animation during hold
  function startHoldPulse(durationMs: number) {
    // We want a pulse every second for the given duration
    // We'll run an Animated.loop with a 1s cycle and stop after duration
    holdPulse.setValue(1);
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(holdPulse, {
          toValue: 1.06,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(holdPulse, {
          toValue: 1.0,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(200),
      ])
    );

    pulseAnim.start();

    // stop pulse when hold ends (we rely on phaseTimer to clear)
    setTimeout(() => {
      pulseAnim.stop();
      holdPulse.setValue(1);
    }, durationMs);
  }

  // Descriptions
  const inhaleDescription = "Take a deep breath in through your nose.";
  const holdDescription = "Hold your breath gently. Feel the calm.";
  const exhaleDescription = "Exhale slowly through your mouth, releasing tension.";

  // Render petals: 6 petals arranged in circular layout using transforms
  const petals = new Array(6).fill(0);

  // transforms for petals use petalsTranslate (0 spread, 1 merged)
  // we will translate each petal radially by an amount (maxTranslate)
  const maxTranslate = width * 0.06; // tweak for look

  // rotation interpolation
  const rotateInter = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // petal translate interpolation (0 -> spread, 1 -> merged (0 translation))
  const petalTranslateInter = petalsTranslate.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  if (loading || !exercise) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currentPhaseTime =
    phase === "inhale" ? exercise.inhaleTime : phase === "hold" ? exercise.holdTime : exercise.exhaleTime;

  return (
    <View style={styles.screen}>
      {/* Header banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{exercise.title}</Text>
      </View>

      {/* Center animated petals */}
      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.petalsGroup,
            {
              transform: [
                { rotate: rotateInter },
                { scale: Animated.multiply(groupScale, holdPulse) }, // groupScale combined with pulse
              ],
            },
          ]}
        >
          {petals.map((_, i) => {
            // angle evenly spaced
            const angle = (i / petals.length) * Math.PI * 2;
            // compute per-petal translation using interpolation
            const tx = Animated.multiply(
              petalTranslateInter,
              Math.cos(angle) * maxTranslate
            );
            const ty = Animated.multiply(
              petalTranslateInter,
              Math.sin(angle) * maxTranslate
            );

            const petalStyle: any = {
              transform: [{ translateX: tx }, { translateY: ty }],
            };

            return (
              <Animated.View
                key={i}
                style={[styles.petal, petalStyle]}
              />
            );
          })}
        </Animated.View>

        {/* Phase label */}
        <Text style={styles.phaseLabel}>{phase.toUpperCase()}</Text>
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          {phase === "inhale"
            ? inhaleDescription
            : phase === "hold"
            ? holdDescription
            : exhaleDescription}
        </Text>
      </View>

      {/* Dots for current phase seconds */}
      <View style={styles.dotsRow}>
        {new Array(currentPhaseTime).fill(0).map((_, idx) => {
          const active = idx <= phaseSecondIndex;
          return (
            <View key={idx} style={styles.dotWrapperSmall}>
              <View style={[styles.dotShadowSmall]} />
              <View style={[styles.dotSmall, active && styles.dotSmallActive]} />
            </View>
          );
        })}
      </View>

      {/* Play / Pause button */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
          <Text style={styles.playButtonText}>{isPlaying ? "Pause" : "Play"}</Text>
        </TouchableOpacity>
        <Text style={styles.cyclesText}>
          Cycle {cycleIndex + 1} / {exercise.cycles}
        </Text>
      </View>
    </View>
  );
}

const PETAL_SIZE = Math.round(width * 0.36);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 24 : 48,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  banner: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3B2A0",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#7A3A36",
  },
  bannerText: {
    fontFamily: "KodchasanSemiBold",
    color: "#7A3A36",
    fontSize: 18,
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
    backgroundColor: "rgba(235, 135, 120, 0.9)",
    opacity: 0.85,
    // overlap petals slightly with smaller size
  },
  phaseLabel: {
    position: "absolute",
    alignSelf: "center",
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
    fontFamily: "KodchasanRegular",
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
  playButton: {
    width: width * 0.65,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#A7E0D9",
    borderWidth: 2,
    borderColor: "#553434",
    alignItems: "center",
  },
  playButtonText: {
    fontSize: 16,
    fontFamily: "KodchasanMedium",
    color: "#553434",
  },
  cyclesText: {
    marginTop: 8,
    color: "#6A4B4B",
    fontFamily: "KodchasanRegular",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
