import { state, $, save, notify } from '../core.js';

// --- INITIALIZATION ---
export const init = () => {
    // 1. Pre-fill Wallpaper Input
    const wallIn = $('wall-in');
    if (wallIn) wallIn.value = state.wall;

    // Note: We no longer load the Pool Editor or Stat List here.
    // Those have moved to the secure 'Studio' app.
};

// --- WALLPAPER ---
export const setWall = () => {
    const url = $('wall-in').value;
    state.wall = url;
    
    // Apply immediately
    const wallEl = $('wallpaper');
    if (wallEl) {
        wallEl.style.backgroundImage = `url('${url}')`;
    }
    
    save();
    notify("Wallpaper Updated");
};


