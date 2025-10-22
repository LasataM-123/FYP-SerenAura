import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";

export default function AuthLayout() {
  useEffect(()=>{
        StatusBar.setBarStyle("dark-content", true);
    },[])
  return (
   <Stack screenOptions={{ headerShown: false }} />
  );
}
