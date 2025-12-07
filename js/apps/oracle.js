import { state, $, save, notify, rand } from '../core.js';

// --- CONFIGURATION ---
const FORTUNES = [
    { title: "Great Fortune", desc: "The stars align in your favor.", reward: 200 },
    { title: "Minor Luck", desc: "You found a coin on the street.", reward: 50 },
    { title: "The Wind's Favor", desc: "Movement is swift today.", reward: 100 },
    { title: "Golden Goose", desc: "An unexpected windfall.", reward: 500 },
    { title: "Neutrality", desc: "Balance in all things.", reward: 25 }
];

// --- INITIALIZATION ---
export const init = () => {
    // Lazy Load State
    if (typeof state.lastOracle === 'undefined') {
        state.lastOracle = 0;
    }
    
    resetCardUI();
};

const resetCardUI = () => {
    const card = $('oracle-card');
    const title = $('oracle-title');
    const desc = $('oracle-desc');
    
    // Reset Flip Animation
    card.classList.remove('flip');
    
    // Check if available
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (now - state.lastOracle > oneDay) {
        title.innerText = "Oracle Ready";
        desc.innerText = "Tap to reveal fate";
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
    } else {
        // Calculate time remaining
        const diff = oneDay - (now - state.lastOracle);
        const hours = Math.ceil(diff / (1000 * 60 * 60));
        
        title.innerText = "Dormant";
        desc.innerText = `Return in ${hours} hours`;
        card.style.opacity = "0.5";
        card.style.pointerEvents = "none";
    }
};

// --- LOGIC ---
export const consult = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Double check time logic
    if (now - state.lastOracle < oneDay) {
        return notify("The Oracle sleeps.");
    }

    // 1. Pick Fate
    const fortune = rand(FORTUNES);

    // 2. Update State
    state.lastOracle = now;
    state.gold += fortune.reward;
    save();

    // 3. Animate
    const card = $('oracle-card');
    card.classList.add('flip');

    // 4. Update Front Face (Back of DOM element)
    // We delay slightly to match the CSS flip halfway point if we wanted to be fancy,
    // but updating immediately is fine for this CSS setup.
    $('oracle-title').innerText = fortune.title;
    $('oracle-desc').innerText = `${fortune.desc} (+${fortune.reward}G)`;

    notify(`Fate Revealed: +${fortune.reward}G`);
};

