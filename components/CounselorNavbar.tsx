import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import {
  ClipboardList,
  MessageCircleMore,
  CircleUserRound,
  MessageCircle,
  Mail,
} from "lucide-react-native";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const PRIMARY_COLOR = "#fff";
const SECONDARY_COLOR = "#553434";

const CounselorNavBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        // skip non-page routes
        if (["_sitemap", "+not-found"].includes(route.name)) return null;

        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <AnimatedTouchableOpacity
            key={route.key}
            onPress={onPress}
            layout={LinearTransition.springify().mass(0.5)}
            style={[
              styles.tabItem,
              { backgroundColor: isFocused ? SECONDARY_COLOR : "transparent" },
            ]}
          >
            {getIconByRouteName(
              route.name,
              isFocused ? PRIMARY_COLOR : SECONDARY_COLOR
            )}
            {isFocused && (
              <Animated.Text
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.text}
              >
                {label as string}
              </Animated.Text>
            )}
          </AnimatedTouchableOpacity>
        );
      })}
    </View>
  );
};

function getIconByRouteName(routeName: string, color: string) {
  const iconProps = { color, size: 26 };

  switch (routeName) {
    case "requests":
      return <Mail {...iconProps} />;
    case "user-chat":
      return <MessageCircleMore {...iconProps} />;
    case "counselor-profile":
      return <CircleUserRound {...iconProps} />;
    default:
      return <Mail {...iconProps} />;
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFE5D9",
    width: "75%", // 🔹 reduced width
    alignSelf: "center",
    height: 70, // slightly smaller height
    bottom: 20,
    borderColor: SECONDARY_COLOR,
    borderWidth: 3,
    borderRadius: 20,
    paddingHorizontal: 10,
    shadowColor: "#553434",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  tabItem: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  text: {
    color: PRIMARY_COLOR,
    marginLeft: 8,
    fontWeight: "500",
    fontFamily: "KodchasanSemiBold",
  },
});

export default CounselorNavBar;
