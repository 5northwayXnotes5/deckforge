import { state, $, save, notify, rand } from '../core.js';

// --- INTERNAL STATE ---
let mem = {
    firstCard: null,
    lockBoard: false,
    matchesFound: 0,
    attempts: 0,
    entryFee: 20
};

// --- INITIALIZATION ---
export const init = () => {
    // 1. Validation
    if (state.pool.length < 2) return notify("Need more cards in Pool (Settings)");
    
    // 2. Entry Fee
    if (state.gold < mem.entryFee) return notify(`Entry Fee: ${mem.entryFee}G`);
    
    state.gold -= mem.entryFee;
    save();

    // 3. Reset State
    mem = {
        firstCard: null,
        lockBoard: false,
        matchesFound: 0,
        attempts: 0,
        entryFee: 20
    };

    updateStatusUI();
    renderGrid();
};

const updateStatusUI = () => {
    const el = $('mem-status');
    if (!el) return;

    // Calculate Potential Multiplier
    // Minimum moves to win is 6.
    // Base Multiplier starts at 10x and drops by 1 for every attempt over 6.
    
    let multiplier = 0;
    const mistakes = Math.max(0, mem.attempts - 6);
    multiplier = Math.max(0, 10 - mistakes);
    
    if (mem.attempts === 0) multiplier = "MAX"; // Show MAX at start

    el.innerText = `Attempts: ${mem.attempts} | Pot Multiplier: ${multiplier}x`;
};

// --- RENDERING ---
const renderGrid = () => {
    const grid = $('mem-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    // 1. Select 6 Random Images from Pool
    const selected = [];
    for (let i = 0; i < 6; i++) {
        selected.push(rand(state.pool));
    }

    // 2. Duplicate them to make pairs (6 * 2 = 12 cards)
    const deck = [...selected, ...selected];

    // 3. Shuffle
    deck.sort(() => Math.random() - 0.5);

    // 4. Render
    deck.forEach(template => {
        const card = document.createElement('div');
        card.className = 'card-thumb';
        card.dataset.id = template.id; // Store ID to check match
        
        // Initial State: Hidden (Empty innerHTML)
        
        card.onclick = () => handleCardClick(card, template);
        grid.appendChild(card);
    });
};

// --- GAMEPLAY LOGIC ---
const handleCardClick = (cardEl, template) => {
    // Validation
    if (mem.lockBoard) return;
    if (cardEl === mem.firstCard) return; // Prevent double clicking self
    if (cardEl.innerHTML !== '') return; // Already matched or flipped

    // Flip Card (Show Image)
    cardEl.innerHTML = `<img src="${template.img}" style="pointer-events:none;">`;
    cardEl.classList.add('flipped');

    if (!mem.firstCard) {
        // First card of the pair
        mem.firstCard = cardEl;
        return;
    }

    // Second card clicked
    mem.attempts++;
    updateStatusUI();
    
    checkForMatch(cardEl);
};

const checkForMatch = (secondCard) => {
    const isMatch = mem.firstCard.dataset.id === secondCard.dataset.id;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards(secondCard);
    }
};

const disableCards = () => {
    // It's a match!
    // Remove click listeners (already handled by the check `if (cardEl.innerHTML !== '')`)
    // Just reset the comparison buffer
    mem.firstCard = null;
    mem.matchesFound++;

    // Check Win
    if (mem.matchesFound === 6) {
        endGame();
    }
};

const unflipCards = (secondCard) => {
    mem.lockBoard = true; // Prevent clicking others while waiting

    setTimeout(() => {
        // Hide both cards again
        if (mem.firstCard) mem.firstCard.innerHTML = '';
        secondCard.innerHTML = '';
        
        // Reset Board
        mem.firstCard = null;
        mem.lockBoard = false;
    }, 800);
};

// --- END GAME ---
const endGame = () => {
    const mistakes = Math.max(0, mem.attempts - 6);
    const multiplier = Math.max(0, 10 - mistakes);
    
    const payout = mem.entryFee * multiplier;
    
    if (payout > 0) {
        state.gold += payout;
        notify(`PERFECT MEMORY! Won ${payout}G`);
    } else {
        notify("Too many mistakes. 0G Reward.");
    }

    save();
};

