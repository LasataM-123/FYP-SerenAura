import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/Button';

const requests = () => {
 const { logout } = useAuthStore();
     const userId = useAuthStore((state) => state.accessToken);
     const role = useAuthStore((state) => state.role);
  const handleLogout = () => {
    logout();
    router.replace("/login"); 
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
      <Button label="Click" onPress={() => console.log(userId, role)} />
    </View>
  )
}

export default requests

const styles = StyleSheet.create({})