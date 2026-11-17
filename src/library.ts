/**
 * StillMind photo library — curated nature stills for CalmKit pages.
 */
export type LibraryPhoto = {
  id: string;
  title: string;
  mood: string;
  source: number;
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
    id: "sunset-water",
    title: "Sunset water",
    mood: "Golden hush",
    source: require("../assets/library/tri-calm-sunset-water.jpg"),
    pages: ["tri-calm", "still-mind", "any"],
  },
];

export function libraryFor(page: LibraryPhoto["pages"][number]) {
  return LIBRARY.filter((p) => p.pages.includes(page) || p.pages.includes("any"));
}

export function libraryPhoto(id: string) {
  return LIBRARY.find((p) => p.id === id) ?? LIBRARY[0];
}
