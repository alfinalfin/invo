/**
 * Utility for playing notification ringtone when new leads are added
 */

let audioElement: HTMLAudioElement | null = null;
let isPlaying = false;

/**
 * Play the notification ringtone for new leads
 * Mimics the behavior of delivery apps like Swiggy and Zomato
 */
export function playLeadNotification() {
  if (typeof window === "undefined") return;

  // Create or reuse audio element
  if (!audioElement) {
    audioElement = new Audio("/ringtone.mp3");
    audioElement.preload = "auto";
    audioElement.loop = true;
  }

  if (isPlaying) {
    return;
  }

  // Reset playback and play
  audioElement.currentTime = 0;
  audioElement.play().then(() => {
    isPlaying = true;
  }).catch((error) => {
    console.warn("Failed to play notification sound:", error);
  });
}

/**
 * Play notification sounds for new leads
 * @param count Number of new leads
 */
export function playLeadNotifications(count: number) {
  if (count <= 0) return;

  // Play ringtone continuously until acknowledged
  playLeadNotification();
}

/**
 * Stop the notification sound if it's playing
 */
export function stopLeadNotification() {
  if (audioElement && isPlaying) {
    audioElement.pause();
    audioElement.currentTime = 0;
    isPlaying = false;
  }
}
