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


};

export const remStat = (key) => {
    // Prevent removing the last stat (Game needs at least one to function)
    if (state.stats.length <= 1) return notify("Must have at least 1 stat");

    state.stats = state.stats.filter(x => x !== key);
    
    save();
    renderStatList();
    notify(`Stat "${key}" Removed`);
};

// --- CARD POOL MANAGEMENT ---
export const parsePool = () => {
    const text = $('pool-in').value;
    const lines = text.split('\n');
    const newPool = [];

    // Regex to match [Name]URL
    const regex = /\[(.*?)\](.*)/;

    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            newPool.push({
                id: uid(),
                name: match[1].trim(),
                img: match[2].trim()
            });
        }
    });

    if (newPool.length === 0) {
        return notify("No valid data found. Format: [Name]URL");
    }

    state.pool = newPool;
    save();
    notify(`Pool Updated (${newPool.length} Cards)`);
};

