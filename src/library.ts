/**
 * StillMind photo library — curated nature stills for CalmKit pages.
 * Misty lakes and forest reflections preferred; tropical beach scenes left out.
 */
export type LibraryPhoto = {
  id: string;
  title: string;
  mood: string;
  source: number;
  video?: number;
  pages: Array<"tri-calm" | "inhale" | "still-mind" | "land" | "any">;
};

export const LIBRARY: LibraryPhoto[] = [
  {
    id: "heic-a",
    title: "Your still morning",
    mood: "From your camera roll",
    source: require("../assets/library/tri-calm-heic-a.jpg"),
    pages: ["tri-calm", "any"],
  },
  {
    id: "dock-mist",
    title: "Mist at the dock",
    mood: "Soft morning hush",
    source: require("../assets/library/tri-calm-dock-mist.jpg"),
    pages: ["tri-calm", "still-mind", "any"],
  },
  {
    id: "fall-mirror",
    title: "Autumn mirror",
    mood: "Still reflection",
    source: require("../assets/library/tri-calm-fall-mirror.jpg"),
    pages: ["tri-calm", "any"],
  },
  {
    id: "sunset-water",
    title: "Sunset water",
    mood: "Golden hush",
    source: require("../assets/library/tri-calm-sunset-water.jpg"),
    pages: ["tri-calm", "still-mind", "any"],
  },
  {
    id: "river-motion",
    title: "Moving water",
    mood: "Living current",
    source: require("../assets/library/tri-calm-dock-mist.jpg"),
    video: require("../assets/video/river.mp4"),
    pages: ["tri-calm"],
  },
];

export function libraryFor(page: LibraryPhoto["pages"][number]) {
  return LIBRARY.filter((p) => p.pages.includes(page) || p.pages.includes("any"));
}

export function libraryPhoto(id: string) {
  return LIBRARY.find((p) => p.id === id) ?? LIBRARY[0];
}
