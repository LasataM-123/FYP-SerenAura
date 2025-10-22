import { Tabs } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";

export default function CounselorLayout() {
  useEffect(()=>{
        StatusBar.setBarStyle("dark-content", true);
    },[])
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="counselor-profile" />
    </Tabs>
  );
}
