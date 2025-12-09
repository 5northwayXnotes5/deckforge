import { state, $, save, notify } from '../core.js';

// --- INITIALIZATION ---
export const init = () => {
    // 1. Pre-fill Wallpaper Input
    const wallIn = $('wall-in');
    if (wallIn) wallIn.value = state.wall;
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

// --- FACTORY RESET (PLAYER DATA ONLY) ---

export const wipe = () => {
    // 1. Reset Player Economy & Progress
    state.gold = 100;           // Reset to starter money
    state.bank = {              // Reset Bank accounts
        savings: 0, 
        loan: 0, 
        lastInterest: Date.now() 
    };

    // 2. Clear Collection & Decks
    state.cards = [];           // Delete owned cards
    state.decks = [];           // Delete saved decks

    // 3. Reset App Progress
    state.saga = {};            // Reset Campaign progress
    state.museum = [];          // Clear Achievements
    state.stats = {             // Reset Lifetime stats (Wins/Losses)
        wins: 0, 
        losses: 0, 
        gamesPlayed: 0 
    };

    // 4. Save & Reboot
    save();
    closeConfirm();
    notify("System Reset. Rebooting...");
    
    // Force reload to clear all UI states
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};
