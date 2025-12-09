import { state, $, save, notify, rand, updateUI } from '../core.js';

// --- INTERNAL STATE ---
let pState = {
    active: false,
    interval: null,
    bet: 50,
    level: 1,
    position: 50, // 0 to 100
    card: null,   // The card at risk
    force: 0.3,   // Gravity
    timeLeft: 15.0,
    safeMode: false // Temporary invincibility at start of level
};

// --- INITIALIZATION ---
export const init = () => {
    // 1. Check Requirements
    if (state.col.length === 0) return notify("No Cards to Risk");
    
    // 2. Reset UI
    $('pressure-lobby').classList.remove('hidden');
    $('pressure-game').classList.add('hidden');
    
    // 3. Select a Random Victim (Preview)
    // We select it now so the user knows the stakes, but we don't lock it in until Start
    const potentialVictim = rand(state.col);
    const t = state.pool.find(x => x.id === potentialVictim.tid);
    
    // Show user what they are risking (Optional QoL improvement could be to let them pick)
    // For now, we keep the random "Russian Roulette" style of the original.
    // We could add a text element in the lobby later if we wanted to show the name.
};

// --- GAME LOOP ---
export const start = () => {
    const betInput = $('pressure-bet');
    const bet = parseInt(betInput.value);
    
    if (state.gold < bet) return notify("Insufficient Gold");
    if (bet < 10) return notify("Min Bet: 10G");

    // Lock in the bet
    state.gold -= bet;
    save();

    // Lock in the victim
    pState.card = rand(state.col);
    
    // Setup State
    pState.active = true;
    pState.bet = bet;
    pState.level = 1;
    pState.position = 50;
    pState.force = 0.5; // Increased base gravity (was 0.3)
    pState.timeLeft = 15.0;
    pState.safeMode = true;

    // Switch UI
    $('pressure-lobby').classList.add('hidden');
    $('pressure-game').classList.remove('hidden');

    renderFrame();

    // Start Engine (30ms tick = ~33 FPS)
    if (pState.interval) clearInterval(pState.interval);
    pState.interval = setInterval(gameLoop, 30);
    
    // Remove safety after 0.5s
    setTimeout(() => { pState.safeMode = false; }, 500);

    updateUI();
};

const gameLoop = () => {
    if (!pState.active) return;

    // 1. Time Management
    pState.timeLeft -= 0.03;
    $('p-time').innerText = pState.timeLeft.toFixed(1) + 's';

    if (pState.timeLeft <= 0) {
        nextLevel();
        return;
    }

    // 2. Physics (Gravity increases with level)
    // New Curve: Linear but steeper. 
    // Level 1: 0.75 gravity
    // Level 10: 3.0 gravity (Very Heavy)
    const gravity = 0.5 + (pState.level * 0.25);
    pState.position -= gravity;

    // 3. Turbulence (Jitter)
    // Starting at level 5, the bar will shake randomly
    if (pState.level >= 5) {
        if (Math.random() < 0.2) {
            pState.position += (Math.random() * 6 - 3); 
        }
    }

    // 4. Render Bar
    const bar = $('p-bar');
    if (bar) bar.style.left = pState.position + '%';

    // 5. Collision Detection
    // Bounds: 0% to 90% (since bar is 10% wide)
    if (!pState.safeMode) {
        if (pState.position <= 0 || pState.position >= 90) {
            fail();
        }
    } else {
        // Clamp during safe mode
        if (pState.position < 0) pState.position = 0;
        if (pState.position > 90) pState.position = 90;
    }
};

// --- CONTROLS ---
export const tap = () => {
    if (pState.active) {
        // Push the bar up
        // Increased from 6 to 8 to compensate for heavier gravity
        pState.position += 8; 
    }
};

// --- GAME LOGIC ---
const renderFrame = () => {
    const t = state.pool.find(x => x.id === pState.card.tid);
    const r = state.rarity.find(x => x.id === pState.card.rid);

    const imgBox = $('p-card-img');
    imgBox.innerHTML = `<img src="${t.img}" style="width:100%;height:100%;object-fit:cover;">`;
    imgBox.parentElement.style.borderColor = r.c;
    
    $('p-lvl').innerText = pState.level;
};

const nextLevel = () => {
    // Check Victory Condition
    if (pState.level >= 10) {
        victory();
        return;
    }

    // Intermediate Payout - NERFED
    // Old: Bet * Level (Exponential)
    // New: Fixed small drip feed (20% of bet) to keep player engaged without snowballing
    const payout = Math.floor(pState.bet * 0.2); 
    state.gold += payout;
    notify(`Level ${pState.level} Clear! +${payout}G`);

    // Increase Difficulty
    pState.level++;
    pState.timeLeft = 15.0; // Reset Timer
    pState.position = 50;   // Reset Position
    pState.safeMode = true; // Brief immunity
    
    // Visual update
    renderFrame();
    
    setTimeout(() => { pState.safeMode = false; }, 500);
    save();
    updateUI();
};

const fail = () => {
    clearInterval(pState.interval);
    pState.active = false;
    
    notify("CRUSHED! Card Deleted.");
    
    // DELETE THE CARD
    state.col = state.col.filter(c => c.id !== pState.card.id);
    save();
    updateUI();

    setTimeout(() => {
        // Return to Lobby
        $('pressure-lobby').classList.remove('hidden');
        $('pressure-game').classList.add('hidden');
    }, 2000);
};

const victory = () => {
    clearInterval(pState.interval);
    pState.active = false;

    // Big Bonus for finishing level 10
    // Nerfed from 20x to 5x
    const jackpot = pState.bet * 5; 
    state.gold += jackpot;
    save();
    updateUI();

    notify(`MAX PRESSURE SURVIVED! +${jackpot}G`);

    setTimeout(() => {
        $('pressure-lobby').classList.remove('hidden');
        $('pressure-game').classList.add('hidden');
    }, 2000);
};
