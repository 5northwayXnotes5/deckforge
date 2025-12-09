import { state, $, save, notify, rand, uid, updateUI } from '../core.js';

// --- CONFIGURATION ---
// Weights correspond to: [Common, Uncommon, Rare, Epic, Legendary, Mythic]
const PACKS = [
    { id: 0, name: 'Basic', cost: 1000, weights: [90, 10, 0, 0, 0, 0] },
    { id: 1, name: 'Advanced', cost: 2000, weights: [70, 25, 5, 0, 0, 0] },
    { id: 2, name: 'Elite', cost: 5000, weights: [40, 40, 15, 5, 0, 0] },
    { id: 3, name: 'Commander', cost: 10000, weights: [20, 40, 30, 10, 0, 0] },
    { id: 4, name: 'Supreme', cost: 20000, weights: [0, 20, 50, 25, 5, 0] },
    { id: 5, name: 'Mythic', cost: 50000, weights: [0, 0, 15, 50, 30, 5] },
    { id: 6, name: 'God Tier', cost: 1000000, weights: [0, 0, 0, 10, 50, 40] }
];

// --- HELPER: RNG ---
// This is used to determine which rarity you pull based on the pack's weights
const getRarityByWeight = (weightArray) => {
    const total = weightArray.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    
    for (let i = 0; i < weightArray.length; i++) {
        if (r < weightArray[i]) {
            return state.rarity[i];
        }
        r -= weightArray[i];
    }
    return state.rarity[0]; // Fallback to Common
};

// --- HELPER: CARD GENERATOR ---
// Generates a card object. Returns 'CAP' if the user has too many of this card.
// We export this so other apps (like Lab/Saga) can generate rewards too.
export const createCard = (tid, rid) => {
    const template = state.pool.find(x => x.id === tid);
    if (!template) return null;
    
    const rarityObj = state.rarity.find(x => x.id === rid) || state.rarity[0];

    // Check Duplicate Limit
    // (Common: 99, Uncommon: 10, Rare: 5, Epic: 3, Legend: 1, Mythic: 1)
    const existingCount = state.col.filter(c => c.tid === tid && c.rid === rid).length;
    if (existingCount >= rarityObj.lim) {
        return 'CAP';
    }

    // Generate Stats based on Rarity Multiplier
    // Index 0 (Common) = 1x mult, Index 1 = 2x, etc.
    const mult = state.rarity.indexOf(rarityObj) + 1;
    
    const newStat = {};
    state.stats.forEach(k => {
        // Base 10-30 * Multiplier
        newStat[k] = Math.floor(Math.random() * 20 * mult) + (10 * mult);
    });

    return {
        id: uid(),
        tid: tid,
        rid: rid,
        stat: newStat
    };
};

// --- MAIN ACTION: BUY PACK ---
export const buyPack = (packIndex) => {
    // Validation
    if (!state.pool.length) return notify("Card Pool is Empty!");
    
    const pack = PACKS[packIndex];
    if (!pack) return notify("Pack Error");
    
    if (state.gold < pack.cost) return notify("Insufficient Gold");

    // Transaction
    state.gold -= pack.cost;
    save(); // Save gold deduction immediately

    // UI Setup
    const modal = $('pack-modal');
    const opener = $('pack-opener');
    const reveal = $('pack-reveal');
    const doneBtn = $('pack-done');

    modal.classList.add('active');
    opener.style.display = 'flex';
    reveal.innerHTML = '';
    doneBtn.style.display = 'none';

    // "Tap to Open" Logic
    opener.onclick = () => {
        opener.style.display = 'none';
        
        const newCards = [];
        let dustGold = 0;

        // Generate 3 Cards
        for (let i = 0; i < 3; i++) {
            const template = rand(state.pool);
            const rarity = getRarityByWeight(pack.weights);
            
            const result = createCard(template.id, rarity.id);

            if (result === 'CAP') {
                // Duplicate Logic: Refund 20% of pack cost per card
                const refund = Math.floor(pack.cost / 5);
                dustGold += refund;
            } else if (result) {
                newCards.push(result);
            }
        }

        // Apply Results
        if (newCards.length > 0) {
            state.col.push(...newCards);
        }
        
        if (dustGold > 0) {
            state.gold += dustGold;
            notify(`Duplicates Burned (+${dustGold}G)`);
        }

        save();

        // Render Results
        if (newCards.length === 0 && dustGold > 0) {
             reveal.innerHTML = `
                <div style="grid-column:span 3; text-align:center; padding:20px; color:#aaa;">
                    <h3>All Duplicates!</h3>
                    <p>Converted to ${dustGold} Gold.</p>
                </div>
             `;
        } else {
            newCards.forEach(c => {
                const t = state.pool.find(x => x.id === c.tid);
                const r = state.rarity.find(x => x.id === c.rid);
                
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card-thumb';
                cardDiv.style.animation = 'slideUp 0.5s ease forwards';
                cardDiv.innerHTML = `
                    <img src="${t.img}">
                    <div class="rarity-tag" style="background:${r.c}"></div>
                `;
                reveal.appendChild(cardDiv);
            });
        }
        
        doneBtn.style.display = 'block';
    };
};

export const closePack = () => {
    $('pack-modal').classList.remove('active');
};

