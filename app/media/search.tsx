import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TagHeader from "@/components/TagHeader";
import { API_URL } from "@/config";

const TAGS = ["All", "Meditation", "Calm", "Stress relief", "Focus", "Sleep", "Anxiety"];

const SearchScreen = () => {
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async (customTag?: string) => {
    const activeTag = customTag || selectedTag;
    if (!keyword && activeTag === "All") return;

    setSearching(true);
    try {
      const queryParams = new URLSearchParams();
      if (keyword) queryParams.append("keyword", keyword);
      if (activeTag !== "All") queryParams.append("tag", activeTag);

      const response = await fetch(`${API_URL}/media/search?${queryParams.toString()}`);
      const data = await response.json();
      setResults(data?.data || []);
    } catch (error) {
      console.log("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  // Automatically refetch when tag changes
  useEffect(() => {
    handleSearch(selectedTag);
  }, [selectedTag]);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.image} />}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>
        {item.type} • {item.moodCategory}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Search</Text>

      {/* Keyword search input */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search by keyword..."
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch()}
        />
        <TouchableOpacity onPress={() => handleSearch()} style={styles.button}>
          <Text style={styles.buttonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Tag selection */}
      <TagHeader tags={TAGS} selectedTag={selectedTag} onSelect={setSelectedTag} />

      {/* Results */}
      {searching ? (
        <ActivityIndicator size="large" color="#553434" style={{ marginTop: 20 }} />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item: any) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      ) : (
        <Text style={styles.noResults}>No results found</Text>
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingTop: 20,
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
  card: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#FFF",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "KodchasanSemiBold",
    color: "#553434",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "KodchasanRegular",
    color: "#7D7D7D",
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    color: "#7D7D7D",
    fontFamily: "KodchasanRegular",
  },
});
