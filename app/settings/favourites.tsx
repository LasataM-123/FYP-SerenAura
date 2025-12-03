"use client";

import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Pressable,
  PanResponder,
  Dimensions,
  ScrollView,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useBackend } from "@/lib/useBackend";

import LargeCard from "@/components/MediaCards/LargeCard";
import { SafeAreaView } from "react-native-safe-area-context";
import Top from "@/components/top";
import { getFavourites, GetFavouritesResponse, removeFavourite } from "@/lib/api/favourite";
import { StatusBar } from "react-native";
import { router } from "expo-router";
import { Cross, X } from "lucide-react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const PlaylistMedia = () => {
  const [favourite, setFavourite] = useState<GetFavouritesResponse | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const { refetch, loading } = useBackend({ fn: getFavourites });

  const {refetch:deleteFav} = useBackend({
    fn: removeFavourite
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
  const fetchFavourite = async () => {
    const res = await refetch();
    if (res?.favourites) setFavourite(res);
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
    setTimeout(() => {
      closeMenu();
    }, 500);
    await deleteFav({ id: selectedItem._id });
    showToastMessage("✅ Removed from favourites");

    setTimeout(() => {
      fetchFavourite();
    }, 2000);

  } catch (err) {
    showToastMessage("❌ Failed to remove");
  }
};

  useEffect(() => {
    fetchFavourite();
  }, []);

  if (loading || !favourite) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#553434" />
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.safe}>
        <StatusBar
  barStyle={overlayVisible ? "light-content" : "dark-content"}
  backgroundColor={overlayVisible ? "transparent" : "#fff"}
  translucent={overlayVisible}
/>
        <ScrollView contentContainerStyle={{paddingHorizontal:24}}>

     <Top label="Favourites" onBack={()=>router.back()}/>
      {!loading && favourite?.favourites?.length === 0 && (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No favourites yet</Text>
  </View>
)}

      {/* MAIN LIST */}
      <View style={styles.contentWrapper}>
        <FlatList
          data={favourite.favourites}
          scrollEnabled={false}
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

        </ScrollView>
      {/* OVERLAY */}
      {overlayVisible && <Pressable style={styles.overlayBg} onPress={closeMenu} />}

      {/* BOTTOM SHEET */}
      {menuVisible && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetY }] }]}>
          <View {...panResponder.panHandlers} style={styles.dragHandle} />

          <TouchableOpacity onPress={removeItem} style={{flexDirection:"row", gap:8, alignItems:"center"}}>
            <X color="#553434"/>
            <Text style={styles.bottomItemText}>Remove from Favourite</Text>
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
    </SafeAreaView>
  );
};

export default PlaylistMedia;

// --------------------- STYLES ---------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
   emptyContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  marginTop: 50,
},
emptyText: {
  fontSize: 18,
  color: "#553434",
  fontFamily: "KodchasanSemiBold",
  opacity: 0.7,
},


  headerContainer: { width: "100%", backgroundColor: "#e2f2e7", paddingTop: 30, paddingBottom: 20, alignItems: "center" },
  headerImageWrapper: { width: "100%", alignItems: "center", marginBottom: 15 },
  headerImage: { width: "86%", height: 180, borderRadius: 20, borderWidth: 4, borderColor: "#553434",    boxShadow: '3px 3px 0px rgb(85, 52, 52)',
 },

  headerBottom: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24 },
  title: { fontSize: 22, color: "#553434", fontFamily: "KodchasanSemiBold" },
  subtitle: { fontSize: 14, color: "#553434", fontFamily: "KodchasanMedium" },

  contentWrapper: { flex: 1,  marginTop: 22 },

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

  bottomItemText: { fontSize: 18, color: "#553434", fontFamily: "KodchasanMedium",  },

  toast: { position: "absolute", bottom: 60, left: "10%", right: "10%", backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 3, borderColor: "#553434", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", zIndex: 9999 },
  toastText: { fontFamily: "KodchasanMedium", color: "#553434", fontSize: 16 },
});
