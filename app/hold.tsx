import { Redirect } from "expo-router";

export default function Hold() {
  return <Redirect href={{ pathname: "/ground", params: { mode: "hold" } }} />;
}
