const CREDITS = {
  Ken: {
    name: "Ken Wheadon",
    jobTitle: "Game Lead",
    department: "Game Development",
    previewImage: "images/ken-head.png",
    fullImage: "images/ken-head.png",
    description:
      "With a lifelong passion for gaming, Ken Wheadon has been creating games since middle school, starting with projects for Newgrounds. After earning two degrees in game design and flash programming from community college, they honed their skills through internships and professional roles in lottery game development and elearning software. Leveraging generative AI technology since 2022, Ken overcame personal challenges with burnout to focus on crafting engaging game experiences, including level design, mechanics, and user onboarding. Furry Merge Farm reflects their dedication to realizing childhood dreams of making fun, innovative games.",
  },

  Jessy: {
    name: "Wyrmskin",
    jobTitle: "Lead Artist",
    department: "Art",
    previewImage: "images/wyrmskin-head.png",
    fullImage: "images/wyrmskin-head.png",
    description:
      "Jessy-Jean, also known as Wyrmskin, created the current company logo and provides artistic direction and support as needed.",
  },

  Freesounds: {
    name: "FreeSounds",
    jobTitle: "Sound Effects",
    department: "Audio",
    previewImage: "images/freesound-head.png",
    fullImage: "images/freesound-logo.png",
    description:
      "Multiple contributors from FreeSounds.org provided the majority of sound effects used throughout the game experience. Thank you to: colorsCrimsonTears, David819, SilverIllusionist, mrickey13, plasterbrain, Sess8it, Bertrof, GameAudio, and Yoshicakes77.",
  },

  Gamesounds: {
    name: "pixabay",
    jobTitle: "Sound Effects",
    department: "Audio",
    previewImage: "images/px-head.png",
    fullImage: "images/px-head.png",
    description:
      "Additional sound effects contributors from pixabay.com helped expand the audio library for enhanced gameplay immersion. Thank you to: Karim-Nessim, Universfield, and freesound_community.",
  },

  Suno: {
    name: "Suno 3.5",
    jobTitle: "Background Music",
    department: "Audio",
    previewImage: "images/suno35-head.png",
    fullImage: "images/suno35-head.png",
    description:
      "Suno 3.5 AI generated the atmospheric background music that enhances the gaming experience.",
  },

  Claude: {
    name: "Claude Sonnet 4.0",
    jobTitle: "Lead Programmer",
    department: "Game Development",
    previewImage: "images/sonnet4-head.png",
    fullImage: "images/sonnet4-head.png",
    description:
      "Claude Sonnet 4.0 led the programming efforts, implementing core game mechanics and only gaslighting some of the time. This is why we use git.",
  },
};

function getAllDepartments() {
  const departments = new Set(
    Object.values(CREDITS).map((person) => person.department)
  );
  return Array.from(departments).sort();
}
