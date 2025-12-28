import CounselorNavBar from "@/components/CounselorNavbar";
import CustomNavBar from "@/components/CustomNavbar";
import { Tabs, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { StatusBar } from "react-native";

export default function CounselorLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={props=><CounselorNavBar {...props}/>}>
      <Tabs.Screen name="requests" options={{title:"Requests"}} />
      <Tabs.Screen name="user-chat" options={{title:"Chat"}} />
      <Tabs.Screen name="counselor-profile"  options={{title:"Profile"}} />
    </Tabs>
  );
}
