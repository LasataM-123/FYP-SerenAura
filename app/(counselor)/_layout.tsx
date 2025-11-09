import CounselorNavBar from "@/components/CounselorNavbar";
import CustomNavBar from "@/components/CustomNavbar";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";

export default function CounselorLayout() {
  useEffect(()=>{
        StatusBar.setBarStyle("dark-content", true);
    },[])
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={props=><CounselorNavBar {...props}/>}>
      <Tabs.Screen name="requests" options={{title:"Requests"}} />
      <Tabs.Screen name="user-chat" options={{title:"Chat"}} />
      <Tabs.Screen name="counselor-profile"  options={{title:"Profile"}} />
    </Tabs>
  );
}
