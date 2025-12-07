import { state, $, save, notify, rand } from '../core.js';

// --- INITIALIZATION ---
export const init = () => {
    const winBox = $('roy-win-box');
    if (winBox) winBox.style.display = 'none';

    const sel = $('roy-champ');
    sel.innerHTML = '';

    // Validation: User needs at least 1 card
    if (!state.col.length) {
        sel.innerHTML = '<option>No Cards Owned</option>';
        return;
    }

    // Filter Unique Types for Dropdown
    // (We don't want to list 50 duplicates of "Pikachu")
    const uniqueTypes = [];
    const seen = new Set();

    state.col.forEach(c => {
        if (!seen.has(c.tid)) {
            seen.add(c.tid);
            uniqueTypes.push(c);
        }
    });

    uniqueTypes.forEach(c => {
        const t = state.pool.find(x => x.id === c.tid);
        sel.innerHTML += `<option value="${c.tid}">${t.name}</option>`;
    });
};

// --- BOT GENERATOR ---
// Bots ignore collection limits and just exist for this match.
const generateBot = (index) => {
    const t = rand(state.pool);
    
    // Weighted Rarity for Bots:
    // 50% Common, 30% Uncommon, 15% Rare, 4% Epic, 1% Legend
    const weights = [50, 30, 15, 4, 1, 0];
    const total = weights.reduce((a, b) => a + b, 0);
    let rVal = Math.random() * total;
    let rObj = state.rarity[0];

    for (let i = 0; i < weights.length; i++) {
        if (rVal < weights[i]) {
            rObj = state.rarity[i];
            break;
        }
        rVal -= weights[i];
    }

    // Generate Stats
    const stat = {};
    const mult = state.rarity.indexOf(rObj) + 1;
    state.stats.forEach(k => {
        stat[k] = Math.floor(Math.random() * 20 * mult) + (10 * mult);
    });

    return {
        id: `bot_${index}`,
        tid: t.id,
        rid: rObj.id,
        stat: stat,
        isBot: true,
        name: t.name // Cache name for easy display
    };
};

// --- TOURNAMENT LOGIC ---
export const run = () => {
    // 1. Validation
    if (!state.col.length) return notify("No Cards in Collection");
    
    const betInput = $('roy-bet');
    const bet = parseInt(betInput.value);
    
    if (isNaN(bet) || bet <= 0) return notify("Invalid Bet");
    if (state.gold < bet) return notify("Insufficient Funds");

    const pickTid = $('roy-champ').value;
    
    // Find the actual card object in user's collection (first match)
    const playerCard = state.col.find(c => c.tid === pickTid);
    if (!playerCard) return notify("Champion selection error");

    // 2. Transaction
    state.gold -= bet;
    save();

    // 3. Assemble Participants (8 Total)
    let participants = [playerCard];

    // Create 7 Bots
    for (let i = 0; i < 7; i++) {
        participants.push(generateBot(i));
    }

    // Shuffle Bracket
    participants = participants.sort(() => Math.random() - 0.5);

    // 4. Run Simulation (Instant)
    // Structure: 8 -> 4 -> 2 -> 1
    
    let round = 1;
    while (participants.length > 1) {
        const nextRound = [];
        
        // Pair up
        while (participants.length > 0) {
            const fighterA = participants.pop();
            const fighterB = participants.pop();
            
            // Pick a random stat for this duel
            const battleStat = rand(state.stats);
            
            // Get Stat Values (Handle missing stats safely)
            const valA = fighterA.stat[battleStat] || 0;
            const valB = fighterB.stat[battleStat] || 0;
            
            // Determine Winner (Tie goes to fighter A)
            if (valA >= valB) {
                nextRound.push(fighterA);
            } else {
                nextRound.push(fighterB);
            }
        }
        
        participants = nextRound;
        round++;
    }

    const winner = participants[0];

    // 5. Render Results
    const winBox = $('roy-win-box');
    winBox.style.display = 'block';

    const winTemplate = state.pool.find(x => x.id === winner.tid);
    const winRarity = state.rarity.find(x => x.id === winner.rid);

    $('roy-win-name').innerText = winTemplate.name + (winner.isBot ? " (Bot)" : "");
    
    const imgContainer = $('roy-win-img');
    imgContainer.innerHTML = `<img src="${winTemplate.img}" style="width:100%;height:100%;object-fit:cover;">`;
    imgContainer.style.border = `2px solid ${winRarity.c}`;

    // 6. Payout Logic
    const payoutEl = $('roy-payout');
    
    // Check if the winner is the player's specific card instance
    if (winner.id === playerCard.id) {
        const payout = bet * 5;
        state.gold += payout;
        payoutEl.innerText = `CHAMPION! +${payout}G`;
        payoutEl.style.color = '#30D158'; // Green
        notify("You Won the Royale!");
    } else {
        payoutEl.innerText = "Better luck next time.";
        payoutEl.style.color = '#FF453A'; // Red
    }

    save();
};

