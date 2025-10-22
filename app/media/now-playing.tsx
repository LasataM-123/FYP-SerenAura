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
  useWindowDimensions,
  StatusBar,

} from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import {
  Play,
  Pause,
  Heart,
  ListPlus,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ListCheck,
  Check,
} from "lucide-react-native";


import { router } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";

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

  const { width } = Dimensions.get("window");
  const { height } = Dimensions.get('window');
  const { width: wWidth, height: wHeight } = useWindowDimensions();

  // player
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

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

  // responsive sizes
  const cdSize = Math.min(wWidth * 0.48, 200);
  const playButtonSize = Math.min(wWidth * 0.18, 88);
  const textSizeTitle = Math.min(wWidth * 0.07, 30);
  const textSizeBy = Math.min(wWidth * 0.045, 18);

  // animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAmp = useRef(new Animated.Value(0)).current;
  const playScale = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  // modal animations
  const addModalAnim = useRef(new Animated.Value(wHeight)).current; // translateY
  const createModalAnim = useRef(new Animated.Value(wWidth)).current; // translateX

  // backend hooks
  const { refetch: checkFavouriteRefetch } = useBackend({ fn: checkFavourite });
  const { refetch: addFavouriteRefetch } = useBackend({ fn: addFavourite });
  const { refetch: getUserPlaylistRefetch } = useBackend({ fn: getUserPlaylists });
  const { refetch: createPlaylistRefetch, error } = useBackend({ fn: createPlaylist });
  const { refetch: addMediaRefetch } = useBackend({ fn: addMediaToPlaylist });
  const { refetch: checkPlaylistsRefetch } = useBackend({ fn: checkPlaylists });

  // initial fetch: favourite, playlist membership, user playlists
  useEffect(() => {
    (async () => {
      try {
        const favRes = await checkFavouriteRefetch({ mediaId: id });
        setIsFavourite(favRes?.isFavourite || false);

        const checkRes = await checkPlaylistsRefetch({ mediaId: id });
        setIsInAnyPlaylist(checkRes?.exists || false);

        const plRes = await getUserPlaylistRefetch();
        const userPlaylists = plRes?.playlists || [];
        setPlaylists(userPlaylists);
      } catch (err) {
        console.log("Error fetching playlists:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    toastAnim.setValue(0);
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
  }, [isPlaying, rotateAnim]);

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
  }, [isPlaying, waveAmp]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    if (audioUrl) loadAndPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // player helpers
  const loadAndPlay = async () => {
    if (!audioUrl) return;
    setLoading(true);
    try {
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
    } catch (err) {
      console.log("Error loading audio:", err);
    } finally {
      setLoading(false);
    }
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
  }, [waveAmp]);

  // ---------- Playlists actions with animated modals ----------

  const openAddPlaylist = async () => {
    StatusBar.setBarStyle("light-content", true);

     if (sound && isPlaying) {
    await sound.pauseAsync();
    setIsPlaying(false);
  }
    setSelectedPlaylistId(null);
    setShowAddPlaylist(true);
    // start hidden below screen and animate up
    addModalAnim.setValue(wHeight);
    Animated.timing(addModalAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeAddPlaylist = async() => {
    Animated.timing(addModalAnim, {
      toValue: wHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowAddPlaylist(false));
    if (sound && !isPlaying) {
    await sound.playAsync();
    setIsPlaying(true);
  }
  };

  const openCreatePlaylist = () => {
    setErrorText("");
    setNewPlaylistName("");
    setShowCreatePlaylist(true);
    createModalAnim.setValue(wWidth);
    Animated.timing(createModalAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

 const closeCreatePlaylist = (returnToAdd = false) => {
  // animate off to the right
  Animated.timing(createModalAnim, {
    toValue: wWidth,             
    duration: 350,
    easing: Easing.inOut(Easing.exp),
    useNativeDriver: true,
  }).start(() => {
    setShowCreatePlaylist(false);
    if (returnToAdd) {
      openAddPlaylist();
      setTimeout(() => triggerToast("Playlist created 🎵"), 320);
    }
    // reset position so next open starts offscreen to the right
    createModalAnim.setValue(wWidth);
  });
};

  const handleConfirmAddOrCreate = async () => {
    if (!selectedPlaylistId) {
      openCreatePlaylist();
      return;
    }

    try {
      await addMediaRefetch({ playlistId: selectedPlaylistId, mediaId: id, mediaType });
      setIsInAnyPlaylist(true);
      // close add modal with animation
      closeAddPlaylist();
      setTimeout(() => triggerToast("Added to playlist 🎶"), 200);
    } catch (err) {
      triggerToast("Failed to add to playlist");
    }
  };

  const handleCreatePlaylistPress = async () => {
  try {
    const res = await createPlaylistRefetch({ title: newPlaylistName.trim() });
    if (res?.playlist) {
      const plRes = await getUserPlaylistRefetch();
      setPlaylists(plRes?.playlists || []);
      closeCreatePlaylist(true);
    } else {
      setErrorText(error || "Failed to create playlist");
    }
  } catch (err) {
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
      openAddPlaylist();
    }
  };

  // ----------------- UI -----------------

  return (
    <SafeAreaView style={[styles.container, { paddingHorizontal: Math.max(16, wWidth * 0.05) }]}>
      {/* header back */}
      <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { left: Math.max(24, wWidth * 0.03), top: Math.max(50, wHeight * 0.035) }]}>
        <Image source={images.cross} style={{ width: Math.min(32, wWidth * 0.08), height: Math.min(32, wWidth * 0.08) }} />
      </TouchableOpacity>

      <Text style={[styles.nowPlaying, { fontSize: Math.min(36, wWidth * 0.09), marginTop: Math.max(28, wHeight * 0.06) }]}>NOW PLAYING</Text>

      {/* CD + Waves */}
      <View style={[styles.cdContainer, { height: cdSize + 100 }]}>
        <Animated.View style={[styles.waveWrapper, { left: wWidth / 2 - cdSize - 40 }]}>
          <Svg height="220" width="140">
            <Path d={wavePath} fill="none" stroke="#553434" strokeWidth="3" strokeLinecap="round" />
          </Svg>
        </Animated.View>

        <View style={[styles.cdShadowLayer, { width: cdSize, height: cdSize, borderRadius: cdSize / 2, top: (cdSize / 3.4), left: (wWidth - cdSize) /2.4 }]} />

        <Animated.View
          style={[
            styles.cdWrapper,
            {
              width: cdSize,
              height: cdSize,
              borderRadius: cdSize / 2,
              transform: [
                {
                  rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
                },
              ],
            },
          ]}
        >
          <Image source={{ uri: imageUrl }} style={[styles.cdImage, { width: cdSize, height: cdSize, borderRadius: cdSize / 2 }]} />
          <View style={[styles.cdCenterShadow, { width: Math.max(28, cdSize * 0.18), height: Math.max(28, cdSize * 0.18), top: 4, left: 4 }]} />
          <View style={[styles.cdCenter, { width: Math.max(28, cdSize * 0.18), height: Math.max(28, cdSize * 0.18) }]} />
        </Animated.View>

        <Animated.View style={[styles.waveWrapper, { right: wWidth / 2 - cdSize - 40 }]}>
          <Svg height="220" width="140">
            <Path d={wavePath} fill="none" stroke="#553434" strokeWidth="3" strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </View>

      {/* song info */}
      <Text style={[styles.title, { fontSize: textSizeTitle }]} numberOfLines={1}>{title}</Text>
      <Text style={[styles.by, { fontSize: textSizeBy }]}>By: {by}</Text>

      {/* controls */}
      <View style={[styles.controlsRow, { marginBottom: Math.max(8, wHeight * 0.01) }]}>
        <TouchableOpacity onPress={handleToggleFavourite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {isFavourite ? <Heart fill="#553434" color="#553434" size={Math.min(28, wWidth * 0.07)} /> : <Heart color="#553434" size={Math.min(28, wWidth * 0.07)} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleTogglePlaylist} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {isInAnyPlaylist ? <ListCheck color="#553434" size={Math.min(28, wWidth * 0.07)} /> : <ListPlus color="#553434" size={Math.min(28, wWidth * 0.07)} />}
        </TouchableOpacity>
      </View>

      {/* slider */}
      <View style={styles.sliderContainer}>
        <Slider
          style={[styles.slider, { width: "100%" }]}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          minimumTrackTintColor="#C76350"
          maximumTrackTintColor="#e0b5a3"
          thumbTintColor="#C76350"
          onSlidingComplete={handleSeek}
        />
        <View style={styles.timeRow}>
          <Text style={[styles.time, { fontSize: Math.min(14, wWidth * 0.035) }]}>{formatTime(position)}</Text>
          <Text style={[styles.time, { fontSize: Math.min(14, wWidth * 0.035) }]}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* main controls */}
      <View style={[styles.mainControls, { gap: Math.min(36, wWidth * 0.06), marginTop: Math.max(12, wHeight * 0.02) }]}>
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
          <RotateCcw size={Math.min(34, wWidth * 0.08)} color="#553434" />
          <Text style={[styles.skipText, { fontSize: Math.min(12, wWidth * 0.03) }]}>10s</Text>
        </TouchableOpacity>

        <TouchableOpacity onPressIn={handlePlayPressIn} onPressOut={handlePlayPressOut} onPress={loadAndPlay} activeOpacity={1}>
          <Animated.View style={[styles.playButtonContainer, { width: playButtonSize, height: playButtonSize, transform: [{ scale: playScale }] }]}>
            <View style={[styles.playShadowLayer, { width: playButtonSize, height: playButtonSize, borderRadius: playButtonSize / 2, top: 2, left: 2 }]} />
            <View style={[styles.playButton, { width: playButtonSize, height: playButtonSize, borderRadius: playButtonSize / 2 }]}>
              {loading ? <Text style={{ color: "#fff" }}>...</Text> : isPlaying ? <Pause size={Math.min(36, playButtonSize * 0.45)} color="#fff" /> : <Play size={Math.min(36, playButtonSize * 0.45)} color="#fff" />}
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
          <RotateCw size={Math.min(34, wWidth * 0.08)} color="#553434" />
          <Text style={[styles.skipText, { fontSize: Math.min(12, wWidth * 0.03) }]}>10s</Text>
        </TouchableOpacity>
      </View>

      {/* ---------- Add Playlist Modal (slide up + overlay) ---------- */}
      <Modal visible={showAddPlaylist} transparent animationType="none" statusBarTranslucent={true}>
        {/* Instant dim background */}
        <TouchableWithoutFeedback onPress={closeAddPlaylist}>
          <View style={styles.overlayBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
               height: height * 0.32, 
              transform: [{ translateY: addModalAnim }],
              paddingHorizontal: Math.max(12, wWidth * 0.04),
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeAddPlaylist}>
              <Image source={images.cross} style={{ width: 28, height: 28 }} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Add to playlist</Text>

            <TouchableOpacity onPress={closeAddPlaylist}>
              <Image source={images.cross} style={{ width: 28, height: 28, opacity: 0 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {playlists.length === 0 ? (
              <View style={styles.noPlaylistContainer}>
                <Text style={styles.noPlaylistsText}>No playlists yet</Text>
          
              </View>
            ) : (
              <FlatList
              data={playlists}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedPlaylistId === item._id;
                return (
                  <TouchableOpacity
                  onPress={() => setSelectedPlaylistId(item._id)}
                  style={[styles.playlistRow, isSelected ? styles.playlistRowSelected : null]}
                >
                  {/* Playlist image */}
                <View style={styles.imageContainer}>
                  <View style={styles.shadowLayer} />
                  <View style={styles.imageWrapper}>
                    <Image
                      source={{uri: item.imageUrl || undefined}}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                    {/* Playlist text */}
                    <View style={styles.playlistTextWrap}>
                      <Text style={styles.playlistTitle}>{item.title}</Text>
                      <Text style={styles.playlistCount}>{(item.totalVideos ?? 0) + " items"}</Text>
                    </View>

                    {/* Circle with tick */}
                    <View style={{ position: "relative", width: 28, height: 28 }}>
                      {/* Shadow Layer */}
                      <View
                        style={{
                          position: "absolute",
                          top: 2,
                          left: 2,
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: "#264B3A",
                          backgroundColor: "#264B3A",
                        }}
                      />
                      
                      {/* Main Circle */}
                      <View
                        style={[
                          styles.selectCircle,
                          isSelected && styles.selectCircleActive,
                        ]}
                      >
                        {isSelected && <Check color="#fff"/>}
                      </View>
                    </View>

                  </TouchableOpacity>
                );
              }}
            />

            )}
          </View>

          <View style={styles.modalFooter}>
            <Button label={selectedPlaylistId ? "Add to playlist" : "Create playlist"} onPress={handleConfirmAddOrCreate} />
          </View>
        </Animated.View>
      </Modal>

      <Modal visible={showCreatePlaylist} transparent animationType="none">
        <Animated.View
          style={[
            styles.createModalOuter,
            {
              width: wWidth,
              
              transform: [{ translateX: createModalAnim }],
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); }}>
            <View style={[styles.modalContainer, {  height: height * 0.3,  borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: Math.max(12, wWidth * 0.06),  }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => { closeCreatePlaylist(false) }} >
                  <Image source={images.arrowBack} style={{width:26, height:26}}/>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { marginLeft: 8 }]}>Create playlist</Text>
                <View style={{ width: 28 }} />
              </View>

              <View style={styles.modalContent}>
              <TextInput
                placeholder="Playlist name"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                style={styles.input}
                placeholderTextColor="#553434"
              />

              {/* Error Message Placeholder */}
              <View style={{ height: 26, marginBottom:2, justifyContent: "center", alignItems: "center" }}>
                {errorText ? (
                  <Text style={styles.errorText}>{errorText}</Text>
                ) : null}
              </View>

              <Button label="Create Playlist" onPress={handleCreatePlaylistPress} />
            </View>

            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
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
    paddingHorizontal: 24
  },

  backButton: {
    position: "absolute",
    zIndex: 10,
  },

  nowPlaying: {
    fontFamily: "Schoolbell",
    color: "#553434",
    textAlign: "center",
  },

  cdContainer: {
    marginVertical: 16,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  cdShadowLayer: {
    position: "absolute",
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#fff",
  },

  cdWrapper: {
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#553434",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    zIndex:100
  },

  cdImage: {
    borderRadius: 999,
  },

  cdCenterShadow: {
    position: "absolute",
  },

  cdCenter: {
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
    color: "#553434",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 8,
  },

  by: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    marginBottom: 6,
    textAlign: "center",
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop:36

  },

  sliderContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 6,
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
    marginTop: 20,
  },

  playButtonContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  playShadowLayer: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 2,
    left: 2,
  },

  playButton: {
    borderRadius: 999,
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
    borderWidth: 3,
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
modalContainer: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "#fff",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  borderColor: "#553434",
  borderWidth: 4, 
  borderBottomWidth: 0,
  overflow: "hidden",
  paddingTop: 12,
  paddingBottom: 10,
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
    maxHeight: 100,
    paddingTop: 8,
    
  },

  noPlaylistContainer: {
    alignItems: "center",
    paddingTop: 24,
  },

  noPlaylistsText: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    textAlign:"center",
    fontSize: 16,
  },

  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    justifyContent: "space-between",
  },

  playlistRowSelected: {
    borderRadius: 8,
  },
   imageContainer: { width: 50, height: 50, position: 'relative' },
  shadowLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 4,
    borderColor: '#553434',
    backgroundColor: '#553434',
    top: 2,
    left: 2,
  },
  imageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#553434',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  errorText: {
  color: "red",
  fontFamily: "KodchasanMedium",
},

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },

  playlistTextWrap: {
    flex: 1,
    justifyContent: "center",
  },

  playlistTitle: {
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    fontSize: 16,
    marginLeft:12
  },

  playlistCount: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 12,
    marginLeft:12

  },

  selectCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#264B3A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  selectCircleActive: {
    backgroundColor: "#1D9D66",
    borderColor: "#264B3A",
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

  input: {
    marginTop:8,
    borderBottomWidth: 1,
  borderBottomColor: "#553434",
    borderRadius: 8,
    padding: 12,
    fontFamily: "KodchasanMedium",
    marginBottom: 12,
  },

  createModalOuter: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
  },
});
