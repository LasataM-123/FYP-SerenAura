import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '@/components/Header'

const Chat = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header/>
    </SafeAreaView>
  )
}

export default Chat

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
})