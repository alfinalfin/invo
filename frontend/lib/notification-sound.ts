/**
 * Utility for playing notification ringtone when new leads are added
 */

let audioElement: HTMLAudioElement | null = null;

/**
 * Play the notification ringtone for new leads
 * Mimics the behavior of delivery apps like Swiggy and Zomato
 */
export function playLeadNotification() {
  // Create or reuse audio element
  if (!audioElement) {
    audioElement = new Audio("/ringtone.mp3");
    audioElement.preload = "auto";
  }

  // Reset playback and play
  audioElement.currentTime = 0;
  audioElement.play().catch((error) => {
    console.warn("Failed to play notification sound:", error);
  });
}

/**
 * Play multiple notification sounds for multiple leads
 * @param count Number of new leads
 */
export function playLeadNotifications(count: number) {
  if (count <= 0) return;

  // Play ringtone once immediately
  playLeadNotification();

  // If multiple leads, play again after a short delay for emphasis
  if (count > 1) {
    setTimeout(() => {
      playLeadNotification();
    }, 500);
  }
}

/**
 * Stop the notification sound if it's playing
 */
export function stopLeadNotification() {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}
