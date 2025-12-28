import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import TagHeader from "@/components/TagHeader";
import { SearchIcon } from "lucide-react-native";
import { useBackend } from "@/lib/useBackend";
import { getFilteredMedia } from "@/lib/api/media";
import MusicSection from "@/components/MusicSection";
import SmallCard from "@/components/MediaCards/SmallCard";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

const TAGS = ["All", "Meditation", "Calm", "Stress relief", "Focus", "Sleep", "Anxiety"];

const Library = () => {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#FFFFFF");
    }, [])
  );
  const { tag } = useLocalSearchParams(); 
  const initialTag = Array.isArray(tag) ? tag[0] : tag;
const [selectedTag, setSelectedTag] = useState(
  initialTag
    ? initialTag.charAt(0).toUpperCase() + initialTag.slice(1)
    : "All"
);


  // Set tag when navigated from MusicSection
  useEffect(() => {
  if (!tag) return;

  // Ensure tag is a string (not string[])
  const tagValue = Array.isArray(tag) ? tag[0] : tag;
  const formattedTag = tagValue.charAt(0).toUpperCase() + tagValue.slice(1);

  if (TAGS.includes(formattedTag)) {
    setSelectedTag(formattedTag);
  }
}, [tag]);


  const { data, error, loading, refetch } = useBackend({
    fn: () => getFilteredMedia({ category: selectedTag }),
  });

  useEffect(() => {
    refetch({ category: selectedTag });
  }, [selectedTag]);
  

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        <View style={styles.screenHeader}>
          <Text style={styles.headerText}>Relax Your Mind</Text>
          <TouchableOpacity onPress={()=>router.push('/media/search')}>

          <SearchIcon color="#553434" />
          </TouchableOpacity>
        </View>

        <TagHeader tags={TAGS} selectedTag={selectedTag} onSelect={setSelectedTag} />

        {loading && (
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <ActivityIndicator size="large" color="#553434" />
          </View>
        )}

        {error && (
          <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
            Error loading data: {error.toString()}
          </Text>
        )}

        {!loading && data && (
          <>
            {data.type === "all" && (
              <View style={{ marginBottom: 100 }}>
                <MusicSection title="Meditations" data={data.data.meditations} />
                {Object.entries(data.data.musicByCategory).map(([category, items]) => (
                  <MusicSection key={category} title={category} data={items} 
                  />
                ))}
              </View>
            )}

            {(data.type === "music" || data.type === "meditation") && (
              <View style={styles.cardGrid}>
                {data.data.length > 0 ? (
                  data.data.map((item) => <SmallCard key={item._id} item={item} />)
                ) : (
                  <Text style={styles.emptyText}>No results found</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Library;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
  },
  headerText: {
    fontFamily: "KodchasanSemiBold",
    fontSize: 22,
    color: "#553434",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom:100
  },
  emptyText: {
    color: "#553434",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    fontFamily:"Schoolbell"
  },
});
