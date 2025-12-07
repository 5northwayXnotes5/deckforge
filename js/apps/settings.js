import { state, $, save, notify, uid } from '../core.js';

// --- INITIALIZATION ---
export const init = () => {
    // 1. Pre-fill Wallpaper Input
    const wallIn = $('wall-in');
    if (wallIn) wallIn.value = state.wall;

    // 2. Pre-fill Pool Editor
    const poolIn = $('pool-in');
    if (poolIn) {
        // Convert object array back to string format: [Name]URL
        poolIn.value = state.pool.map(p => `[${p.name}]${p.img}`).join('\n');
    }

    // 3. Render Stats List
    renderStatList();
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

// --- CUSTOM STATS ---
const renderStatList = () => {
    const list = $('stat-list');
    if (!list) return;

    list.innerHTML = state.stats.map(k => `
        <div class="list-row">
            <label>${k}</label>
            <div class="btn danger sm" onclick="app.remStat('${k}')">X</div>
        </div>
    `).join('');
};

export const addStat = () => {
    const input = $('stat-in');
    const val = input.value.trim().toUpperCase(); // Force uppercase for consistency
    
    if (!val) return notify("Enter a Stat Name");
    if (state.stats.includes(val)) return notify("Stat already exists");
    if (val.length > 8) return notify("Name too long (Max 8)");

    state.stats.push(val);
    
    // Clear input
    input.value = '';
    
    save();
    renderStatList();
    notify(`Stat "${val}" Added`);
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

