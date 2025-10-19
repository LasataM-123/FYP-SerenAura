import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock4, Lightbulb, SearchIcon, X } from "lucide-react-native";
import TagHeader from "@/components/TagHeader";
import MusicSection from "@/components/MusicSection";
import SmallCard from "@/components/MediaCards/SmallCard";
import { router, useLocalSearchParams } from "expo-router";
import { useBackend } from "@/lib/useBackend";
import {
  getRecentSearch,
  addSearch,
  deleteRecentSearch,
  suggestRecentSearch,
} from "@/lib/api/recentSearch";
import { searchMedia } from "@/lib/api/media";
import { images } from "@/constants";

const TAGS = ["All", "Meditation", "Calm", "Stress relief", "Focus", "Sleep", "Anxiety"];

const SearchScreen = () => {
  const { tag } = useLocalSearchParams();
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const skipNextSuggestion = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const {
    data: recentSearches,
    loading: loadingRecent,
    refetch: fetchRecentSearches,
  } = useBackend({ fn: getRecentSearch });

  const { refetch: addSearchItem } = useBackend({ fn: addSearch });
  const { refetch: removeSearchItem } = useBackend({ fn: deleteRecentSearch });
  const { refetch: performSearch, loading: searching } = useBackend({ fn: searchMedia });

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  useEffect(() => {
    if (!tag) return;
    const tagValue = Array.isArray(tag) ? tag[0] : tag;
    const formattedTag = TAGS.find((t) => t.toLowerCase() === tagValue.toLowerCase());
    if (formattedTag) setSelectedTag(formattedTag);
  }, [tag]);

  // Auto-focus on screen load
  useEffect(() => {
    const showKeyboard = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(showKeyboard);
  }, []);

  // Handle live suggestions
  useEffect(() => {
    if (skipNextSuggestion.current) {
      skipNextSuggestion.current = false;
      return;
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (keyword.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    typingTimeout.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const res = await suggestRecentSearch({ query: keyword });
        setSuggestions(res);
      } catch (error) {
        console.log("Suggestion error:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }, [keyword]);

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

    setHasSearched(true);
    Keyboard.dismiss();

    try {
      const data = await performSearch({
        keyword: searchTerm,
        tag: activeTag.toLowerCase(),
      });

      setSearchResults(data);
      setSuggestions([]);

      if (saveRecent && searchTerm.length > 0) {
        await addSearchItem({ content: searchTerm });
        await fetchRecentSearches();
      }
    } catch (error) {
      console.log("Search error:", error);
    }
  };

  const handleDeleteRecent = async (id: string) => {
    try {
      await removeSearchItem({ id });
      await fetchRecentSearches();
    } catch (error) {
      console.log("Error deleting search:", error);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    try {
      await removeSearchItem({ id });
      const res = await suggestRecentSearch({ query: keyword });
      setSuggestions(res);
    } catch (error) {
      console.log("Error deleting suggestion:", error);
    }
  };

  useEffect(() => {
    if (hasSearched) handleSearch(selectedTag, undefined, false);
  }, [selectedTag]);

  useEffect(() => {
    if (keyword.trim().length === 0) {
      setHasSearched(false);
      setSearchResults(null);
    }
  }, [keyword]);

  const renderRecentItem = ({ item }: any) => (
    <View style={styles.recentItem}>
      <TouchableOpacity
        onPress={() => {
          setHasSearched(true);
          setKeyword(item.content);
          handleSearch("All", item.content, false);
        }}
      >
        <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
          <SearchIcon color="#553434" size={18} />
          <Text style={styles.recentText}>{item.content}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteRecent(item._id)}>
        <X size={18} color="#553434" />
      </TouchableOpacity>
    </View>
  );

  const renderSuggestionItem = ({ item }: any) => (
    <View style={styles.recentItem}>
      <TouchableOpacity
        onPress={() => {
          skipNextSuggestion.current = true;
          setHasSearched(true);
          setKeyword(item.content);
          setSuggestions([]);
          handleSearch("All", item.content, true);
        }}
      >
        <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
          <SearchIcon color="#553434" size={18} />
          <Text style={styles.recentText}>{item.content}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteSuggestion(item._id)}>
        <X size={18} color="#553434" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image source={images.arrowBack} style={styles.backImage} />
          </TouchableOpacity>

          {/* --- Search Input Row --- */}
          <View style={styles.searchRow}>
            <View style={styles.inputWrapper}>
              <View style={styles.shadowLayer} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Search by keyword..."
                value={keyword}
                onChangeText={setKeyword}
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(undefined, undefined, true)}
              />
            </View>

            <TouchableOpacity
              onPress={() => handleSearch(undefined, undefined, true)}
              style={styles.button}
            >
             <SearchIcon color="#fff" size={18}/>
            </TouchableOpacity>
          </View>

          {/* --- Tag Filter --- */}
          <TagHeader tags={TAGS} selectedTag={selectedTag} onSelect={setSelectedTag} />

          {/* --- Live Suggestions --- */}
          {!loadingSuggestions && suggestions.length > 0 && !hasSearched && (
            <>
             <View style={{flexDirection:"row",gap:4, alignItems:"center"}}>
                <Lightbulb color="#553434" size={24}/>
                <Text style={styles.sectionTitle}>Suggestions</Text>
              </View>
              <FlatList
                data={suggestions}
                renderItem={renderSuggestionItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingVertical: 8 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            </>
          )}

          {/* --- Recent Searches --- */}
          {!hasSearched && !searching && suggestions.length === 0 && (
            <View style={styles.recentContainer}>
              <View style={{flexDirection:"row",gap:4, alignItems:"center"}}>
                <Clock4 color="#553434" size={24}/>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
              </View>
              {loadingRecent ? (
                <ActivityIndicator color="#553434" style={{ marginTop: 10 }} />
              ) : recentSearches && recentSearches.length > 0 ? (
                <FlatList
                  data={recentSearches}
                  renderItem={renderRecentItem}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ paddingBottom: 8 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
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
            searchResults && (
              searchResults.type === "all" ? (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.resultsContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {searchResults.data.meditations?.length > 0 && (
                    <MusicSection
                      title="Meditations"
                      data={searchResults.data.meditations}
                      onTagSelect={(tag: string) =>
                        setSelectedTag(tag.charAt(0).toUpperCase() + tag.slice(1))
                      }
                    />
                  )}
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
                </ScrollView>
              ) : (
                <FlatList
                  data={searchResults.data}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => <SmallCard item={item} />}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: "space-between" }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  ListEmptyComponent={<Text style={styles.noResults}>No results found</Text>}
                  keyboardShouldPersistTaps="handled"
                />
              )
            )
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  backButton: {
    paddingTop: 4,
    marginBottom: 16,
  },
  backImage: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
    height: 48,
  },
  shadowLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#fff",
    top: 2,
    left: 2,
    zIndex: 0,
  },
  input: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "KodchasanMedium",
    width: "100%",
    height: "100%",
    borderWidth: 3,
    borderColor: "#553434",
    backgroundColor: "#fff",
    position: "relative",
    zIndex: 1,
  },
  button: {
    backgroundColor: "#553434",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
    marginBottom: 8,
  },
  recentContainer: {
    marginTop: 2,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderColor: "#553434",
  },
  recentText: {
    fontFamily: "KodchasanMedium",
    color: "#553434",
    fontSize: 15,
  },
  resultsContainer: {
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  loading: {
    marginTop: 20,
    alignSelf: "center",
  },
  noResults: {
    textAlign: "center",
    marginTop: 10,
    color: "#7D7D7D",
    fontFamily: "KodchasanRegular",
  },
});
