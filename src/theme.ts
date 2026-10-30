export const colors = {
  linen: "#FBF9F5",
  cream: "#FBF9F5",
  creamDeep: "#EDE6D8",
  paper: "rgba(251,249,245,0.78)",
  ink: "#3D3933",
  muted: "#7A7468",
  sage: "#8FA382",
  sageDeep: "#6F8A64",
  sageSoft: "#D7E2CC",
  lavender: "#C9B7D3",
  lavenderSoft: "#E6DDEC",
  peach: "#E8C5B2",
  peachSoft: "#F4E0D4",
  water: "#7DA3B3",
  waterSoft: "#D3E4EB",
  sand: "#E7D7C3",
  gold: "#D4B56A",
  danger: "#C47A6A",
  overlay: "rgba(251,249,245,0.72)",
  glass: "rgba(251,249,245,0.58)",
  glassBorder: "rgba(255,255,255,0.48)",
};

export const fonts = {
  title: "Quicksand_500Medium",
  titleBold: "Quicksand_600SemiBold",
  titleLight: "Quicksand_300Light",
  body: "Nunito_400Regular",
  bodyMed: "Nunito_600SemiBold",
  bodyBold: "Nunito_700Bold",
};

export const radius = {
  sm: 14,
  md: 22,
  lg: 28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: "#3D3933",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
};

export const overlays = {
  light: ["rgba(231,238,242,0.22)", "rgba(244,240,230,0.38)", "rgba(244,240,230,0.82)"] as const,
  airy: ["rgba(231,238,242,0.16)", "rgba(244,240,230,0.28)", "rgba(244,240,230,0.62)"] as const,
  dusk: ["rgba(231,238,242,0.12)", "rgba(244,240,230,0.22)", "rgba(244,240,230,0.55)"] as const,
};
