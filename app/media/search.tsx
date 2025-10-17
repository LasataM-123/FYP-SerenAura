import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import TagHeader from "@/components/TagHeader";
import MusicSection from "@/components/MusicSection";
import SmallCard from "@/components/MediaCards/SmallCard";
import { useLocalSearchParams } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import {
  getRecentSearch,
  addSearch,
  deleteRecentSearch,
} from "@/lib/api/recentSearch";
import { searchMedia } from "@/lib/api/media";

const TAGS = ["All", "Meditation", "Calm", "Stress relief", "Focus", "Sleep", "Anxiety"];

const SearchScreen = () => {
  const { tag } = useLocalSearchParams();
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // --- Backend hooks ---
  const {
    data: recentSearches,
    loading: loadingRecent,
    refetch: fetchRecentSearches,
  } = useBackend({ fn: getRecentSearch });

  const { refetch: addSearchItem } = useBackend({ fn: addSearch });
  const { refetch: removeSearchItem } = useBackend({ fn: deleteRecentSearch });
  const { refetch: performSearch, loading: searching } = useBackend({
    fn: searchMedia,
  });

  // --- Fetch recent searches when component mounts ---
  useEffect(() => {
    fetchRecentSearches();
  }, []);

  // --- Handle tag from navigation ---
  useEffect(() => {
    if (!tag) return;
    const tagValue = Array.isArray(tag) ? tag[0] : tag;
    const formattedTag = TAGS.find(
      (t) => t.toLowerCase() === tagValue.toLowerCase()
    );
    if (formattedTag) setSelectedTag(formattedTag);
  }, [tag]);

  // --- Handle search manually ---
  const handleSearch = async (
    customTag?: string,
    customKeyword?: string,
    saveRecent: boolean = false
  ) => {
    const activeTag = customTag || selectedTag;
    const searchTerm = (customKeyword ?? keyword).trim();

    if (!searchTerm && activeTag === "All") {
      setHasSearched(false);
      return;
    }

    try {
      const data = await performSearch({
        keyword: searchTerm,
        tag: activeTag.toLowerCase(),
      });
      setSearchResults(data);
      setHasSearched(true);

      // Only save recent if explicitly requested (Go button)
      if (saveRecent && searchTerm.length > 0) {
        await addSearchItem({ content: searchTerm });
        await fetchRecentSearches();
      }
    } catch (error) {
      console.log("Search error:", error);
    }
  };

  // --- Delete recent search ---
  const handleDeleteRecent = async (id: string) => {
    try {
      await removeSearchItem({ id });
      await fetchRecentSearches();
    } catch (error) {
      console.log("Error deleting search:", error);
    }
  };

  // --- Re-run search if tag changes ---
  useEffect(() => {
    if (hasSearched) handleSearch(selectedTag, undefined, false);
  }, [selectedTag]);

  // --- Reset to recents when keyword cleared ---
  useEffect(() => {
    if (keyword.trim().length === 0) {
      setHasSearched(false);
      setSearchResults(null);
    }
  }, [keyword]);

  // --- Render a single recent search item ---
  const renderRecentItem = ({ item }: any) => (
    <View style={styles.recentItem}>
      <TouchableOpacity
        onPress={() => {
          setKeyword(item.content);
          handleSearch("All", item.content, false); // ❌ don't save again
        }}
      >
        <Text style={styles.recentText}>{item.content}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteRecent(item._id)}>
        <X size={18} color="#553434" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Search</Text>

      {/* --- Search Input --- */}
      <View style={styles.searchRow}>
  <TextInput
    style={styles.input}
    placeholder="Search by keyword..."
    value={keyword}
    onChangeText={setKeyword}
    returnKeyType="search"
    onSubmitEditing={() => {
      Keyboard.dismiss(); 
      handleSearch(undefined, undefined, true);
    }}
  />
  <TouchableOpacity
    onPress={() => {
      Keyboard.dismiss(); 
      handleSearch(undefined, undefined, true);
    }}
    style={styles.button}
  >
    <Text style={styles.buttonText}>Go</Text>
  </TouchableOpacity>
</View>


      {/* --- Tag Filter --- */}
      <TagHeader tags={TAGS} selectedTag={selectedTag} onSelect={setSelectedTag} />

      {/* --- Recent Searches --- */}
      {!hasSearched && (
        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {loadingRecent ? (
            <ActivityIndicator color="#553434" style={{ marginTop: 10 }} />
          ) : recentSearches && recentSearches.length > 0 ? (
            <FlatList
              data={recentSearches}
              renderItem={renderRecentItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noResults}>No recent searches yet</Text>
          )}
        </View>
      )}

      {/* --- Search Results --- */}
      {searching ? (
        <ActivityIndicator size="large" color="#553434" style={styles.loading} />
      ) : (
        hasSearched &&
        searchResults &&
        (searchResults.type === "all" ? (
          <View style={styles.resultsContainer}>
            {/* Only show meditations if not empty */}
            {searchResults.data.meditations?.length > 0 && (
              <MusicSection
                title="Meditations"
                data={searchResults.data.meditations}
                onTagSelect={(tag: string) =>
                  setSelectedTag(tag.charAt(0).toUpperCase() + tag.slice(1))
                }
              />
            )}

            {/* Only render non-empty music categories */}
            {Object.entries(searchResults.data.musicByCategory)
              .filter(([_, items]) => Array.isArray(items) && items.length > 0)
              .map(([category, items]) => (
                <MusicSection
                  key={category}
                  title={category}
                  data={items}
                  onTagSelect={(tag: string) =>
                    setSelectedTag(tag.charAt(0).toUpperCase() + tag.slice(1))
                  }
                />
              ))}
          </View>
        ) : (
          <FlatList
            data={searchResults.data}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <SmallCard item={item} />}
            numColumns={2} 
            columnWrapperStyle={{ justifyContent: "space-between" }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 8,
            }}
            ListEmptyComponent={<Text style={styles.noResults}>No results found</Text>}
          />
        ))
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    fontSize: 22,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "KodchasanMedium",
  },
  button: {
    backgroundColor: "#553434",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "KodchasanSemiBold",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    marginBottom: 8,
  },
  recentContainer: {
    marginTop: 4,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  recentText: {
    fontFamily: "KodchasanRegular",
    color: "#553434",
    fontSize: 15,
  },
  resultsContainer: {
    marginBottom: 100,
  },
  loading: {
    marginTop: 20,
    alignSelf: "center",
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    color: "#7D7D7D",
    fontFamily: "KodchasanRegular",
  },
});
