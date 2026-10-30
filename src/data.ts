export const EMOTION_TAGS = ["calm", "hopeful", "anxious", "overwhelmed", "motivated", "tired"];

export const SYMPTOMS = [
  { id: "anxiety", label: "Anxiety" },
  { id: "depression", label: "Depression" },
  { id: "irritability", label: "Irritability" },
  { id: "panic", label: "Panic attacks" },
  { id: "brainFog", label: "Brain fog" },
  { id: "fatigue", label: "Fatigue" },
  { id: "racing", label: "Racing thoughts" },
  { id: "focus", label: "Concentration" },
];

export const COMMON_MEDS = [
  "Sertraline 50mg",
  "Sertraline 100mg",
  "Escitalopram 10mg",
  "Fluoxetine 20mg",
  "Bupropion XL 150mg",
  "Lamotrigine 100mg",
  "Trazodone 50mg",
  "Hydroxyzine 25mg",
  "Quetiapine 25mg",
  "Propranolol 10mg",
  "Magnesium glycinate",
  "Vitamin D3 2000 IU",
  "Omega-3 fish oil",
  "Melatonin 1mg",
];

export const MICRO_ACTIONS = [
  "Sit somewhere else for 20 seconds.",
  "Drink a sip of water.",
  "Unclench your jaw.",
  "Look at one color in the room.",
  "Feel both feet on the floor.",
  "Open a window or face one.",
  "Name one object you can see.",
  "Put a hand on your chest.",
  "Loosen your shoulders once.",
  "Rinse one fingertip with cool water.",
  "Read this sentence out loud.",
  "Plug in a device that's low.",
  "Throw one thing away.",
  "Text the word hi to no one — or just type it.",
  "Step into another room and back.",
];

export const EFT_POINTS = [
  {
    id: "karate",
    label: "Side of hand",
    hint: "The fleshy outer edge, like a quiet karate-chop.",
    finger: "Use the fingertips of your other hand. Tap the side of this hand.",
    kind: "hand" as const,
  },
  {
    id: "brow",
    label: "Eyebrow",
    hint: "Inner edge of either brow, on the bone.",
    finger: "Two fingertips. Tap lightly where the brow begins.",
    kind: "face" as const,
  },
  {
    id: "sideEye",
    label: "Side of eye",
    hint: "On the bone beside the eye — not the temple.",
    finger: "Index and middle finger, side of the orbital bone.",
    kind: "face" as const,
  },
  {
    id: "underEye",
    label: "Under eye",
    hint: "On the bone below the eye.",
    finger: "Two fingertips under the eye, gentle rain.",
    kind: "face" as const,
  },
  {
    id: "nose",
    label: "Under nose",
    hint: "The small groove between nose and lip.",
    finger: "Index fingertip, very light.",
    kind: "face" as const,
  },
  {
    id: "chin",
    label: "Chin",
    hint: "In the crease of the chin.",
    finger: "Index and middle finger in the chin hollow.",
    kind: "face" as const,
  },
  {
    id: "collar",
    label: "Collarbone",
    hint: "Just below the collarbone hollow.",
    finger: "Four fingertips of one hand, or both hands, below the hollow.",
    kind: "torso" as const,
  },
  {
    id: "underArm",
    label: "Under arm",
    hint: "About four inches below the armpit, on the side of the ribs.",
    finger: "Four fingertips on the side of the body.",
    kind: "torso" as const,
  },
  {
    id: "crown",
    label: "Top of head",
    hint: "The crown, as if rain were landing.",
    finger: "Fingertips gathered, tap the top of the head.",
    kind: "crown" as const,
  },
];

export const DISTORTIONS = [
  {
    id: "catastrophizing",
    title: "Catastrophizing",
    body: "Jumping to the worst possible ending and treating it as likely.",
    reframe: "What is a more ordinary outcome, even if this is hard?",
  },
  {
    id: "blackwhite",
    title: "Black-and-white thinking",
    body: "Seeing only success or failure, good or bad, with no middle.",
    reframe: "Where is the 30–70% version of this story?",
  },
  {
    id: "mindreading",
    title: "Mind reading",
    body: "Assuming you know what someone else thinks — usually something harsh.",
    reframe: "What else could be true that you have not confirmed?",
  },
  {
    id: "overgeneralization",
    title: "Overgeneralization",
    body: "Taking one moment as a forever rule: always, never, everyone.",
    reframe: "This is one data point. What else belongs in the picture?",
  },
  {
    id: "shoulds",
    title: "Shoulds",
    body: "Harsh rules about how you or others must be.",
    reframe: "Could this be a preference instead of a law?",
  },
  {
    id: "filtering",
    title: "Mental filter",
    body: "Noticing only the painful detail and discarding the rest.",
    reframe: "Name two other facts from the same day.",
  },
];

export const FOODS = [
  {
    id: "omega3",
    title: "Omega-3 Fatty Acids",
    color: "#D7E2CC",
    imageKey: "salmon" as const,
    points: [
      "Supports mood stability & brain resilience",
      "Found in: salmon, walnuts, chia seeds",
    ],
  },
  {
    id: "vitamind",
    title: "Vitamin D",
    color: "#F4E0D4",
    imageKey: "eggs" as const,
    points: [
      "Essential for circadian rhythm & mood regulation",
      "Sources: sunlight, eggs, mushrooms",
    ],
  },
  {
    id: "saffron",
    title: "Saffron",
    color: "#E6DDEC",
    imageKey: "saffron" as const,
    points: [
      "Evaluated for natural mood & stress support",
      "Sources: botanical spice",
    ],
  },
  {
    id: "magnesium",
    title: "Magnesium",
    color: "#D3E4EB",
    imageKey: "greens" as const,
    points: [
      "Aids in GABA function, relaxation & ease",
      "Sources: leafy greens, pumpkin seeds",
    ],
  },
  {
    id: "walnuts",
    title: "Walnuts & seeds",
    color: "#E7D7C3",
    imageKey: "walnuts" as const,
    points: [
      "Plant omega-3s and minerals for steady energy",
      "Sources: walnuts, flax, chia",
    ],
  },
  {
    id: "tea",
    title: "Sleep / herbal teas",
    color: "#D7E2CC",
    imageKey: "tea" as const,
    points: [
      "A warm, low-effort wind-down ritual",
      "Sources: chamomile, lemon balm, mint",
    ],
  },
  {
    id: "berries",
    title: "Colorful plants",
    color: "#E6DDEC",
    imageKey: "berries" as const,
    points: [
      "Polyphenols associated with cognitive health",
      "Sources: berries, leafy color, cocoa",
    ],
  },
];

export const MEDITATIONS = [
  {
    id: "anxiety",
    title: "Anxiety relief",
    minutes: 4,
    imageKey: "mist" as const,
    audioUrl: "",
    bowlFreq: 396,
    lines: [
      "Let the scene be bigger than the thought.",
      "Inhale through the nose. Soften the shoulders.",
      "You do not have to finish this feeling.",
      "Stay with one slow wave at a time.",
    ],
  },
  {
    id: "grounding",
    title: "Grounding",
    minutes: 5,
    imageKey: "forest" as const,
    audioUrl: "",
    bowlFreq: 174,
    lines: [
      "Feel the weight of your body being held.",
      "Notice three textures near you.",
      "Your feet can be heavy. That is enough.",
      "Come back to the contact points.",
    ],
  },
  {
    id: "sleep",
    title: "Sleep support",
    minutes: 8,
    imageKey: "lake" as const,
    audioUrl: "",
    bowlFreq: 256,
    lines: [
      "Dim the inner lights. Nothing to solve.",
      "Lengthen the exhale like a tide going out.",
      "If a thought arrives, set it on the shore.",
      "Let sleep be optional. Rest is the practice.",
    ],
  },
  {
    id: "stress",
    title: "Stress reduction",
    minutes: 6,
    imageKey: "stones" as const,
    audioUrl: "",
    bowlFreq: 528,
    lines: [
      "Unhook from the next task for these minutes.",
      "Warm the hands. Loosen the jaw.",
      "Breathe into the sides of the ribs.",
      "You can return to your life a little wider.",
    ],
  },
];
