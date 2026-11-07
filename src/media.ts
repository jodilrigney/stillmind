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
  mossyStream: require("../assets/nature/lakestill.jpg"),
  bilateralCollar: require("../assets/images/bilateral-collar.png"),
  bilateralArms: require("../assets/images/bilateral-arms.png"),
  eftHand: require("../assets/images/eft-hand.png"),
  eftFigure: require("../assets/images/eft-figure-still.png"),
  tappingGlowing: require("../assets/images/tapping-arms.png"),
  tappingCollar: require("../assets/images/tapping-collar-v7.png"),
  tappingArms: require("../assets/images/tapping-arms.png"),
  stillLake: require("../assets/images/still-lake-dock.jpg"),
  landWindow: require("../assets/images/land-window.jpg"),
  triCalmPool: require("../assets/library/tri-calm-heic-a.jpg"),
  triCalmMist: require("../assets/library/tri-calm-dock-mist.jpg"),
  triCalmStones: require("../assets/library/tri-calm-lake-stones.jpg"),
};

export const videos = {
  river: require("../assets/video/river.mp4"),
  waves: require("../assets/video/waves.mp4"),
};

export const sounds = {
  forest: require("../assets/audio/forest.mp3"),
  stream: require("../assets/audio/place-of-calm.mp3"),
  wind: require("../assets/audio/forest-wind.mp3"),
  brook: require("../assets/audio/brook.mp3"),
  riverQuiet: require("../assets/audio/river-quiet.mp3"),
  breezeTrees: require("../assets/audio/breeze-trees.mp3"),
  streamSoft: require("../assets/audio/stream-soft.mp3"),
};

export const images = {
  lake: photos.calm,
  mist: photos.mistyLake,
  beach: photos.shore,
  shore: photos.shore,
  forest: photos.fog,
  stillLake: photos.stillLake,
  canopy: require("../assets/nature/pexels-stream.jpg"),
  moss: photos.fog,
  stones: require("../assets/nature/lake.jpg"),
  cabin: photos.ocean,
  stream: photos.stream,
  ripple: photos.water,
  pools: photos.water,
  dappled: photos.fog,
  window: photos.window,
  light: photos.window,
  rain: photos.fog,
  flowers: photos.leaves,
  bodyScan: photos.mossyStream,
  kindness: require("../assets/nature/mist.jpg"),
  alpineLake: require("../assets/nature/creek.jpg"),
  tea: require("../assets/images/brain-health/chamomile.jpg"),
  salmon: require("../assets/images/brain-health/salmon.jpg"),
  eggs: require("../assets/images/brain-health/eggs.jpg"),
  saffron: require("../assets/images/brain-health/saffron.jpg"),
  greens: require("../assets/images/brain-health/greens.jpg"),
  walnuts: require("../assets/images/brain-health/walnuts.jpg"),
  berries: require("../assets/images/brain-health/berries.jpg"),
  mediterranean: require("../assets/images/brain-health/mediterranean.jpg"),
  legumes: require("../assets/images/brain-health/legumes.jpg"),
  grains: require("../assets/images/brain-health/grains.jpg"),
  fermented: require("../assets/images/brain-health/fermented.jpg"),
  waterFood: require("../assets/images/brain-health/water.jpg"),
  chamomile: require("../assets/images/brain-health/chamomile.jpg"),
  lavenderFood: require("../assets/images/brain-health/herbs.jpg"),
  herbs: require("../assets/images/brain-health/herbs.jpg"),
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
