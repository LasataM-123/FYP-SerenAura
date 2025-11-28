import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
} from "react-native";
import { ArrowRight, ChevronRight } from "lucide-react-native";
import { useBackend } from "@/lib/useBackend";
import { getUserPlaylists, GetUserPlaylistsResponse } from "@/lib/api/playlist";
import { SafeAreaView } from "react-native-safe-area-context";
import Top from "@/components/top";
import { router } from "expo-router";


// ---------------------------------------------
// 🔹 COMPONENT FOR EACH ROW (ANIMATED ITEM)
// ---------------------------------------------
const PlaylistRow = ({ item }: { item: GetUserPlaylistsResponse["playlists"][number] }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => 
          router.push({
            pathname: `./${item._id}`,
            params: { total: item.totalVideos }
          })
        }
      >
        <View style={styles.row}>
          {/* Thumbnail */}
      <View style={[styles.thumbnailContainer, { backgroundColor: item.imageUrl ? undefined : '#fff' }]}>
  {item.imageUrl && (
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.thumbnailImage}
      resizeMode="cover"
    />
  )}
</View>



          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{item.title}</Text>
            
          </View>

          <ArrowRight size={30} color="#553434" />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};


// ---------------------------------------------
// 🔹 MAIN SCREEN
// ---------------------------------------------
const Playlists = () => {
  const [playlists, setPlaylists] =
    useState<GetUserPlaylistsResponse["playlists"]>([]);

  const { refetch, loading } = useBackend({
    fn: getUserPlaylists,
  });

  useEffect(() => {
    const fetchPlaylists = async () => {
      const res = await refetch();
      if (res?.playlists) {
        setPlaylists(res.playlists);
      }
    };
    fetchPlaylists();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#553434" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Top label="Playlists" onBack={()=>router.back()} />

      <FlatList
        data={playlists}
        renderItem={({ item }) => <PlaylistRow item={item} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default Playlists;


// ---------------------------------------------
// 🔹 STYLES
// ---------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop:22,
    marginBottom: 12,
  },
  thumbnailContainer: {
  width: 70,
  height: 70,
  borderRadius: 16,
  borderWidth: 3,
  borderColor: "#553434",
  overflow: "hidden",  boxShadow: '2px 2px 0px rgb(85, 52, 52)',

  justifyContent: "center",
  alignItems: "center",
},

thumbnailImage: {
  width: "100%",
  height: "100%",
  borderRadius: 10,     

},
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#553434",
  },

});
