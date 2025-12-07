import { state, $, save, notify, rand } from '../core.js';

// --- INTERNAL STATE ---
let bj = {
    deck: [],
    dealerHand: [],
    playerHand: [],
    bet: 0,
    turnOver: false
};

// --- NAVIGATION ---
export const init = () => {
    back(); // Reset to menu
};

export const openGame = (gameId) => {
    // Hide Menu
    const home = $('casino-home');
    if (home) home.classList.add('hidden');
    
    // Hide all stages
    document.querySelectorAll('.casino-stage').forEach(el => el.classList.add('hidden'));
    
    // Show selected stage
    const stage = $(`cg-${gameId}`);
    if (stage) stage.classList.remove('hidden');

    // Specific Init Logic
    if (gameId === 'slots') renderReels();
};

export const back = () => {
    // Hide all stages
    document.querySelectorAll('.casino-stage').forEach(el => el.classList.add('hidden'));
    
    // Show Menu
    const home = $('casino-home');
    if (home) home.classList.remove('hidden');
};

// --- BLACKJACK ---
const getCardValue = (card) => {
    // card is 2-11. 11 is Ace.
    return card;
};

const sumHand = (hand) => {
    let sum = hand.reduce((a, b) => a + b, 0);
    let aces = hand.filter(c => c === 11).length;

    // Downgrade Aces if bust
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    return sum;
};

const renderBJ = () => {
    const table = $('bj-table');
    if (!table) return;

    // Dealer Display
    let dealerStr = "";
    if (bj.turnOver) {
        dealerStr = `${bj.dealerHand.join(' ')} (${sumHand(bj.dealerHand)})`;
    } else {
        // Hide hole card
        dealerStr = `? ${bj.dealerHand[1]}`;
    }

    table.innerHTML = `
        <div style="text-align:center; margin-bottom:10px; color:#888;">
            <div>DEALER</div>
            <div style="font-size:18px; color:white;">${dealerStr}</div>
        </div>
        <div style="text-align:center; margin-top:20px;">
            <div style="font-size:24px; font-weight:bold; color:${sumHand(bj.playerHand) > 21 ? '#FF453A' : '#30D158'}">
                ${bj.playerHand.join(' ')}
            </div>
            <div style="font-size:12px; color:#888;">YOU (${sumHand(bj.playerHand)})</div>
        </div>
    `;
};

export const playBJ = () => {
    const betInput = $('bj-bet');
    const bet = parseInt(betInput.value);

    if (isNaN(bet) || bet <= 0) return notify("Invalid Bet");
    if (state.gold < bet) return notify("Insufficient Funds");

    state.gold -= bet;
    save();

    bj.bet = bet;
    bj.turnOver = false;

    // Simple Infinite Deck (Probabilities roughly match 6-deck shoe)
    // 2-9 are face value. 10, J, Q, K are 10. Ace is 11.
    const deckSource = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
    const draw = () => deckSource[Math.floor(Math.random() * deckSource.length)];

    bj.playerHand = [draw(), draw()];
    bj.dealerHand = [draw(), draw()];

    // Check Instant Blackjack
    if (sumHand(bj.playerHand) === 21) {
        bj.turnOver = true;
        endBJ();
    } else {
        // UI Switch
        $('bj-controls').classList.add('hidden');
        $('bj-actions').classList.remove('hidden');
        renderBJ();
    }
};

export const hitBJ = () => {
    const deckSource = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
    bj.playerHand.push(deckSource[Math.floor(Math.random() * deckSource.length)]);
    
    renderBJ();

    if (sumHand(bj.playerHand) > 21) {
        bj.turnOver = true;
        endBJ();
    }
};

export const standBJ = () => {
    bj.turnOver = true;
    
    // Dealer Logic: Hit on Soft 17
    const deckSource = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
    
    while (sumHand(bj.dealerHand) < 17) {
        bj.dealerHand.push(deckSource[Math.floor(Math.random() * deckSource.length)]);
    }

    renderBJ();
    endBJ();
};

const endBJ = () => {
    const pSum = sumHand(bj.playerHand);
    const dSum = sumHand(bj.dealerHand);
    let winMult = 0;
    let msg = "";

    if (pSum > 21) {
        msg = "BUST! You Lost.";
    } else if (dSum > 21) {
        msg = "Dealer Bust! You Win.";
        winMult = 2;
    } else if (pSum > dSum) {
        msg = "You Win!";
        winMult = 2;
    } else if (pSum === dSum) {
        msg = "Push (Tie).";
        winMult = 1;
    } else {
        msg = "Dealer Wins.";
    }

    if (winMult > 0) {
        const payout = bj.bet * winMult;
        state.gold += payout;
        if (winMult > 1) notify(`+${payout}G`);
    } else {
        notify("Lost Bet");
    }

    renderBJ(); // Final render to show dealer cards
    save();

    // Reset UI
    $('bj-actions').classList.add('hidden');
    $('bj-controls').classList.remove('hidden');
};

// --- SLOTS ---
const renderReels = () => {
    // If pool is empty, show placeholders
    const usePool = state.pool.length > 0;
    
    ['reel-1', 'reel-2', 'reel-3'].forEach(id => {
        const el = $(id);
        if (el) {
            if (usePool) {
                const img = rand(state.pool).img;
                el.innerHTML = `<img src="${img}">`;
            } else {
                el.innerHTML = `<span style="font-size:30px">🍒</span>`;
            }
        }
    });
};

export const spinSlots = () => {
    if (!state.pool.length) return notify("Card Pool Empty (Visit Settings)");
    
    const betInput = $('slot-bet');
    const bet = parseInt(betInput.value);

    if (state.gold < bet) return notify("Insufficient Funds");

    state.gold -= bet;
    save();

    let spins = 0;
    const maxSpins = 10;
    
    // Animation Loop
    const interval = setInterval(() => {
        renderReels();
        spins++;
        if (spins >= maxSpins) {
            clearInterval(interval);
            checkSlotsWin(bet);
        }
    }, 100);
};

const checkSlotsWin = (bet) => {
    const i1 = $('reel-1').querySelector('img').src;
    const i2 = $('reel-2').querySelector('img').src;
    const i3 = $('reel-3').querySelector('img').src;

    if (i1 === i2 && i2 === i3) {
        const win = bet * 10;
        state.gold += win;
        notify(`JACKPOT! +${win}G`);
    } else if (i1 === i2 || i2 === i3 || i1 === i3) {
        const win = bet * 2;
        state.gold += win;
        notify(`Mini Win! +${win}G`);
    } else {
        notify("No Match");
    }
    save();
};

// --- ROULETTE ---
export const spinRoulette = (choice) => {
    const betInput = $('roul-bet');
    const bet = parseInt(betInput.value);
    
    if (state.gold < bet) return notify("Insufficient Funds");

    state.gold -= bet;
    save();

    const resEl = $('roul-res');
    resEl.innerText = "Spinning...";
    resEl.style.color = "white";

    setTimeout(() => {
        const n = Math.floor(Math.random() * 37); // 0-36
        
        let color = 'black';
        if (n === 0) color = 'green';
        else if (n % 2 !== 0) color = 'red'; // Odd is Red (Simplified rule)

        resEl.innerText = n;
        resEl.style.color = color === 'black' ? 'white' : (color === 'green' ? '#30D158' : '#FF453A');

        if (choice === color) {
            const win = bet * 2;
            state.gold += win;
            notify(`WIN! +${win}G`);
        } else {
            notify("Lost");
        }
        save();
    }, 1000);
};

// --- DICE ---
export const rollDice = (type) => {
    const betInput = $('dice-bet');
    const bet = parseInt(betInput.value);

    if (state.gold < bet) return notify("Insufficient Funds");

    state.gold -= bet;
    save();

    const r1 = Math.ceil(Math.random() * 6);
    const r2 = Math.ceil(Math.random() * 6);
    const sum = r1 + r2;

    $('dice-disp').innerText = `${r1} + ${r2} = ${sum}`;

    let winMult = 0;
    if (type === 'lo' && sum < 7) winMult = 2;
    if (type === 'hi' && sum > 7) winMult = 2;
    if (type === '7' && sum === 7) winMult = 4;

    if (winMult > 0) {
        const win = bet * winMult;
        state.gold += win;
        notify(`WIN! +${win}G`);
    } else {
        notify("Lost");
    }
    save();
};

