import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts as useNunito,
} from "@expo-google-fonts/nunito";
import {
  Quicksand_300Light,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  useFonts as useQuicksand,
} from "@expo-google-fonts/quicksand";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, useWindowDimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "../src/context/AppProvider";
import { useAppLandscape } from "../src/landscape";
import { colors } from "../src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [nunito] = useNunito({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold });
  const [quicksand] = useQuicksand({
    Quicksand_300Light,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
  });
  const ready = nunito && quicksand;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={[fill, { backgroundColor: "#E7DFD0" }]}>
      <AppProvider>
        <StatusBar style="dark" />
        <PhoneFrame>
          <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
        </PhoneFrame>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const fill = { flex: 1, width: "100%" as const, height: "100%" as const };

function PhoneFrame({ children }: { children: React.ReactNode }) {
  const flagged = useAppLandscape();
  const pathname = usePathname();
  const landscape = flagged || pathname === "/follow" || pathname === "/tri-calm";
  const { width: vw, height: vh } = useWindowDimensions();
  const turn = useRef(new Animated.Value(landscape ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(turn, {
      toValue: landscape ? 1 : 0,
      duration: 860,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [landscape, turn]);

  if (Platform.OS !== "web") {
    return <View style={[fill, { backgroundColor: colors.linen }]}>{children}</View>;
  }

  if (landscape && vw >= vh) {
    return <View style={[fill, { backgroundColor: colors.linen }]}>{children}</View>;
  }

  if (landscape && vh > vw) {
    return (
      <View style={[fill, { backgroundColor: "#0E1612", overflow: "hidden" }]}>
        <View
          style={{
            position: "absolute",
            width: vh,
            height: vw,
            top: (vh - vw) / 2,
            left: (vw - vh) / 2,
            transform: [{ rotate: "90deg" }],
            transformOrigin: "center",
            backgroundColor: colors.linen,
            overflow: "hidden",
          }}
        >
          {children}
        </View>
      </View>
    );
  }

  const width = turn.interpolate({ inputRange: [0, 1], outputRange: [390, 844] });
  const height = turn.interpolate({ inputRange: [0, 1], outputRange: [844, 390] });
  const scale = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.93, 1] });
  const rotate = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["0deg", "-16deg", "0deg"] });

  return (
    <View pointerEvents="box-none" style={[fill, { alignItems: "center", justifyContent: "center", backgroundColor: "#E7DFD0" }]}>
      <Animated.View
        style={{
          width,
          height,
          transform: [{ scale }, { rotate }],
          borderRadius: 42,
          overflow: "hidden",
          backgroundColor: colors.linen,
          borderWidth: 10,
          borderColor: "#1F1C1A",
        }}
      >
        <View style={fill}>{children}</View>
      </Animated.View>
    </View>
  );
}
