import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../src/theme";

function TabIcon({
  name,
  label,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.item, focused && styles.itemOn]}>
      <Ionicons name={name} size={18} color={focused ? colors.sageDeep : colors.muted} />
      <Text style={[styles.label, focused && styles.labelOn]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="leaf-outline" label="CalmKit" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="meditate"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="flower-outline" label="Meditate" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="stats-chart-outline" label="Track" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="book-outline" label="Tools" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "rgba(251,249,245,0.92)",
    borderTopColor: "transparent",
    height: 78,
    paddingTop: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 72,
  },
  itemOn: { backgroundColor: colors.sageSoft },
  label: { fontFamily: fonts.bodyMed, fontSize: 10, color: colors.muted, marginTop: 2 },
  labelOn: { color: colors.sageDeep },
});
