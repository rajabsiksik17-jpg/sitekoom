"use client";

let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioCtx = audioCtx ?? new Ctor();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch {
    /* ignore */
  }
}

export function getSoundPref(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("sitekoom_chat_sound") !== "0";
}

export function setSoundPref(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("sitekoom_chat_sound", on ? "1" : "0");
}
