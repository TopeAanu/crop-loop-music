class MusicPlayer {
  constructor() {
    this.audioPlayer = document.getElementById("audioPlayer");
    this.playPauseBtn = document.getElementById("playPauseBtn");
    this.prevBtn = document.getElementById("prevBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.fileInput = document.getElementById("fileInput");
    this.progressBar = document.getElementById("progressBar");
    this.progressFill = document.getElementById("progressFill");
    this.currentTimeEl = document.getElementById("currentTime");
    this.totalTimeEl = document.getElementById("totalTime");
    this.trackTitleEl = document.getElementById("trackTitle");

    // Crop controls
    this.cropStartInput = document.getElementById("cropStart");
    this.cropEndInput = document.getElementById("cropEnd");
    this.setCropBtn = document.getElementById("setCropBtn");
    this.toggleLoopBtn = document.getElementById("toggleLoopBtn");
    this.clearCropBtn = document.getElementById("clearCropBtn");

    this.currentTrack = null;
    this.isPlaying = false;
    this.isCropped = false;
    this.isLooping = false;
    this.cropStart = 0;
    this.cropEnd = 0;

    this.initEventListeners();
    console.log("Music Player initialized");
  }

  initEventListeners() {
    // File input
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));

    // Player controls
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());

    // Audio events
    this.audioPlayer.addEventListener("loadedmetadata", () =>
      this.updateTrackInfo()
    );
    this.audioPlayer.addEventListener("timeupdate", () =>
      this.updateProgress()
    );
    this.audioPlayer.addEventListener("ended", () => this.handleTrackEnd());
    this.audioPlayer.addEventListener("play", () => {
      this.isPlaying = true;
      this.playPauseBtn.textContent = "Pause";
    });
    this.audioPlayer.addEventListener("pause", () => {
      this.isPlaying = false;
      this.playPauseBtn.textContent = "Play";
    });

    // Progress bar
    this.progressBar.addEventListener("click", (e) => this.seekTo(e));

    // Crop controls
    this.setCropBtn.addEventListener("click", () => this.setCrop());
    this.toggleLoopBtn.addEventListener("click", () => this.toggleLoop());
    this.clearCropBtn.addEventListener("click", () => this.clearCrop());
  }

  handleFileSelect(event) {
    console.log("File selected:", event.target.files.length);
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Filter supported audio formats
    const supportedFormats = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
    ];
    const isSupported =
      supportedFormats.includes(file.type) ||
      file.name.toLowerCase().endsWith(".mp3") ||
      file.name.toLowerCase().endsWith(".wav") ||
      file.name.toLowerCase().endsWith(".ogg") ||
      file.name.toLowerCase().endsWith(".m4a");

    console.log(
      `File: ${file.name}, Type: ${file.type}, Supported: ${isSupported}`
    );

    if (!isSupported) {
      this.showCustomAlert(
        "Unsupported audio file format. Please use MP3, WAV, OGG, or M4A files."
      );
      return;
    }

    this.currentTrack = {
      file: file,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    };

    console.log("Track loaded:", {
      name: this.currentTrack.name,
      type: this.currentTrack.type,
    });
    this.loadTrack();
  }

  loadTrack() {
    if (!this.currentTrack) {
      return;
    }

    console.log("Loading track:", this.currentTrack.name);

    // Clear previous source
    this.audioPlayer.src = "";
    this.audioPlayer.load();

    // Set new source
    this.audioPlayer.src = this.currentTrack.url;
    console.log(
      "Set audio source:",
      this.currentTrack.url,
      "Type:",
      this.currentTrack.type
    );

    this.trackTitleEl.textContent = this.currentTrack.name;
    this.clearCrop();

    // Test if the browser can play this file
    this.audioPlayer.addEventListener(
      "loadeddata",
      () => {
        console.log("Audio data loaded successfully");
      },
      { once: true }
    );

    this.audioPlayer.addEventListener(
      "error",
      (e) => {
        console.error("Audio error:", e, this.audioPlayer.error);
        this.showCustomAlert(
          `Cannot play ${this.currentTrack.name}. This file format may not be supported by your browser.`
        );
      },
      { once: true }
    );
  }

  togglePlayPause() {
    if (!this.audioPlayer.src) {
      console.log("No audio source loaded");
      return;
    }

    if (this.isPlaying) {
      this.audioPlayer.pause();
    } else {
      const playPromise = this.audioPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    }
  }

  updateTrackInfo() {
    const duration = this.audioPlayer.duration;
    this.totalTimeEl.textContent = this.formatTime(duration);
    this.cropEndInput.max = duration;
    this.cropEndInput.value = this.formatTime(duration);
    console.log("Track loaded, duration:", duration);
  }

  updateProgress() {
    const currentTime = this.audioPlayer.currentTime;
    const duration = this.audioPlayer.duration;

    if (duration) {
      const progressPercent = (currentTime / duration) * 100;
      this.progressFill.style.width = progressPercent + "%";
      this.currentTimeEl.textContent = this.formatTime(currentTime);
    }

    // Handle crop looping
    if (this.isCropped && currentTime >= this.cropEnd) {
      if (this.isLooping) {
        this.audioPlayer.currentTime = this.cropStart;
      } else {
        this.audioPlayer.pause();
      }
    }
  }

  seekTo(event) {
    const rect = this.progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const duration = this.audioPlayer.duration;

    if (duration) {
      const seekTime = (clickX / width) * duration;
      this.audioPlayer.currentTime = seekTime;
    }
  }

  handleTrackEnd() {
    if (this.isCropped && this.isLooping) {
      this.audioPlayer.currentTime = this.cropStart;
      this.audioPlayer.play();
    }
  }

  setCrop() {
    const start = this.parseTimeInput(this.cropStartInput.value);
    const end = this.parseTimeInput(this.cropEndInput.value);
    const duration = this.audioPlayer.duration;

    if (start >= 0 && end > start && end <= duration) {
      this.cropStart = start;
      this.cropEnd = end;
      this.isCropped = true;
      this.setCropBtn.textContent = "Crop Set";
      this.audioPlayer.currentTime = start;
      console.log("Crop set from", start, "to", end);
    } else {
      this.showCustomAlert("Invalid crop times. Please check your values.");
    }
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    this.toggleLoopBtn.textContent = this.isLooping
      ? "Disable Loop"
      : "Enable Loop";

    if (this.isLooping && !this.isCropped) {
      this.showCustomAlert("Please set crop points first to enable looping.");
      this.isLooping = false;
      this.toggleLoopBtn.textContent = "Enable Loop";
    }
  }

  clearCrop() {
    this.isCropped = false;
    this.isLooping = false;
    this.cropStart = 0;
    this.cropEnd = this.audioPlayer.duration || 0;
    this.cropStartInput.value = this.formatTime(0);
    this.cropEndInput.value = this.formatTime(this.audioPlayer.duration || 0);
    this.setCropBtn.textContent = "Set Crop";
    this.toggleLoopBtn.textContent = "Enable Loop";
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  parseTimeInput(timeString) {
    // Handle both MM:SS format and plain seconds
    if (typeof timeString === "string" && timeString.includes(":")) {
      const parts = timeString.split(":");
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
      }
    }
    // Fallback to parsing as plain seconds
    return parseFloat(timeString) || 0;
  }

  showCustomAlert(message) {
    // Remove any existing alerts
    const existingAlert = document.querySelector(".custom-alert-overlay");
    if (existingAlert) {
      existingAlert.remove();
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "custom-alert-overlay";

    // Create alert box
    const alertBox = document.createElement("div");
    alertBox.className = "custom-alert error";
    alertBox.innerHTML = `
      <div class="custom-alert-content">
        <div class="custom-alert-message">${message}</div>
        <button class="custom-alert-button">OK</button>
      </div>
    `;

    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);

    // Add click handlers
    const okButton = alertBox.querySelector(".custom-alert-button");
    const closeAlert = () => overlay.remove();

    okButton.addEventListener("click", closeAlert);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeAlert();
    });
  }
}

// Initialize the music player when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing music player");
  new MusicPlayer();
});
