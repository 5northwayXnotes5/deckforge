import { state, $, save, notify, uid } from '../core.js';
import { createCard } from './shop.js';

// --- INITIALIZATION ---
export const init = () => {
    // 1. Populate Deck Selectors
    updateDeckList();

    // 2. Populate Fusion Selectors
    updateFusionList();

    // 3. Reset Reactor UI
    updateReactor();
};

// --- DECK MANAGEMENT ---
const updateDeckList = () => {
    const deckSel = $('deck-sel');
    if (!deckSel) return;

    // Save current selection if possible
    const currentVal = deckSel.value;

    deckSel.innerHTML = '<option value="">None</option>';
    state.decks.forEach(d => {
        const isSel = state.activeDeckId === d.id ? 'selected' : '';
        deckSel.innerHTML += `<option value="${d.id}" ${isSel}>${d.name}</option>`;
    });
};

export const saveDeck = () => {
    const input = $('deck-name');
    const name = input.value.trim();
    
    if (!name) return notify("Enter a name");
    
    const newDeck = {
        id: uid(),
        name: name,
        cards: []
    };
    
    state.decks.push(newDeck);
    
    // Auto-select the new deck
    state.activeDeckId = newDeck.id;
    
    input.value = ''; // Clear input
    save();
    notify(`Deck "${name}" Created`);
    updateDeckList();
};

export const selDeck = (val) => {
    state.activeDeckId = val === "" ? null : val;
    save();
    notify(val ? "Deck Activated" : "Deck Deactivated");
};

// --- FUSION REACTOR ---
const updateFusionList = () => {
    const fa = $('fuse-a');
    const fb = $('fuse-b');
    
    if (!fa || !fb) return;

    // Helper to generate options
    // We filter list to be cleaner (maybe sort by rarity)
    const generateOptions = () => {
        let opts = '<option value="">Select Card</option>';
        
        // Sort by Rarity for easier finding
        const sorted = [...state.col].sort((a,b) => {
             const rA = state.rarity.findIndex(x=>x.id===a.rid);
             const rB = state.rarity.findIndex(x=>x.id===b.rid);
             return rB - rA;
        });

        sorted.forEach(c => {
            const t = state.pool.find(x => x.id === c.tid);
            const r = state.rarity.find(x => x.id === c.rid);
            // Display: Name (Rarity Letter)
            opts += `<option value="${c.id}">${t.name} [${r.n.charAt(0)}]</option>`;
        });
        return opts;
    };

    const ops = generateOptions();
    fa.innerHTML = ops;
    fb.innerHTML = ops;
};

export const updateReactor = () => {
    const aid = $('fuse-a').value;
    const bid = $('fuse-b').value;
    
    let rate = "--%";
    let color = "#888";

    // RENDER SLOT A
    if (aid) {
        const c = state.col.find(x => x.id === aid);
        const t = state.pool.find(x => x.id === c.tid);
        const r = state.rarity.find(x => x.id === c.rid);
        $('rx-slot-a').innerHTML = `<img src="${t.img}">`;
        $('rx-slot-a').style.borderColor = r.c;
    } else {
        $('rx-slot-a').innerHTML = '';
        $('rx-slot-a').style.borderColor = '#444';
    }

    // RENDER SLOT B
    if (bid) {
        const c = state.col.find(x => x.id === bid);
        const t = state.pool.find(x => x.id === c.tid);
        const r = state.rarity.find(x => x.id === c.rid);
        $('rx-slot-b').innerHTML = `<img src="${t.img}">`;
        $('rx-slot-b').style.borderColor = r.c;
    } else {
        $('rx-slot-b').innerHTML = '';
        $('rx-slot-b').style.borderColor = '#444';
    }

    // CALCULATE RATE
    if (aid && bid) {
        if (aid === bid) {
            rate = "ERR"; 
            color = "#FF453A"; // Red
        } else {
            const cA = state.col.find(x => x.id === aid);
            const cB = state.col.find(x => x.id === bid);
            
            if (cA.rid !== cB.rid) {
                rate = "ERR";
                color = "#FF453A";
            } else {
                // Determine Probability based on Rarity Tier
                if (cA.rid === 'c') rate = '90%';
                else if (cA.rid === 'u') rate = '75%';
                else if (cA.rid === 'r') rate = '60%';
                else if (cA.rid === 'e') rate = '40%';
                else if (cA.rid === 'l') rate = '20%';
                else rate = '0%'; // Mythics cannot fuse up
                
                color = (rate === '0%' || rate === 'ERR') ? '#FF453A' : '#30D158';
            }
        }
    }

    const rateEl = $('rx-rate');
    if (rateEl) {
        rateEl.innerText = rate;
        rateEl.style.color = color;
    }
};

export const fuse = () => {
    const aid = $('fuse-a').value;
    const bid = $('fuse-b').value;

    if (!aid || !bid) return notify("Select 2 Cards");
    if (aid === bid) return notify("Cannot fuse self!");

    const cA = state.col.find(x => x.id === aid);
    const cB = state.col.find(x => x.id === bid);

    if (cA.rid !== cB.rid) return notify("Must be same rarity!");

    // Cost
    if (state.gold < 50) return notify("Need 50G");
    state.gold -= 50;

    // Calculate Chance
    let chance = 0;
    if (cA.rid === 'c') chance = 0.9;
    else if (cA.rid === 'u') chance = 0.75;
    else if (cA.rid === 'r') chance = 0.60;
    else if (cA.rid === 'e') chance = 0.40;
    else if (cA.rid === 'l') chance = 0.20;

    // Check Max Rarity
    const currentRIdx = state.rarity.findIndex(x => x.id === cA.rid);
    if (currentRIdx >= state.rarity.length - 1) {
        state.gold += 50; // Refund
        return notify("Max Rarity Reached");
    }

    // --- ROLL THE DICE ---
    if (Math.random() < chance) {
        // SUCCESS
        const nextR = state.rarity[currentRIdx + 1];
        // 50/50 chance to inherit the type of Parent A or Parent B
        const baseTid = Math.random() > 0.5 ? cA.tid : cB.tid;
        
        const newC = createCard(baseTid, nextR.id);

        if (newC === 'CAP') {
            notify("Fused into Duplicate (Burned)");
            state.gold += 50; // Refund cost
        } else {
            state.col.push(newC);
            notify(`FUSION SUCCESS! Obtained ${nextR.n}`);
        }
    } else {
        // FAILURE
        state.gold += 10; // Scrap value
        notify("MELTDOWN! Cards Destroyed.");
    }

    // CONSUME CARDS (Both are destroyed regardless of outcome)
    state.col = state.col.filter(x => x.id !== aid && x.id !== bid);

    save();
    
    // Refresh UI
    updateFusionList(); // Re-populate dropdowns because IDs are gone
    updateReactor();    // Clear slots
};

