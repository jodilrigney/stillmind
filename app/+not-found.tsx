import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { colors, fonts } from "../src/theme";

export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.cream }}>
      <Stack.Screen options={{ title: "Missing" }} />
      <Text style={{ fontFamily: fonts.titleBold, color: colors.ink }}>This path isn't in StillMind.</Text>
      <Link href="/(tabs)">
        <Text style={{ fontFamily: fonts.bodyMed, color: colors.sageDeep, marginTop: 12 }}>Come back</Text>
      </Link>
    </View>
  );
}
