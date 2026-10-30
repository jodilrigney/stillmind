import * as Notifications from "expo-notifications";
import { Image, StyleSheet, Switch, Text, View } from "react-native";
import { Card, PrivacyBadge, SessionShell } from "../src/components/ui";
import { useApp } from "../src/context/AppProvider";
import { FOODS } from "../src/data";
import { imgSource, images } from "../src/images";
import { colors, fonts } from "../src/theme";

async function scheduleDaily(id: string, title: string) {
  try {
    await Notifications.requestPermissionsAsync();
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: "StillMind · a small nourish reminder",
        body: title,
      },
      trigger: { hour: 12, minute: 0, repeats: true, channelId: "still" },
    });
  } catch {}
}

export default function BrainHealth() {
  const { foodReminders, saveFoodReminders } = useApp();

  return (
    <SessionShell title="BRAIN HEALTH" subtitle="Nurture with nature">
      <PrivacyBadge />
      <Text style={styles.copy}>Food first. Supplements optional. Reminders stay local on this device.</Text>
      {FOODS.map((f) => {
        const on = !!foodReminders[f.id];
        return (
          <Card key={f.id} color={f.color} style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
            <Image source={imgSource(images[f.imageKey])} style={styles.img} />
            <View style={{ padding: 14 }}>
              <Text style={styles.title}>{f.title}</Text>
              {f.points.map((p) => (
                <Text key={p} style={styles.point}>
                  • {p}
                </Text>
              ))}
              <View style={styles.row}>
                <Text style={styles.remind}>Daily remind</Text>
                <Switch
                  value={on}
                  onValueChange={async (v) => {
                    const next = { ...foodReminders, [f.id]: v };
                    await saveFoodReminders(next);
                    if (v) await scheduleDaily(f.id, f.title);
                    else await Notifications.cancelScheduledNotificationAsync(f.id).catch(() => {});
                  }}
                  trackColor={{ true: colors.sage }}
                />
              </View>
            </View>
          </Card>
        );
      })}
    </SessionShell>
  );
}

const styles = StyleSheet.create({
  copy: { fontFamily: fonts.body, color: colors.muted, marginVertical: 12, lineHeight: 20 },
  img: { width: "100%", height: 140 },
  title: { fontFamily: fonts.titleBold, fontSize: 20, color: colors.ink, marginBottom: 6 },
  point: { fontFamily: fonts.body, color: colors.ink, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  remind: { fontFamily: fonts.bodyMed, color: colors.ink },
});
