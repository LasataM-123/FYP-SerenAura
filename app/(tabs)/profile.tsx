import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const profile = () => {
  return (
    <View>
      <Text>profile</Text>
      <View>
        <View style={styles.square}></View>
      </View>
    </View>
  )
}

export default profile

const styles = StyleSheet.create({
  square:{
    width:100,
    height:100,
    backgroundColor:'blue',
    boxShadow: '3px 3px 0px rgba(0,0,0)',
    borderRadius:8,
    
  },

})