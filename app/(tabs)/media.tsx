import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/Header'
import TagHeader from '@/components/TagHeader'
const TAGS = ["All", "Meditation", "Calm", "Stress", "Focus", "Sleep"];

const library = () => {
    const [selectedTag, setSelectedTag] = useState("All");

  return (
    <SafeAreaView style={styles.container}>
      <Header/>
        <TagHeader
        tags={TAGS}
        selectedTag={selectedTag}
        onSelect={setSelectedTag}
      />
    </SafeAreaView>
  )
}

export default library

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
})