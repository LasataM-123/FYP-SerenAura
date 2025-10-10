import { Tabs } from "expo-router";

export default function CounselorLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="counselor-profile" />
    </Tabs>
  );
}
