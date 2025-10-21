// NowPlayingScreen.tsx
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
  FlatList,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import {
  Play,
  Pause,
  Heart,
  List,
  ListPlus,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  Check,
  ListCheck,
} from "lucide-react-native";

import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { images } from "@/constants";
import { useBackend } from "@/lib/useBackend";
import { addFavourite, checkFavourite } from "@/lib/api/favourite";
import {
  addMediaToPlaylist,
  createPlaylist,
  getUserPlaylists,
  checkPlaylists,
} from "@/lib/api/playlist";
import { useSearchParams } from "expo-router/build/hooks";
import Button from "@/components/Button";

const { width } = Dimensions.get("window");

type MediaType = "Music" | "Meditation";

const NowPlayingScreen: React.FC = () => {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const title = params.get("title") ?? "Unknown";
  const by = params.get("by") ?? "Unknown";
  const imageUrl = params.get("imageUrl") ?? "";
  const audioUrl = params.get("audioUrl") ?? "";
  const rawMediaType = params.get("mediaType") ?? "Music";
  const mediaType = (["Music", "Meditation"].includes(rawMediaType)
    ? rawMediaType
    : "Music") as MediaType;

  // player
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  // favourites & toast
  const [isFavourite, setIsFavourite] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // playlists UI
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<
    {
      _id: string;
      title: string;
      imageUrl: string | null;
      totalVideos?: number;
    }[]
  >([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isInAnyPlaylist, setIsInAnyPlaylist] = useState(false);

  // animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAmp = useRef(new Animated.Value(0)).current;
  const playScale = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  // backend hooks
  const { refetch: checkFavouriteRefetch } = useBackend({ fn: checkFavourite });
  const { refetch: addFavouriteRefetch } = useBackend({ fn: addFavourite });
  const { refetch: getUserPlaylistRefetch } = useBackend({ fn: getUserPlaylists });
  const { refetch: createPlaylistRefetch } = useBackend({ fn: createPlaylist });
  const { refetch: addMediaRefetch } = useBackend({ fn: addMediaToPlaylist });
  const { refetch: checkPlaylistsRefetch } = useBackend({ fn: checkPlaylists });
   useEffect(() => {
  (async () => {
    try {
      // check favourite first
      const favRes = await checkFavouriteRefetch({ mediaId: id });
      setIsFavourite(favRes?.isFavourite || false);

      // first check if media is in any playlist
      const checkRes = await checkPlaylistsRefetch({ mediaId: id });
      setIsInAnyPlaylist(checkRes?.exists || false);


      // then fetch user playlists
      const plRes = await getUserPlaylistRefetch();
      const userPlaylists = plRes?.playlists || [];
      setPlaylists(userPlaylists);
    } catch (err) {
      console.log("Error fetching playlists:", err);
    }
  })();
}, []);


  // play button scale animation handlers
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

  // toast helper
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
      }, 1400);
    });
  };

  // CD rotation
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

  // wave animation
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAmp, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.timing(waveAmp, { toValue: 0, duration: 700, useNativeDriver: false }),
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

  // player helpers
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
    const idL = waveAmp.addListener(({ value }) => {
      setWavePath(generateWavePath(25 + value * 15));
    });
    return () => waveAmp.removeListener(idL);
  }, []);

  // playlists actions
  const openAddPlaylist = async () => {
  try {
    const plRes = await getUserPlaylistRefetch();
    setPlaylists(plRes?.playlists || []);

    // re-check membership
    const included: string[] = [];
    let foundInAny = false;

    await Promise.all(
      (plRes?.playlists || []).map(async (p: any) => {
        try {
          const c = await checkPlaylistsRefetch({ mediaId: id });
          const exists = c?.exists;
          if (exists) {
            included.push(p._id);
            foundInAny = true; 
          }
        } catch (err) {
          // ignore
        }
      })
    );
    setIsInAnyPlaylist(foundInAny); 
  } catch (err) {
    console.log("Error opening playlists:", err);
  }

  setSelectedPlaylistId(null);
  setShowAddPlaylist(true);
};


  const closeAddPlaylist = () => {
    setShowAddPlaylist(false);
  };

  const openCreatePlaylist = () => {
    setNewPlaylistName("");
    setShowCreatePlaylist(true);
  };

  const handleConfirmAddOrCreate = async () => {
  if (!selectedPlaylistId) {
    openCreatePlaylist();
    return;
  }

  try {
    await addMediaRefetch({ playlistId: selectedPlaylistId, mediaId: id, mediaType });
    setIsInAnyPlaylist(true);
    setShowAddPlaylist(false);

    setTimeout(() => triggerToast("Added to playlist 🎶"), 200);
  } catch (err) {
    console.log("Error adding media to playlist:", err);
    triggerToast("Failed to add to playlist");
  }
};


  const handleCreatePlaylistPress = async () => {
    if (!newPlaylistName.trim()) {
      triggerToast("Please enter a name");
      return;
    }
    try {
      await createPlaylistRefetch({ title: newPlaylistName.trim() });
      triggerToast("Playlist created ✅");
      // refetch playlists
      const plRes = await getUserPlaylistRefetch();
      setPlaylists(plRes?.playlists || []);
      // close create and return to add overlay
      setShowCreatePlaylist(false);
      setShowAddPlaylist(true);
    } catch (err) {
      console.log("Error creating playlist:", err);
      triggerToast("Failed to create playlist");
    }
  };

  // favourite (keep behavior unchanged)
  const handleToggleFavourite = async () => {
    if (isFavourite) {
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

  const handleTogglePlaylist = () => {
  if (isInAnyPlaylist) {
    triggerToast("Already in Playlist 🎶");
  } else {
    setSelectedPlaylistId(null);
    setShowAddPlaylist(true);
  }
};



  return (
    <SafeAreaView style={styles.container}>
      {/* header back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={images.cross} style={{ width: 32, height: 32 }} />
      </TouchableOpacity>

      <Text style={styles.nowPlaying}>NOW PLAYING</Text>

      {/* CD + Waves */}
      <View style={styles.cdContainer}>
        <Animated.View style={[styles.waveWrapper, { left: width / 2 - 250 }]}>
          <Svg height="220" width="140">
            <Path d={wavePath} fill="none" stroke="#553434" strokeWidth="3" strokeLinecap="round" />
          </Svg>
        </Animated.View>

        <View style={styles.cdShadowLayer} />

        <Animated.View
          style={[
            styles.cdWrapper,
            {
              transform: [
                {
                  rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
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
            <Path d={wavePath} fill="none" stroke="#553434" strokeWidth="3" strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </View>

      {/* song info */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.by}>By: {by}</Text>

      {/* controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={handleToggleFavourite}>
          {isFavourite ? <Heart fill="#553434" color="#553434" size={28} /> : <Heart color="#553434" size={28} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleTogglePlaylist}>
          {isInAnyPlaylist ? <ListCheck color="#553434" size={28} /> : <ListPlus color="#553434" size={28} />}
        </TouchableOpacity>

      </View>

      {/* slider */}
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

      {/* main controls */}
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

        <TouchableOpacity onPressIn={handlePlayPressIn} onPressOut={handlePlayPressOut} onPress={loadAndPlay} activeOpacity={1}>
          <Animated.View style={[styles.playButtonContainer, { transform: [{ scale: playScale }] }]}>
            <View style={styles.playShadowLayer} />
            <View style={styles.playButton}>
              {loading ? <Text style={{ color: "#fff" }}>...</Text> : isPlaying ? <Pause size={36} color="#fff" /> : <Play size={36} color="#fff" />}
            </View>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            if (sound) {
              const status = await sound.getStatusAsync();
              if (status.isLoaded && status.durationMillis) {
                const newPosition = Math.min(status.positionMillis + 10000, status.durationMillis);
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

    

      {/* Add Playlist Modal */}
      <Modal visible={showAddPlaylist} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowAddPlaylist(false)}>
          <View style={styles.overlayBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeAddPlaylist}>
          <Image source={images.cross} style={{ width: 28, height: 28 }} />
        </TouchableOpacity>

            <Text style={styles.modalTitle}>Add to playlist</Text>
            <TouchableOpacity onPress={() => setShowAddPlaylist(false)}>
              <Image source={images.cross} style={{ width: 28, height: 28 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {playlists.length === 0 ? (
              <View style={styles.noPlaylistContainer}>
                <Text style={styles.noPlaylistsText}>No playlists yet</Text>
                <Button label="Create Playlist" onPress={() => { setShowAddPlaylist(false); setShowCreatePlaylist(true); }}/>
              </View>
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
    
                  const isSelected = selectedPlaylistId === item._id;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedPlaylistId(item._id)}
                      style={[styles.playlistRow, isSelected ? styles.playlistRowSelected : null]}
                    >
                      <Image source={{ uri: item.imageUrl || undefined }} style={styles.playlistImage} />
                      <View style={styles.playlistTextWrap}>
                        <Text style={styles.playlistTitle}>{item.title}</Text>
                        <Text style={styles.playlistCount}>{(item.totalVideos ?? 0) + " items"}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          <View style={styles.modalFooter}>
            <Button label={selectedPlaylistId ? "Add to playlist" : "Create playlist"} onPress={handleConfirmAddOrCreate}/>
          </View>
        </View>
      </Modal>

      {/* Create Playlist Modal */}
      <Modal visible={showCreatePlaylist} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); }}>
          <View style={styles.overlayBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setShowCreatePlaylist(false); setShowAddPlaylist(true); }}>
              <ChevronLeft color="#553434" size={26} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { marginLeft: 8 }]}>Create playlist</Text>

            {/* empty right element to keep header balanced */}
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.modalContent}>
            <TextInput
              placeholder="Playlist name"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              style={styles.input}
            />
            <Button label="Create Playlist" onPress={handleCreatePlaylistPress}/>
           
          </View>
        </View>
      </Modal>
        {/* toast */}
      {showToast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }),
                },
              ],
            },
          ]}
        >
          <Image source={images.tick} style={{ width: 20, height: 20 }} />
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
    marginBottom: 12,
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

  // toast
 toast: {
  position: "absolute",
  bottom: 60,
  left: "10%",
  right: "10%",
  backgroundColor: "rgba(255,255,255,0.95)",
  borderWidth: 2,
  borderColor: "#553434",
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  zIndex: 9999,          
  elevation: 9999,       
},


  toastText: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 16,
  },

  // modal / overlay
  overlayBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "30%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  modalHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginBottom: 8,
  },

  modalTitle: {
    fontFamily: "KodchasanSemiBold",
    fontSize: 18,
    color: "#553434",
    textAlign: "center",
  },

  modalContent: {
    flex: 1,
    paddingTop: 8,
  },

  noPlaylistContainer: {
    alignItems: "center",
    paddingTop: 24,
  },

  noPlaylistsText: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 16,
  },

  createBtnSecondary: {
    marginTop: 12,
    backgroundColor: "#C76350",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  createBtnText: {
    color: "#fff",
    fontFamily: "KodchasanSemiBold",
  },

  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    justifyContent: "space-between",
  },

  playlistRowSelected: {
    backgroundColor: "#f8e6e0",
    borderRadius: 8,
  },

  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 12,
  },

  playlistTextWrap: {
    flex: 1,
    justifyContent: "center",
  },

  playlistTitle: {
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    fontSize: 16,
  },

  playlistCount: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 12,
  },

  selectCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#553434",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  selectCircleActive: {
    backgroundColor: "#C76350",
    borderColor: "#C76350",
  },

  smallTick: {
    width: 22,
    height: 22,
  },

  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 6,
    justifyContent: "space-between",
    marginTop: 8,
  },

  modalSecondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e6d6d3",
    backgroundColor: "#fff",
  },

  modalSecondaryBtnText: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e6d6d3",
    borderRadius: 8,
    padding: 12,
    fontFamily: "KodchasanMedium",
    marginBottom: 12,
  },
});
