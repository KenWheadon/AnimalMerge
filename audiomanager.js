const audioManager = {
  // Audio context and settings
  audioContext: null,
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  isMuted: false,

  // Background music tracking
  currentTrack: null,
  currentTrackName: "",
  musicProgression: ["mantis-song", "cat-song", "panda-song", "vulture-song"],
  currentMusicLevel: 0,

  // Audio file paths
  musicFiles: {
    "mantis-song": "audio/mantis-song.mp3",
    "cat-song": "audio/cat-song.mp3",
    "panda-song": "audio/panda-song.mp3",
    "vulture-song": "audio/vulture-song.mp3",
  },

  soundFiles: {
    "button-click": "audio/button-click.mp3",
    "button-hover": "audio/button-hover.mp3",
    "earn-money": "audio/earn-money.mp3",
    "manual-merge": "audio/manual-merge.mp3",
    shuffle: "audio/shuffle.mp3",
    "egg-placement": "audio/egg-placement.mp3",
    // "egg-timer-cat": "audio/egg-timer-cat.mp3",
    // "egg-timer-panda": "audio/egg-timer-panda.mp3",
    // "egg-timer-vulture": "audio/egg-timer-vulture.mp3",
    "grid-expansion": "audio/grid-expansion.mp3",
    "auto-merge-fail": "audio/auto-merge-fail.mp3",
    "auto-merge-win": "audio/auto-merge-win.mp3",
    "achievement-awarded": "audio/achievement-awarded.mp3",
    "invalid-action": "audio/invalid-action.mp3",
    "butcher-done-1": "audio/butcher-done-1.mp3",
    "butcher-done-2": "audio/butcher-done-2.mp3",
    "butcher-done-3": "audio/butcher-done-3.mp3",
    "butcher-shop": "audio/butcher-shop.mp3",
    "coop-bought": "audio/coop-bought.mp3",
    ooh1: "audio/ooh-1.mp3",
    ooh2: "audio/ooh-2.mp3",
    ooh3: "audio/ooh-3.mp3",
    ooh4: "audio/ooh-4.mp3",
    ooh5: "audio/ooh-5.mp3",
    ooh6: "audio/ooh-6.mp3",
    ooh7: "audio/ooh-7.mp3",
    ooh8: "audio/ooh-8.mp3",
    ooh9: "audio/ooh-9.mp3",
    ooh10: "audio/ooh-10.mp3",
    ooh11: "audio/ooh-11.mp3",
    ooh12: "audio/ooh-12.mp3",
    ooh13: "audio/ooh-13.mp3",
    ooh14: "audio/ooh-14.mp3",
  },

  // Loaded audio elements
  loadedMusic: {},
  loadedSounds: {},

  // Initialize audio system
  initialize() {
    console.log("Initializing Audio Manager...");

    // Create audio context for better control
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported, falling back to HTML5 audio");
    }

    // Load all audio files
    this.loadAllAudio();

    // Start with first background music
    this.updateBackgroundMusic();

    // Add volume controls to UI (optional)
    this.addVolumeControls();

    console.log("Audio Manager initialized");
  },

  // Load all audio files
  loadAllAudio() {
    // Load background music
    Object.entries(this.musicFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.loop = true;
      audio.volume = this.musicVolume * this.masterVolume;
      audio.addEventListener("error", (e) => {
        console.warn(`Failed to load music: ${path}`, e);
      });
      this.loadedMusic[name] = audio;
    });

    // Load sound effects
    Object.entries(this.soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.volume = this.sfxVolume * this.masterVolume;
      audio.addEventListener("error", (e) => {
        console.warn(`Failed to load sound: ${path}`, e);
      });
      this.loadedSounds[name] = audio;
    });
  },

  // Update background music based on game progression
  updateBackgroundMusic() {
    let newMusicLevel = 0;

    // Determine music level based on unlocked coops
    if (gameState.createdAnimals.has("Vulture")) {
      newMusicLevel = 3; // vulture-song
    } else if (gameState.createdAnimals.has("Panda")) {
      newMusicLevel = 2; // panda-song
    } else if (gameState.createdAnimals.has("Cat")) {
      newMusicLevel = 1; // cat-song
    } else {
      newMusicLevel = 0; // mantis-song
    }

    // Only change music if level has progressed
    if (newMusicLevel > this.currentMusicLevel) {
      this.currentMusicLevel = newMusicLevel;
      this.switchBackgroundMusic(this.musicProgression[newMusicLevel]);
    }
  },

  // Switch to a different background music track
  switchBackgroundMusic(trackName) {
    if (this.isMuted) return;

    const newTrack = this.loadedMusic[trackName];
    if (!newTrack) {
      console.warn(`Music track not found: ${trackName}`);
      return;
    }

    // Fade out current track
    if (this.currentTrack) {
      this.fadeOut(this.currentTrack, 1000, () => {
        this.currentTrack.pause();
        this.currentTrack.currentTime = 0;
      });
    }

    // Fade in new track
    this.currentTrack = newTrack;
    this.currentTrackName = trackName;
    newTrack.volume = 0;
    newTrack.play().catch((e) => {
      console.warn("Failed to play music:", e);
    });
    this.fadeIn(newTrack, this.musicVolume * this.masterVolume, 1000);

    console.log(`Switched to music: ${trackName}`);
  },

  // Play a sound effect
  playSound(soundName, volume = 1.0) {
    if (this.isMuted) return;

    const sound = this.loadedSounds[soundName];
    if (!sound) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    // Clone the audio for overlapping sounds
    const soundClone = sound.cloneNode();
    soundClone.volume = this.sfxVolume * this.masterVolume * volume;
    soundClone.play().catch((e) => {
      console.warn(`Failed to play sound: ${soundName}`, e);
    });
  },

  // Play random sound from a group
  playRandomSound(soundGroup) {
    if (this.isMuted) return;

    let sounds = [];

    if (soundGroup === "butcher-done") {
      sounds = ["butcher-done-1", "butcher-done-2", "butcher-done-3"];
    } else if (soundGroup === "ooh") {
      sounds = [
        "ooh1",
        "ooh2",
        "ooh3",
        "ooh4",
        "ooh5",
        "ooh6",
        "ooh7",
        "ooh8",
        "ooh9",
        "ooh10",
        "ooh11",
        "ooh12",
        "ooh13",
        "ooh14",
      ];
    }

    if (sounds.length > 0) {
      const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
      this.playSound(randomSound);
    }
  },

  // Fade in audio element
  fadeIn(audio, targetVolume, duration) {
    if (!audio || this.isMuted) return;

    const startVolume = 0;
    const volumeStep = targetVolume / (duration / 50);
    audio.volume = startVolume;

    const fadeInterval = setInterval(() => {
      if (audio.volume < targetVolume) {
        audio.volume = Math.min(audio.volume + volumeStep, targetVolume);
      } else {
        clearInterval(fadeInterval);
      }
    }, 50);
  },

  // Fade out audio element
  fadeOut(audio, duration, callback) {
    if (!audio) return;

    const startVolume = audio.volume;
    const volumeStep = startVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      if (audio.volume > 0) {
        audio.volume = Math.max(audio.volume - volumeStep, 0);
      } else {
        clearInterval(fadeInterval);
        if (callback) callback();
      }
    }, 50);
  },

  // Set master volume
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  },

  // Set music volume
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentTrack) {
      this.currentTrack.volume = this.musicVolume * this.masterVolume;
    }
  },

  // Set sound effects volume
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    Object.values(this.loadedSounds).forEach((sound) => {
      sound.volume = this.sfxVolume * this.masterVolume;
    });
  },

  // Update all audio volumes
  updateAllVolumes() {
    // Update music volume
    if (this.currentTrack) {
      this.currentTrack.volume = this.musicVolume * this.masterVolume;
    }

    // Update sound effect volumes
    Object.values(this.loadedSounds).forEach((sound) => {
      sound.volume = this.sfxVolume * this.masterVolume;
    });
  },

  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      if (this.currentTrack) {
        this.currentTrack.pause();
      }
    } else {
      if (this.currentTrack) {
        this.currentTrack.play().catch((e) => {
          console.warn("Failed to resume music:", e);
        });
      }
    }

    console.log(`Audio ${this.isMuted ? "muted" : "unmuted"}`);
  },

  // Add simple volume controls to the UI
  addVolumeControls() {
    // Create audio controls container
    const controlsContainer = document.createElement("div");
    controlsContainer.id = "audioControls";
    controlsContainer.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 10000;
      display: none;
    `;

    controlsContainer.innerHTML = `
      <div style="margin-bottom: 5px;">
        <button id="muteToggle" style="background: #333; color: white; border: none; padding: 5px; border-radius: 4px; cursor: pointer;">
          🔊 Mute
        </button>
      </div>
      <div style="margin-bottom: 5px;">
        Master: <input type="range" id="masterVolume" min="0" max="1" step="0.1" value="${this.masterVolume}" style="width: 100px;">
      </div>
      <div style="margin-bottom: 5px;">
        Music: <input type="range" id="musicVolume" min="0" max="1" step="0.1" value="${this.musicVolume}" style="width: 100px;">
      </div>
      <div>
        SFX: <input type="range" id="sfxVolume" min="0" max="1" step="0.1" value="${this.sfxVolume}" style="width: 100px;">
      </div>
    `;

    document.body.appendChild(controlsContainer);

    // Add toggle button
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "🎵";
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      padding: 8px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      z-index: 10001;
    `;

    toggleButton.addEventListener("click", () => {
      const isVisible = controlsContainer.style.display !== "none";
      controlsContainer.style.display = isVisible ? "none" : "block";
      toggleButton.style.right = isVisible ? "10px" : "180px";
    });

    document.body.appendChild(toggleButton);

    // Add event listeners
    document.getElementById("muteToggle").addEventListener("click", () => {
      this.toggleMute();
      document.getElementById("muteToggle").textContent = this.isMuted
        ? "🔇 Unmute"
        : "🔊 Mute";
    });

    document.getElementById("masterVolume").addEventListener("input", (e) => {
      this.setMasterVolume(parseFloat(e.target.value));
    });

    document.getElementById("musicVolume").addEventListener("input", (e) => {
      this.setMusicVolume(parseFloat(e.target.value));
    });

    document.getElementById("sfxVolume").addEventListener("input", (e) => {
      this.setSfxVolume(parseFloat(e.target.value));
    });
  },

  // Helper function to handle user interaction requirement for audio
  handleFirstUserInteraction() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    // Start music if not already playing
    if (!this.currentTrack || this.currentTrack.paused) {
      this.updateBackgroundMusic();
    }
  },
};
