"use client";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import { getPlaylistById, GetPlaylistByIdResponse } from "@/lib/api/playlist";
import { Trash2 } from "lucide-react-native";
import LargeCard from "@/components/MediaCards/LargeCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "@/constants";

const PlaylistMedia = () => {
  const { total } = useLocalSearchParams();
  const { _id } = useLocalSearchParams<{ _id: string }>();
  const [playlist, setPlaylist] = useState<GetPlaylistByIdResponse | null>(null);

  const { refetch, loading } = useBackend({
    fn: getPlaylistById,
  });

  useEffect(() => {
    const fetchPlaylist = async () => {
      const res = await refetch({ playlistId: _id });
      if (res?.playlist) {
        setPlaylist(res);
      }
    };
    fetchPlaylist();
  }, []);

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
      
       <TouchableOpacity onPress={()=>router.back()} style={styles.backButton}>
              <Image source={images.arrowBack} style={styles.backImage} />
            </TouchableOpacity>
      <View style={styles.headerContainer}>

        <View
          style={[
            styles.headerImageWrapper,
            !header.imageUrl && { backgroundColor: "#fff", height: 180, width:"86%", borderRadius:20, borderWidth: 4,
    borderColor:"#553434",
    boxShadow: '3px 3px 0px rgb(85, 52, 52)', } 
          ]}
        >
          {header.imageUrl && (
            <Image
              source={{ uri: header.imageUrl }}
              style={styles.headerImage}
            />
          )}
        </View>


        {/* Title + Trash Icon */}
        <View style={styles.headerBottom}>
          <View>
            <Text style={styles.title}>{header.title}</Text>
            <Text style={styles.subtitle}>{total} videos</Text>
          </View>

          <TouchableOpacity>
            <Trash2 size={22} color="#C76350" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------------- CONTENT WITH PADDING ---------------- */}
      <View style={styles.contentWrapper}>
        <FlatList
          data={playlist.media}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => <LargeCard item={item} />}
        />
      </View>

    </SafeAreaView>
  );
};

export default PlaylistMedia;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",

  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    paddingHorizontal:24,
    marginTop:16, 
    marginBottom:16
  },
  backImage: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },

  /* HEADER */
  headerContainer: {
    width: "100%",
    backgroundColor: "#e2f2e7",
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: "center",
  },

  headerImageWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },

  headerImage: {
    width: "86%",
    height: 180,
    borderRadius: 20,
    borderWidth: 4,
    borderColor:"#553434",
    boxShadow: '3px 3px 0px rgb(85, 52, 52)',


  },

  headerBottom: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal:24
  },

  title: {
    fontSize: 22,
    color: "#553434",
    fontFamily:"KodchasanSemiBold"
  },

  subtitle: {
    fontSize: 14,
    color: "#553434",
    fontFamily:"KodchasanMedium"

  },

  /* CONTENT */
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop:22
  },
});
