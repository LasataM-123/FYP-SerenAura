import { Tabs } from "expo-router";
import React from "react";
import CustomNavBar from "@/components/CustomNavbar";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{headerShown:false}} tabBar={props=><CustomNavBar {...props}/>}>
      <Tabs.Screen name="home" options={{title:"Home"}}/>
      <Tabs.Screen name="media" options={{title:"Media"}}/>
      <Tabs.Screen name="chat" options={{title:"Chat"}}/>
      <Tabs.Screen name="breathe" options={{title:"Breathe"}}/>
      <Tabs.Screen name="profile" options={{title:"Profile"}}/>
    </Tabs>
      
  );
}
