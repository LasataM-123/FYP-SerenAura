import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import Button from '@/components/Button';

const home = () => {
     const { logout } = useAuthStore();
  const handleLogout = () => {
    logout();
    router.replace("/login"); // Redirect to login screen
  };
  return (
   <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/(tabs)/index.tsx to edit this screen.</Text>
      <Button label="Logout" onPress={handleLogout} />
    </View>
  )
}

export default home

const styles = StyleSheet.create({})