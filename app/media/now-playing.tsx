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
  RotateCcw,
  RotateCw,
} from "lucide-react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { images } from "@/constants";
import { useSearchParams } from "expo-router/build/hooks";
import { useBackend } from "@/lib/useBackend";
import { addFavourite, checkFavourite } from "@/lib/api/favourite";

const { width } = Dimensions.get("window");

type MediaType = "Music" | "Meditation";

const NowPlayingScreen: React.FC = () => {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const title = params.get("title") ?? "Unknown";
  const by = params.get("by") ?? "Unknown";
  const imageUrl = params.get("imageUrl") ?? "";
  const audioUrl = params.get("audioUrl") ?? "";

  // Ensure valid mediaType
  const rawMediaType = params.get("mediaType") ?? "Music";
  const mediaType = (["Music", "Meditation"].includes(rawMediaType)
    ? rawMediaType
    : "Music") as MediaType;

  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");


  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAmp = useRef(new Animated.Value(0)).current;
  const playScale = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  const { refetch: checkFavouriteRefetch } = useBackend({ fn: checkFavourite });
  const { refetch: addFavouriteRefetch } = useBackend({ fn: addFavourite });

  // 🎵 Button press animation
  const handlePlayPressIn = () => {
    Animated.spring(playScale, {
      toValue: 0.9,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePlayPressOut = () => {
    Animated.spring(playScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  //Fetch favourite state on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await checkFavouriteRefetch({ mediaId: id });
        setIsFavourite(res?.isFavourite || false);
      } catch (err) {
        console.log("Error checking favourite:", err);
      }
    })();
  }, [id]);

  // Toggle favourite
  // Toggle favourite
const handleToggleFavourite = async () => {
  if (isFavourite) {
    // Prevent re-adding the same favourite
    triggerToast("Already in favourites ❤️");
    return;
  }

  try {
    await addFavouriteRefetch({ mediaId: id, mediaType });
    const res = await checkFavouriteRefetch({ mediaId: id });
    setIsFavourite(res?.isFavourite || false);
    triggerToast("Added to favourites 💖");
  } catch (err) {
    console.log("Error toggling favourite:", err);
  }
};


  // Toast animation
  // Toast animation
const triggerToast = (message: string) => {
  setShowToast(true);
  setToastMessage(message); 
  Animated.timing(toastAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start(() => {
    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowToast(false));
    }, 1500);
  });
};


  // CD Rotation
  useEffect(() => {
    if (isPlaying) {
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [isPlaying]);

  // Wave animation
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

  const generateWavePath = (amplitude: number) => {
    const w = 140;
    const h = 220;
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

  const [wavePath, setWavePath] = useState(generateWavePath(25));

  useEffect(() => {
    const id = waveAmp.addListener(({ value }) => {
      setWavePath(generateWavePath(25 + value * 15));
    });
    return () => waveAmp.removeListener(id);
  }, []);

  return (
    <SafeAreaView style={styles.container}>      
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={images.cross} style={{ width: 32, height: 32 }} />
      </TouchableOpacity>
      <Text style={styles.nowPlaying}>NOW PLAYING</Text>

      {/* CD + Waves */}
      <View style={styles.cdContainer}>
        <Animated.View style={[styles.waveWrapper, { left: width / 2 - 250 }]}>
          <Svg height="220" width="140">
            <Path
              d={wavePath}
              fill="none"
              stroke="#553434"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        <View style={styles.cdShadowLayer} />

        <Animated.View
          style={[
            styles.cdWrapper,
            {
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <Image source={{ uri: imageUrl }} style={styles.cdImage} />
          <View style={styles.cdCenterShadow} />
          <View style={styles.cdCenter} />
        </Animated.View>

        <Animated.View style={[styles.waveWrapper, { right: width / 2 - 250 }]}>
          <Svg height="220" width="140">
            <Path
              d={wavePath}
              fill="none"
              stroke="#553434"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Song Info */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.by}>By: {by}</Text>

      {/* Controls Row */}
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={handleToggleFavourite}>
          {isFavourite ? (
            <Heart fill="#553434" color="#553434" size={28} />
          ) : (
            <Heart color="#553434" size={28} />
          )}
        </TouchableOpacity>
        <List color="#553434" size={28} />
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          minimumTrackTintColor="#C76350"
          maximumTrackTintColor="#e0b5a3"
          thumbTintColor="#C76350"
          onSlidingComplete={handleSeek}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Main Controls */}
      <View style={styles.mainControls}>
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

        <TouchableOpacity
          onPressIn={handlePlayPressIn}
          onPressOut={handlePlayPressOut}
          onPress={loadAndPlay}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.playButtonContainer,
              { transform: [{ scale: playScale }] },
            ]}
          >
            <View style={styles.playShadowLayer} />
            <View style={styles.playButton}>
              {loading ? (
                <Text style={{ color: "#fff" }}>...</Text>
              ) : isPlaying ? (
                <Pause size={36} color="#fff" />
              ) : (
                <Play size={36} color="#fff" />
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>

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

      {/* Toast */}
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
          <Image source={images.tick} style={{width:20, height:20}}/>
<Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
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

  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
    zIndex: 10,
  },

  nowPlaying: {
    fontFamily: "Schoolbell",
    color: "#553434",
    fontSize: 30,
    textAlign: "center",
    marginTop: 40,
  },

  cdContainer: {
    marginVertical: 30,
    width: "100%",
    height: 260,
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
    top: 40,
    left: 80,
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
  },

  cdImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },

  cdCenterShadow: {
    position: "absolute",
    width: 36,
    height: 36,
    backgroundColor: "#553434",
    borderRadius: 4,
    top: 2,
    left: 2,
    transform: [{ rotate: "45deg" }],
  },

  cdCenter: {
    width: 36,
    height: 36,
    backgroundColor: "#fff",
    borderColor: "#553434",
    borderWidth: 3,
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },

  waveWrapper: {
    position: "absolute",
    height: 220,
  },

  title: {
    fontFamily: "KodchasanSemiBold",
    fontSize: 30,
    color: "#553434",
    textAlign: "center",
  },

  by: {
    fontFamily: "KodchasanMedium",
    fontSize: 20,
    color: "#553434",
    marginBottom: 40,
    textAlign: "center",
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },

  sliderContainer: {
    width: "100%",
    marginTop: 12,
    alignItems: "center",
  },

  slider: {
    width: "100%",
    height: 40,
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  time: {
    color: "#553434",
    fontFamily: "KodchasanMedium",
  },

  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginTop: 20,
  },

  playButtonContainer: {
    width: 80,
    height: 80,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  playShadowLayer: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },

  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#C76350",
    alignItems: "center",
    justifyContent: "center",
  },

  skipButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  skipText: {
    fontSize: 12,
    color: "#553434",
    marginTop: 2,
    fontFamily: "KodchasanSemiBold",
  },

  toast: {
    position: "absolute",
    bottom: 60,
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 2,
    borderColor: "#553434",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  toastText: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 16,
  },
});
