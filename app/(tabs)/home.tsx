import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';


const home = () => {
  const today = new Date();
  const {logout} = useAuthStore();
  const name =useAuthStore((state)=>state.name);
  const handle=()=>{
    logout();
    router.replace('/login')
  }
  // Format the date nicely
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",  // Saturday
    month: "short",   // Sept
    day: "numeric",   // 25
    year: "numeric",  // 2025
  });
  return (
    <SafeAreaView style={styles.container}>
    <Header/>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Image source={images.homeImage}/>
          <View style={styles.mainTextContainer}>
            <Text style={styles.mainWelcomeText}>Good Morning, {name}!</Text>
            <Text>{formattedDate}</Text>
            <Image source={images.sunMoon}/>
          </View>
          <Text>Take a deep breath—peace begins with you today.</Text>
        </View>
        <Button label='logout' onPress={handle}/>
      </ScrollView> 
       
      
    </SafeAreaView>
  )
}

export default home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  mainTextContainer:{
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center"

  },
  mainWelcomeText:{
    fontSize:24,
    fontFamily:"KodchasanSemiBold",
    color:'#553434',
  }
})