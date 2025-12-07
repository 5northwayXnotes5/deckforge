import { state, $, save, notify, uid } from '../core.js';

// --- INITIALIZATION ---
export const init = () => {
    // 1. Lazy Load State
    if (typeof state.identity === 'undefined') {
        state.identity = {
            name: 'Guest',
            avatarSeed: uid()
        };
    }

    renderIdentity();
};

// --- RENDERING ---
const renderIdentity = () => {
    // Basic Info
    const nameInput = $('id-name');
    if (nameInput) nameInput.value = state.identity.name;

    const uidEl = $('id-uid');
    if (uidEl) uidEl.innerText = `UID: ${state.identity.avatarSeed.toUpperCase()}`; // Using seed as visible ID

    // Title (From Museum)
    const titleEl = $('id-title');
    if (titleEl) {
        // Safe check in case Museum hasn't run yet
        const currentTitle = (state.museum && state.museum.activeTitle) ? state.museum.activeTitle : 'Novice';
        titleEl.innerText = currentTitle;
    }

    // Avatar
    updateAvatarDisplay();
};

const updateAvatarDisplay = () => {
    const img = $('id-avatar');
    if (img) {
        // Using DiceBear API for consistent, cool robot avatars
        img.src = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${state.identity.avatarSeed}`;
    }
};

// --- ACTIONS ---
export const idChangeAvatar = () => {
    // Generate new random seed
    state.identity.avatarSeed = uid();
    updateAvatarDisplay();
    // We don't save yet, allowing user to "reroll" without committing
    // But for simplicity in this OS, let's just save it or they might lose it on refresh
    // actually, let's require them to hit "Save ID" to confirm.
    notify("Avatar Rerolled (Unsaved)");
};

export const idSave = () => {
    const nameInput = $('id-name');
    const newName = nameInput.value.trim();

    if (!newName) return notify("Invalid Name");
    if (newName.length > 12) return notify("Name too long");

    state.identity.name = newName;
    
    // Avatar seed is already in state, just waiting for save()
    
    save();
    notify("Identity Updated");
};

