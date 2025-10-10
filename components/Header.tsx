import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { History } from 'lucide-react-native'

const Header = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>SerenAura</Text>
      <History height={30} width={30} color="#553434"/>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
    container:{
        paddingTop:2,
        position:"fixed",
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