const audioManager = {
  audioContext: null,
  masterVolume: GAME_CONFIG.audioConfig.masterVolume,
  musicVolume: GAME_CONFIG.audioConfig.musicVolume,
  sfxVolume: GAME_CONFIG.audioConfig.sfxVolume,
  isMuted: false,

  currentTrack: null,
  currentTrackName: "",
  musicProgression: ["mantis-song", "cat-song", "panda-song", "vulture-song"],
  currentMusicLevel: 0,

  soundCooldowns: new Map(),

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

  loadedMusic: {},
  loadedSounds: {},

  initialize() {
    this.createAudioContext();
    this.loadAllAudio();
    this.startMusicRetrySystem();
    this.addVolumeControls();
  },

  createAudioContext() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      this.audioContext = null;
    }
  },

  startMusicRetrySystem() {
    utilityManager.setInterval(
      () => {
        this.checkBackgroundMusic();
      },
      GAME_CONFIG.audioConfig.musicRetryInterval,
      "musicRetry"
    );
  },

  checkBackgroundMusic() {
    if (this.isMuted) return;

    const expectedMusicLevel = this.getExpectedMusicLevel();
    const expectedTrackName = this.musicProgression[expectedMusicLevel];

    const shouldBePlaying = expectedTrackName && !this.isMuted;
    const isCurrentlyPlaying =
      this.currentTrack &&
      !this.currentTrack.paused &&
      !this.currentTrack.ended;

    if (shouldBePlaying && !isCurrentlyPlaying) {
      this.updateBackgroundMusic();
    }
  },

  getExpectedMusicLevel() {
    if (
      gameState.vultureCoop?.owned ||
      gameState.createdAnimals.has("Vulture")
    ) {
      return 3;
    } else if (
      gameState.pandaCoop?.owned ||
      gameState.createdAnimals.has("Panda")
    ) {
      return 2;
    } else if (
      gameState.catCoop?.owned ||
      gameState.createdAnimals.has("Cat")
    ) {
      return 1;
    } else if (gameState.createdAnimals.has("Mantis")) {
      return 0;
    }
    return -1;
  },

  loadAllAudio() {
    Object.entries(this.musicFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.loop = true;
      audio.volume = this.musicVolume * this.masterVolume;
      this.loadedMusic[name] = audio;
    });

    Object.entries(this.soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.volume = this.sfxVolume * this.masterVolume;
      this.loadedSounds[name] = audio;
    });
  },

  updateBackgroundMusic() {
    const newMusicLevel = this.getExpectedMusicLevel();

    if (newMusicLevel === -1) {
      if (this.currentTrack) {
        this.fadeOut(this.currentTrack, 1000, () => {
          this.currentTrack.pause();
          this.currentTrack.currentTime = 0;
          this.currentTrack = null;
          this.currentTrackName = "";
        });
      }
      this.currentMusicLevel = -1;
      return;
    }

    if (newMusicLevel !== this.currentMusicLevel) {
      this.currentMusicLevel = newMusicLevel;
      this.switchBackgroundMusic(this.musicProgression[newMusicLevel]);
    } else if (!this.currentTrack || this.currentTrack.paused) {
      this.switchBackgroundMusic(this.musicProgression[newMusicLevel]);
    }
  },

  switchBackgroundMusic(trackName) {
    if (this.isMuted) return;

    const newTrack = this.loadedMusic[trackName];
    if (!newTrack) return;

    if (this.currentTrack === newTrack && !this.currentTrack.paused) {
      return;
    }

    if (this.currentTrack && !this.currentTrack.paused) {
      this.fadeOut(this.currentTrack, 1000, () => {
        this.currentTrack.pause();
        this.currentTrack.currentTime = 0;
        this.startNewTrack(newTrack, trackName);
      });
    } else {
      this.startNewTrack(newTrack, trackName);
    }
  },

  startNewTrack(newTrack, trackName) {
    this.currentTrack = newTrack;
    this.currentTrackName = trackName;

    newTrack.currentTime = 0;
    newTrack.volume = 0;

    const playPromise = newTrack.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.fadeIn(newTrack, this.musicVolume * this.masterVolume, 1000);
        })
        .catch(() => {
          utilityManager.setTimeout(
            () => {
              newTrack
                .play()
                .then(() => {
                  this.fadeIn(
                    newTrack,
                    this.musicVolume * this.masterVolume,
                    1000
                  );
                })
                .catch(() => {});
            },
            500,
            "musicRetry"
          );
        });
    } else {
      this.fadeIn(newTrack, this.musicVolume * this.masterVolume, 1000);
    }
  },

  playSound(soundName, volume = 1.0) {
    if (this.isMuted) return;

    const sound = this.loadedSounds[soundName];
    if (!sound) return;

    const soundClone = sound.cloneNode();
    soundClone.volume = this.sfxVolume * this.masterVolume * volume;
    soundClone.play().catch(() => {});
  },

  playRandomSoundWithCooldown(
    soundGroup,
    cooldownMs = GAME_CONFIG.audioConfig.soundCooldown
  ) {
    if (this.isMuted) return;

    const now = Date.now();
    const lastPlayTime = this.soundCooldowns.get(soundGroup);

    if (lastPlayTime && now - lastPlayTime < cooldownMs) {
      return;
    }

    this.soundCooldowns.set(soundGroup, now);
    this.playRandomSound(soundGroup);
  },

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

  fadeIn(audio, targetVolume, duration) {
    if (!audio || this.isMuted) return;

    const volumeStep = targetVolume / (duration / 50);
    audio.volume = 0;

    const fadeInterval = setInterval(() => {
      if (audio.volume < targetVolume && !audio.paused && !audio.ended) {
        audio.volume = Math.min(audio.volume + volumeStep, targetVolume);
      } else {
        clearInterval(fadeInterval);
        if (!audio.paused && !audio.ended) {
          audio.volume = targetVolume;
        }
      }
    }, 50);
  },

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

  setMasterVolume(volume) {
    this.masterVolume = utilityManager.clamp(volume, 0, 1);
    this.updateAllVolumes();
  },

  setMusicVolume(volume) {
    this.musicVolume = utilityManager.clamp(volume, 0, 1);
    if (this.currentTrack && !this.isMuted) {
      this.currentTrack.volume = this.musicVolume * this.masterVolume;
    }
    Object.values(this.loadedMusic).forEach((music) => {
      if (music !== this.currentTrack) {
        music.volume = this.musicVolume * this.masterVolume;
      }
    });
  },

  setSfxVolume(volume) {
    this.sfxVolume = utilityManager.clamp(volume, 0, 1);
    Object.values(this.loadedSounds).forEach((sound) => {
      sound.volume = this.sfxVolume * this.masterVolume;
    });
  },

  updateAllVolumes() {
    if (this.currentTrack && !this.isMuted) {
      this.currentTrack.volume = this.musicVolume * this.masterVolume;
    }
    Object.values(this.loadedMusic).forEach((music) => {
      music.volume = this.musicVolume * this.masterVolume;
    });

    Object.values(this.loadedSounds).forEach((sound) => {
      sound.volume = this.sfxVolume * this.masterVolume;
    });
  },

  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      if (this.currentTrack) {
        this.currentTrack.pause();
      }
    } else {
      if (this.currentTrack) {
        this.currentTrack.play().catch(() => {});
      }
      this.updateAllVolumes();
    }
  },

  addVolumeControls() {
    const controlsContainer = utilityManager.createElement(
      "div",
      "",
      `
      <div style="margin-bottom: 5px;">
        <button id="muteToggle" style="background: #333; color: white; border: none; padding: 5px; border-radius: 4px; cursor: pointer;">
          🔊 Mute
        </button>
      </div>
      <div style="margin-bottom: 5px;">
        Master: <input type="range" id="masterVolume" min="0" max="1" step="0.01" value="${this.masterVolume}" style="width: 100px; cursor: pointer;">
      </div>
      <div style="margin-bottom: 5px;">
        Music: <input type="range" id="musicVolume" min="0" max="1" step="0.01" value="${this.musicVolume}" style="width: 100px; cursor: pointer;">
      </div>
      <div>
        SFX: <input type="range" id="sfxVolume" min="0" max="1" step="0.01" value="${this.sfxVolume}" style="width: 100px; cursor: pointer;">
      </div>
    `
    );

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
      user-select: none;
    `;

    document.body.appendChild(controlsContainer);

    const toggleButton = utilityManager.createElement("button", "", "🎵");
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

    utilityManager.addEventListener(
      toggleButton,
      "click",
      () => {
        const isVisible = controlsContainer.style.display !== "none";
        controlsContainer.style.display = isVisible ? "none" : "block";
        toggleButton.style.right = isVisible ? "10px" : "180px";
      },
      "audioToggle"
    );

    document.body.appendChild(toggleButton);

    this.setupVolumeControlListeners();
  },

  setupVolumeControlListeners() {
    const muteToggle = document.getElementById("muteToggle");
    const masterSlider = document.getElementById("masterVolume");
    const musicSlider = document.getElementById("musicVolume");
    const sfxSlider = document.getElementById("sfxVolume");

    if (muteToggle) {
      utilityManager.addEventListener(
        muteToggle,
        "click",
        () => {
          this.toggleMute();
          muteToggle.textContent = this.isMuted ? "🔇 Unmute" : "🔊 Mute";
        },
        "muteToggle"
      );
    }

    if (masterSlider) {
      utilityManager.addEventListener(
        masterSlider,
        "input",
        (e) => {
          this.setMasterVolume(parseFloat(e.target.value));
        },
        "masterSlider"
      );
    }

    if (musicSlider) {
      utilityManager.addEventListener(
        musicSlider,
        "input",
        (e) => {
          this.setMusicVolume(parseFloat(e.target.value));
        },
        "musicSlider"
      );
    }

    if (sfxSlider) {
      utilityManager.addEventListener(
        sfxSlider,
        "input",
        (e) => {
          this.setSfxVolume(parseFloat(e.target.value));
        },
        "sfxSlider"
      );
    }
  },

  handleFirstUserInteraction() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    if (!this.currentTrack || this.currentTrack.paused) {
      this.updateBackgroundMusic();
    }
  },

  cleanup() {
    utilityManager.clearInterval("musicRetry");
  },
};
