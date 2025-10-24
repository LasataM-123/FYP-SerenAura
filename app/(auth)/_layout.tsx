import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";

export default function AuthLayout() {
  useEffect(()=>{
        StatusBar.setBarStyle("dark-content", true);
        StatusBar.setBackgroundColor("#fff")
    },[])
  return <Stack screenOptions={{ headerShown: false, statusBarStyle: "dark"}} />;

}
