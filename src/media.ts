import { ImageSourcePropType } from "react-native";

export const photos = {
  fog: require("../assets/nature/fog.jpg"),
  pond: require("../assets/nature/lakestill.jpg"),
  fuji: require("../assets/nature/creek.jpg"),
  forest: require("../assets/nature/stream.jpg"),
  water: require("../assets/nature/water.jpg"),
  shore: require("../assets/nature/river2.jpg"),
  ocean: require("../assets/nature/ocean.jpg"),
  breath: require("../assets/nature/shore.jpg"),
  leaves: require("../assets/nature/garden.jpg"),
  window: require("../assets/nature/window.jpg"),
  calm: require("../assets/nature/waves2.jpg"),
  stream: require("../assets/nature/pexels-river.jpg"),
  mistyLake: require("../assets/nature/mistylake.jpg"),
  bilateralCollar: require("../assets/images/bilateral-collar.jpg"),
  bilateralArms: require("../assets/images/bilateral-arms.jpg"),
  landWindow: require("../assets/images/land-window.jpg"),
};

export const videos = {
  river: require("../assets/video/river.mp4"),
  waves: require("../assets/video/waves.mp4"),
};

export const sounds = {
  forest: require("../assets/audio/forest.mp3"),
  stream: require("../assets/audio/quiet-forest.mp3"),
  wind: require("../assets/audio/forest-wind.mp3"),
};

export const images = {
  lake: photos.calm,
  mist: photos.mistyLake,
  beach: photos.shore,
  shore: photos.shore,
  forest: photos.fog,
  moss: photos.fog,
  stones: photos.fuji,
  cabin: photos.ocean,
  stream: photos.stream,
  ripple: photos.water,
  pools: photos.water,
  dappled: photos.fog,
  window: photos.window,
  light: photos.window,
  rain: photos.fog,
  flowers: photos.leaves,
  tea: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=900&q=80",
  salmon: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=80",
  eggs: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=900&q=80",
  saffron: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&q=80",
  greens: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=900&q=80",
  walnuts: "https://images.unsplash.com/photo-1524593166156-312f362cada0?w=900&q=80",
  berries: "https://images.unsplash.com/photo-1498557850523-fd3d118b246e?w=900&q=80",
};

export type ImageKey = keyof typeof images;

export function imgSource(src: unknown): ImageSourcePropType {
  if (typeof src === "number") return src;
  if (typeof src === "string") return { uri: src };
  if (src && typeof src === "object") {
    const value = src as { uri?: string; default?: unknown };
    if (typeof value.uri === "string") return src as ImageSourcePropType;
    if (value.default !== undefined) return imgSource(value.default);
  }
  return { uri: "" };
}
