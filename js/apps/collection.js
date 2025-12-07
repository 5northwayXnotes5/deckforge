import { state, $, save, notify } from '../core.js';

// Internal State for this module
let currentCard = null;

// --- MAIN RENDERER ---
export const render = () => {
    const grid = $('col-grid');
    const emptyMsg = $('col-empty');
    
    if (!grid) return;
    
    // Clear current view
    grid.innerHTML = '';
    
    // Check if empty
    if (!state.col || state.col.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        return;
    } else {
        if(emptyMsg) emptyMsg.style.display = 'none';
    }

    // Sort: High Rarity -> Low Rarity
    // We access the rarity array index to determine "value"
    const sorted = [...state.col].sort((a, b) => {
        const rA = state.rarity.findIndex(x => x.id === a.rid);
        const rB = state.rarity.findIndex(x => x.id === b.rid);
        return rB - rA; // Descending
    });

    // Generate DOM
    sorted.forEach(c => {
        const template = state.pool.find(x => x.id === c.tid);
        const rarity = state.rarity.find(x => x.id === c.rid);
        
        // Safety check: if pool was wiped but user still has card data
        if (!template) return; 

        const d = document.createElement('div');
        d.className = 'card-thumb';
        
        // Image & Rarity Bar
        d.innerHTML = `
            <img src="${template.img}" loading="lazy">
            <div class="rarity-tag" style="background:${rarity.c}"></div>
        `;
        
        d.onclick = () => showSheet(c);
        grid.appendChild(d);
    });
};

// --- SHEET (MODAL) LOGIC ---
export const showSheet = (c) => {
    currentCard = c;
    
    const template = state.pool.find(x => x.id === c.tid);
    const rarity = state.rarity.find(x => x.id === c.rid);
    
    if (!template) return;

    // Populate UI
    const nameEl = $('sheet-name');
    if(nameEl) nameEl.innerText = template.name;
    
    const rLabel = $('sheet-rarity');
    if(rLabel) {
        rLabel.innerText = rarity.n;
        rLabel.style.color = rarity.c;
    }
    
    const imgBox = $('sheet-img');
    if(imgBox) {
        imgBox.innerHTML = `<img src="${template.img}" style="width:100%;height:100%;object-fit:cover;">`;
        imgBox.style.borderColor = rarity.c;
    }
    
    // Render Stats
    const statsContainer = $('sheet-stats');
    if(statsContainer) {
        statsContainer.innerHTML = Object.keys(c.stat).map(k => 
            `<span style="background:rgba(255,255,255,0.1);padding:4px 8px;border-radius:4px;font-size:12px;">
                ${k}: ${c.stat[k]}
            </span>`
        ).join('');
    }
    
    // Toggle Deck Button State
    updateDeckButton();

    // Show Modal
    const modal = $('sheet-modal');
    if(modal) modal.classList.add('active');
};

export const closeSheet = () => {
    const modal = $('sheet-modal');
    if(modal) modal.classList.remove('active');
    currentCard = null;
};

// --- ACTION: DELETE (BURN) ---
export const delCard = () => {
    if (!currentCard) return;
    
    // Filter out the current card
    state.col = state.col.filter(x => x.id !== currentCard.id);
    
    // Reward user (Scrap Value)
    state.gold += 10;
    
    notify("Card Burned (+10G)");
    
    save(); // Save to core
    render(); // Re-render grid
    closeSheet();
};

// --- ACTION: TOGGLE DECK ---
const updateDeckButton = () => {
    const btn = $('btn-deck-tog');
    if (!btn) return;

    // Check if an active deck is selected in the system
    if (!state.activeDeckId) {
        btn.innerText = "Select Deck";
        btn.className = "btn"; // Neutral style
        return;
    }

    const deck = state.decks.find(x => x.id === state.activeDeckId);
    if (!deck) {
        // Active deck ID exists but deck was deleted
        btn.innerText = "Deck Err";
        return;
    }

    // Check if card is in that deck
    const isInDeck = deck.cards.includes(currentCard.id);

    if (isInDeck) {
        btn.innerText = "- Deck";
        btn.className = "btn danger"; // Red
    } else {
        btn.innerText = "+ Deck";
        btn.className = "btn filled"; // Blue
    }
};

export const togDeck = () => {
    if (!state.activeDeckId) {
        notify("No Active Deck (Go to Lab)");
        return;
    }

    const deck = state.decks.find(x => x.id === state.activeDeckId);
    if (!deck) return notify("Deck not found");

    if (deck.cards.includes(currentCard.id)) {
        // Remove
        deck.cards = deck.cards.filter(x => x !== currentCard.id);
        notify("Removed from Deck");
    } else {
        // Add
        deck.cards.push(currentCard.id);
        notify("Added to Deck");
    }

    save();
    updateDeckButton(); // Update button visual
};
