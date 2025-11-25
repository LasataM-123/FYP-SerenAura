import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { History, Gem } from 'lucide-react-native'
import { router } from 'expo-router'

const Header = ({ isProfile = false }) => {
  const handlePress = () => {
    if (isProfile) {
      router.push('../premium/premium-screen')
    } else {
      router.push('../chatHistory/chat-history')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>SerenAura</Text>

      <TouchableOpacity onPress={handlePress}>
        {isProfile ? (
          <Gem height={30} width={30} color="#553434" />
        ) : (
          <History height={30} width={30} color="#553434" />
        )}
      </TouchableOpacity>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container:{
      flexDirection:"row",
      justifyContent:"space-between",
      alignItems:"center",
      paddingHorizontal:24
  },
  headerText:{
      color:"#553434",
      fontFamily:"Pacifico",
      fontSize:30
  }
})
