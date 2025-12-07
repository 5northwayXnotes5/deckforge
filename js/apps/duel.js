import { state, $, save, notify, rand } from '../core.js';
import { createCard } from './shop.js';

// Internal Duel State
let dState = {
    active: false,
    round: 1,
    pScore: 0,
    aiScore: 0,
    usedCards: [], // IDs of cards used this session
    selectedCard: null,
    deckFilter: null
};

// --- INITIALIZATION ---
export const init = () => {
    // Populate Deck Filter Dropdown
    const sel = $('duel-deck-filter');
    if (sel) {
        sel.innerHTML = '<option value="">All Cards</option>';
        state.decks.forEach(d => {
            sel.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        });
    }

    // Reset State
    dState = {
        active: true,
        round: 1,
        pScore: 0,
        aiScore: 0,
        usedCards: [],
        selectedCard: null,
        deckFilter: null
    };

    renderBoard();
    renderStrip();
    
    // Clear AI slot visual
    const aiSlot = $('slot-ai');
    if (aiSlot) aiSlot.innerHTML = '';
    
    $('duel-msg').innerText = "Select a card to fight.";
};

// --- FILTERING ---
export const filter = () => {
    const val = $('duel-deck-filter').value;
    dState.deckFilter = val === "" ? null : val;
    renderStrip();
};

// --- RENDERING ---
const renderBoard = () => {
    $('score-you').innerText = dState.pScore;
    $('score-ai').innerText = dState.aiScore;
    $('duel-round').innerText = `Round ${dState.round}`;

    const pSlot = $('slot-you');
    
    if (dState.selectedCard) {
        const t = state.pool.find(x => x.id === dState.selectedCard.tid);
        pSlot.innerHTML = `<img src="${t.img}" style="width:100%;height:100%;object-fit:cover; border-radius:8px;">`;
    } else {
        pSlot.innerHTML = '';
    }
};

const renderStrip = () => {
    const strip = $('duel-strip');
    strip.innerHTML = '';

    // 1. Filter out cards used in this session
    let pool = state.col.filter(c => !dState.usedCards.includes(c.id));

    // 2. Apply Deck Filter
    if (dState.deckFilter) {
        const deck = state.decks.find(x => x.id === dState.deckFilter);
        if (deck) {
            pool = pool.filter(c => deck.cards.includes(c.id));
        }
    }
    
    // 3. Sort by power (Rarity) for convenience
    pool.sort((a,b) => {
        const rA = state.rarity.findIndex(x => x.id === a.rid);
        const rB = state.rarity.findIndex(x => x.id === b.rid);
        return rB - rA;
    });

    // 4. Render
    pool.forEach(c => {
        const t = state.pool.find(x => x.id === c.tid);
        const r = state.rarity.find(x => x.id === c.rid);

        const d = document.createElement('div');
        d.className = 'strip-card';
        d.innerHTML = `
            <img src="${t.img}" style="width:100%;height:100%;object-fit:cover;">
            <div class="rarity-tag" style="background:${r.c}"></div>
        `;
        
        d.onclick = () => {
            dState.selectedCard = c;
            renderBoard();
            $('duel-msg').innerText = "Ready to Fight";
        };
        
        strip.appendChild(d);
    });
};

// --- COMBAT LOGIC ---
export const resolve = () => {
    if (!dState.selectedCard) return notify("Select a card first!");
    if (!dState.active) return;

    const pCard = dState.selectedCard;
    dState.usedCards.push(pCard.id);

    // 1. Generate AI Opponent
    // Logic: AI picks a random card from the pool, but usually a 'Rare' (Index 2)
    // To make it spicier, let's give it a 20% chance to match the player's rarity tier
    let aiRarityId = 'r'; // Default Rare
    if (Math.random() > 0.8) aiRarityId = pCard.rid;

    const aiTemplate = rand(state.pool);
    // Use the shop's helper to make a temp card
    const aiCard = createCard(aiTemplate.id, aiRarityId);

    // Render AI
    const aiSlot = $('slot-ai');
    const aiT = state.pool.find(x => x.id === aiCard.tid);
    const aiR = state.rarity.find(x => x.id === aiCard.rid);
    
    aiSlot.innerHTML = `<img src="${aiT.img}" style="width:100%;height:100%;object-fit:cover; border-radius:8px; border:2px solid ${aiR.c}">`;

    // 2. Pick Stat
    const battleStat = rand(state.stats); // e.g., "ATK"
    
    const pVal = pCard.stat[battleStat] || 0;
    const aiVal = aiCard.stat[battleStat] || 0;

    // 3. Compare
    const msg = $('duel-msg');
    if (pVal > aiVal) {
        dState.pScore++;
        msg.innerText = `WIN! ${battleStat}: ${pVal} vs ${aiVal}`;
        msg.style.color = '#30D158'; // Green
    } else if (pVal < aiVal) {
        dState.aiScore++;
        msg.innerText = `LOST! ${battleStat}: ${pVal} vs ${aiVal}`;
        msg.style.color = '#FF453A'; // Red
    } else {
        msg.innerText = `DRAW! ${battleStat}: ${pVal} vs ${aiVal}`;
        msg.style.color = '#FFD60A'; // Yellow
    }

    // 4. Cleanup & Next Round
    dState.selectedCard = null;
    dState.active = false; // Prevent spam clicking

    setTimeout(() => {
        dState.active = true;
        dState.round++;
        
        // Check Game Over (Best of 3)
        if (dState.round > 3) {
            endGame();
        } else {
            // Next Round Setup
            aiSlot.innerHTML = '';
            renderBoard();
            renderStrip();
            $('duel-msg').innerText = `Round ${dState.round}`;
            $('duel-msg').style.color = 'var(--accent-orange)';
        }
    }, 1500);
};

const endGame = () => {
    let resultMsg = "";
    if (dState.pScore > dState.aiScore) {
        resultMsg = "VICTORY! +10G";
        state.gold += 10;
        notify(resultMsg);
    } else if (dState.pScore < dState.aiScore) {
        resultMsg = "DEFEAT";
        notify(resultMsg);
    } else {
        resultMsg = "DRAW";
        notify(resultMsg);
    }
    
    save();
    
    // Reset after delay
    setTimeout(() => {
        init();
    }, 1000);
};

