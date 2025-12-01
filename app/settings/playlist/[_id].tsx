"use client";

import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Pressable,
  PanResponder,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import { deletePlaylist, getPlaylistById, GetPlaylistByIdResponse, removeMediaFromPlaylist } from "@/lib/api/playlist";
import LargeCard from "@/components/MediaCards/LargeCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "@/constants";
import { Trash2, X } from "lucide-react-native";
import { StatusBar } from "react-native";
import Overlay from "@/components/Overlay";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const PlaylistMedia = () => {
  const { total } = useLocalSearchParams();
  const { _id } = useLocalSearchParams<{ _id: string }>();

  // --------------------- HOOKS (always on top) ---------------------
  const [playlist, setPlaylist] = useState<GetPlaylistByIdResponse | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const { refetch, loading } = useBackend({ fn: getPlaylistById });
  const {refetch: removeMedia} = useBackend({
    fn: removeMediaFromPlaylist
  })
  const [showDeleteOverlay,setShowDeleteOverlay] = useState(false);
  const [showCompleteOverlay,setShowCompleteOverlay] = useState(false);

  const {refetch: deleteList} = useBackend({
    fn: deletePlaylist
  }) 

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) sheetY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) closeMenu();
        else openMenu();
      },
    })
  ).current;

  // --------------------- FUNCTIONS ---------------------
  const fetchPlaylist = async () => {
    const res = await refetch({ playlistId: _id });
    if (res?.playlist) setPlaylist(res);
  };

  const openMenu = () => {
    setOverlayVisible(true);
    setMenuVisible(true);

    Animated.timing(sheetY, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(sheetY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      setOverlayVisible(false);
    });
  };

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);

    Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        setShowToast(false)
      );
    }, 1500);
  };

const removeItem = async () => {
  if (!selectedItem) return;

  try {
    await removeMedia({ playlistId: _id, junctionId:selectedItem._id});
    setTimeout(() => {
      closeMenu();
    }, 1000);
    showToastMessage("✅ Removed from favourites");

    setTimeout(() => {
      fetchPlaylist();
    }, 2000);

  } catch (err) {
    showToastMessage("❌ Failed to remove");
  }
};

  useEffect(() => {
    fetchPlaylist();
  }, []);

    const handleDelete = async () => {
      try {
        await deleteList({ id: _id });

        setShowDeleteOverlay(false);

        setShowCompleteOverlay(true);

      } catch (err) {
        console.error(err);
      }
    };

  // --------------------- LOADING ---------------------
  if (loading || !playlist) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#553434" />
      </View>
    );
  }

  const header = playlist.playlist;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle={overlayVisible ? "light-content" : "dark-content"}
        backgroundColor={overlayVisible ? "transparent" : "#fff"}
        translucent={overlayVisible}
      />
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={images.arrowBack} style={styles.backImage} />
      </TouchableOpacity>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerImageWrapper}>
          {header.imageUrl ? (
            <Image source={{ uri: header.imageUrl }} style={styles.headerImage} />
          ) : (
            <View
              style={{
                backgroundColor: "#fff",
                height: 180,
                width: "86%",
                borderRadius: 20,
                borderWidth: 4,
                borderColor: "#553434",
              }}
            />
          )}
        </View>

        <View style={styles.headerBottom}>
          <View>
            <Text style={styles.title}>{header.title}</Text>
            <Text style={styles.subtitle}>{total} videos</Text>
          </View>

          <TouchableOpacity onPress={() => setShowDeleteOverlay(true)}>
            <Trash2 size={22} color="#C76350" />
          </TouchableOpacity>

        </View>
      </View>

      {/* MAIN LIST */}
      <View style={styles.contentWrapper}>
        <FlatList
          data={playlist.media}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <LargeCard
              item={item}
              onOpenMenu={(itm) => {
                setSelectedItem(itm);
                openMenu();
              }}
            />
          )}
        />
      </View>

      {/* OVERLAY */}
      {overlayVisible && <Pressable style={styles.overlayBg} onPress={closeMenu} />}

      {/* BOTTOM SHEET */}
      {menuVisible && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetY }] }]}>
          <View {...panResponder.panHandlers} style={styles.dragHandle} />

          <TouchableOpacity onPress={removeItem} style={{flexDirection:"row", gap:8, alignItems:"center"}}>
            <X color="#553434"/>

            <Text style={styles.bottomItemText}>Remove from Playlist</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* TOAST */}
      {showToast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
      {showDeleteOverlay &&(
        <Overlay title = "Do you want to delete this playlist?" description="This action cannot be undone. All the playlist data will be permanently deleted." crossIcon={true} onClose={()=>setShowDeleteOverlay(false)} imageSource={images.Warning} label="Delete Playlist" onPress={handleDelete} includeOutlinedButton={true} outlineLabel="Cancel" onOutline={()=>{setShowDeleteOverlay(false)}}/>
      )}
      {showCompleteOverlay&&(
        <Overlay title = "Playlist Deleted Successfully!" description="Your playlist has been deleted successfully." imageSource={images.tick} label="Go Back" onPress={()=>router.back()}/>
      )}
    </SafeAreaView>
  );
};

export default PlaylistMedia;

// --------------------- STYLES ---------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  backButton: { paddingHorizontal: 24, marginTop: 16, marginBottom: 16 },
  backImage: { width: 30, height: 30 },

  headerContainer: { width: "100%", backgroundColor: "#e2f2e7", paddingTop: 30, paddingBottom: 20, alignItems: "center" },
  headerImageWrapper: { width: "100%", alignItems: "center", marginBottom: 15 },
  headerImage: { width: "86%", height: 180, borderRadius: 20, borderWidth: 4, borderColor: "#553434",    boxShadow: '3px 3px 0px rgb(85, 52, 52)',
 },

  headerBottom: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24 },
  title: { fontSize: 22, color: "#553434", fontFamily: "KodchasanSemiBold" },
  subtitle: { fontSize: 14, color: "#553434", fontFamily: "KodchasanMedium" },

  contentWrapper: { flex: 1, paddingHorizontal: 24, marginTop: 22 },

  overlayBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 998 },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingTop: 14,
    paddingBottom: 36,
    paddingHorizontal: 26,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 999,
    borderColor: "#553434",
    borderWidth: 4,
  },

  dragHandle: { width: 60, height: 6, backgroundColor: "#553434", alignSelf: "center", borderRadius: 3, marginBottom: 16 },

  bottomItemText: { fontSize: 18, color: "#553434", fontFamily: "KodchasanMedium" },

  toast: { position: "absolute", bottom: 60, left: "10%", right: "10%", backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 3, borderColor: "#553434", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", zIndex: 9999 },
  toastText: { fontFamily: "KodchasanMedium", color: "#553434", fontSize: 16 },
});
