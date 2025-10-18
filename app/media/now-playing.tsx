import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import {
  Play,
  Pause,
  Heart,
  List,
  X,
  RotateCcw,
  RotateCw,
} from "lucide-react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useSearchParams } from "expo-router/build/hooks";
import { images } from "@/constants";

const { width } = Dimensions.get("window");

const NowPlayingScreen: React.FC = () => {
  const params = useSearchParams();
  const title = params.get("title") ?? "Unknown";
  const by = params.get("by") ?? "Unknown";
  const imageUrl = params.get("imageUrl") ?? "";
  const audioUrl = params.get("audioUrl") ?? "";

  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAmp = useRef(new Animated.Value(0)).current;

  // 🌀 CD Rotation Animation
  useEffect(() => {
    let rotation: Animated.CompositeAnimation | null = null;

    if (isPlaying) {
      rotation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotation.start();
    } else {
      rotateAnim.stopAnimation();
    }

    return () => {
      rotation?.stop();
    };
  }, [isPlaying]);

  // 🌊 Wave Animation
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAmp, {
            toValue: 1,
            duration: 700,
            useNativeDriver: false,
          }),
          Animated.timing(waveAmp, {
            toValue: 0,
            duration: 700,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      waveAmp.stopAnimation();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    if (audioUrl) loadAndPlay();
  }, [audioUrl]);

  const loadAndPlay = async () => {
    if (!audioUrl) return;
    setLoading(true);

    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        setLoading(false);
        return;
      }
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );
    setSound(newSound);
    setIsPlaying(true);
    setLoading(false);
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      if (status.didJustFinish) setIsPlaying(false);
    }
  };

  const handleSeek = async (value: number) => {
    if (sound && duration) await sound.setPositionAsync(value);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const generateWavePath = (amplitude: number) => {
    const w = 120;
    const h = 180;
    const midY = h / 2;
    const waveLength = w / 2;
    const path = [`M0 ${midY}`];

    for (let x = 0; x <= w; x += waveLength) {
      const cp1x = x + waveLength / 4;
      const cp1y = midY - amplitude;
      const cp2x = x + (waveLength * 3) / 4;
      const cp2y = midY + amplitude;
      const endX = x + waveLength;
      path.push(`C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${midY}`);
    }

    return path.join(" ");
  };

  const [wavePath, setWavePath] = useState(generateWavePath(20));

  useEffect(() => {
    const id = waveAmp.addListener(({ value }) => {
      setWavePath(generateWavePath(15 + value * 10));
    });
    return () => waveAmp.removeListener(id);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Top Bar --- */}

        <TouchableOpacity onPress={() => router.back()}>
            <Image source={images.cross} style={{width:30,height:30}}/>
        </TouchableOpacity>
        <Text style={styles.nowPlaying}>NOW PLAYING</Text>
        <View style={{ width: 28 }} />

      {/* --- CD + Shadow + Waves --- */}
      <View style={styles.cdContainer}>
        {/* Left Wave */}
        <Animated.View style={[styles.waveWrapper, { left: width / 2 - 250 }]}>
          <Svg height="180" width="120">
            <Path
              d={wavePath}
              fill="none"
              stroke="#553434"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        {/* CD Shadow Layer */}
        <View style={styles.cdShadowLayer} />

        {/* Rotating CD */}
        <Animated.View
          style={[styles.cdWrapper, { transform: [{ rotate: rotateInterpolate }] }]}
        >
          <Image source={{ uri: imageUrl }} style={styles.cdImage} />
          <View style={styles.cdCenter} />
        </Animated.View>

        {/* Right Wave */}
        <Animated.View style={[styles.waveWrapper, { right: width / 2 - 250 }]}>
          <Svg height="180" width="120">
            <Path
              d={wavePath}
              fill="none"
              stroke="#553434"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Song Info */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.by}>By: {by}</Text>

      {/* Icons */}
      <View style={styles.controlsRow}>
        <Heart color="#553434" size={28} />
        <List color="#553434" size={28} />
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          minimumTrackTintColor="#a4563b"
          maximumTrackTintColor="#553434"
          thumbTintColor="#a4563b"
          onSlidingComplete={handleSeek}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Main Controls */}
      <View style={styles.mainControls}>
        {/* Rewind */}
        <TouchableOpacity
          onPress={async () => {
            if (sound) {
              const status = await sound.getStatusAsync();
              if (status.isLoaded) {
                const newPosition = Math.max(status.positionMillis - 10000, 0);
                await sound.setPositionAsync(newPosition);
              }
            }
          }}
          style={styles.skipButton}
        >
          <RotateCcw size={34} color="#553434" />
          <Text style={styles.skipText}>10s</Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        <View style={styles.playButtonContainer}>
          <View style={styles.playShadowLayer} />
          <TouchableOpacity onPress={loadAndPlay} style={styles.playButton}>
            {loading ? (
              <Text style={{ color: "#fff" }}>...</Text>
            ) : isPlaying ? (
              <Pause size={36} color="#fff" />
            ) : (
              <Play size={36} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Forward */}
        <TouchableOpacity
          onPress={async () => {
            if (sound) {
              const status = await sound.getStatusAsync();
              if (status.isLoaded && status.durationMillis) {
                const newPosition = Math.min(
                  status.positionMillis + 10000,
                  status.durationMillis
                );
                await sound.setPositionAsync(newPosition);
              }
            }
          }}
          style={styles.skipButton}
        >
          <RotateCw size={34} color="#553434" />
          <Text style={styles.skipText}>10s</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NowPlayingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  nowPlaying: {
    fontFamily: "Schoolbell",
    color: "#553434",
    fontSize: 18,
     textAlign: "center",
  },
  cdContainer: {
    marginVertical: 60,
    width: "100%",
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  cdShadowLayer: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 32,
    left: 80,
    zIndex: 0,
  },

  cdWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#553434",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    zIndex: 1,
  },
  cdImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  cdCenter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderColor: "#553434",
    borderWidth: 3,
    position: "absolute",
  },
  waveWrapper: {
    position: "absolute",
    height: 180,
  },
  title: {
    fontFamily: "KodchasanSemiBold",
    fontSize: 20,
    color: "#553434",
    textAlign: "center",
    marginTop: 20,
  },
  by: {
    fontFamily: "KodchasanRegular",
    fontSize: 14,
    color: "#553434",
    marginTop: 4,
    marginBottom: 20,
    textAlign: "center", 
  },
  controlsRow: {
  flexDirection: "row",
  justifyContent: "center", // center them horizontally
  width: "auto",            // wrap content
  marginBottom: 20,
  alignItems: "center",
  gap: 20,                  // optional spacing between icons
},

  sliderContainer: { width: "100%", marginTop: 10, paddingHorizontal: 4 },
  slider: { width: "100%", height: 18, borderRadius: 10 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingHorizontal: 2 },
  time: { color: "#553434", fontFamily: "KodchasanRegular" },
  mainControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", gap: 40, marginTop: 30 },
  playButtonContainer: { width: 80, height: 80, position: "relative", alignItems: "center", justifyContent: "center" },
  playShadowLayer: { position: "absolute", width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#553434", backgroundColor: "#fff", top: 2, left: 2, zIndex: 0 },
  playButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#553434", backgroundColor: "#C76350", alignItems: "center", justifyContent: "center", zIndex: 1 },
  skipButton: { alignItems: "center", justifyContent: "center" },
  skipText: { fontSize: 12, color: "#553434", marginTop: 2, fontFamily: "KodchasanSemiBold" },
});
