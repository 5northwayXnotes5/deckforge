import { state, $, save, notify, rand } from '../core.js';
import { createCard } from './shop.js';

// --- INTERNAL STATE ---
let saga = {
    activeNode: null,
    currentNodeIndex: 0
};

// --- DEFAULT CAMPAIGN ---
// This is the skeleton. The specific enemies are filled in dynamically
// based on the user's Card Pool in Settings.
const CAMPAIGN = [
    { type: 'story', title: 'The Beginning', text: 'You boot up the system. The path ahead is fragmented. Digital entities block your root access.' },
    { type: 'battle', title: 'Firewall Sentry', difficulty: 1 }, // Easy Battle
    { type: 'loot',   title: 'Cache Dump', reward: 50 },
    { type: 'story', title: 'Deep Sector', text: 'You have breached the outer layer. The encryption here is denser.' },
    { type: 'battle', title: 'Logic Gate Keeper', difficulty: 2 }, // Medium Battle
    { type: 'loot',   title: 'Encrypted Drop', reward: 100 },
    { type: 'boss',   title: 'Root Admin', difficulty: 3 } // Boss Battle
];

// --- INITIALIZATION ---
export const init = () => {
    // 1. Lazy Load State
    if (typeof state.saga === 'undefined') {
        state.saga = {
            currentStep: 0,
            completed: false
        };
    }

    renderMap();
};

// --- MAP RENDERING ---
const renderMap = () => {
    const mapEl = $('saga-map');
    if (!mapEl) return;

    mapEl.innerHTML = '';

    CAMPAIGN.forEach((node, index) => {
        const el = document.createElement('div');
        el.className = 'saga-node';
        
        // STATUS LOGIC
        // Past nodes are "completed"
        // Current node is "active"
        // Future nodes are "locked"
        
        let statusClass = '';
        let icon = '';

        if (index < state.saga.currentStep) {
            statusClass = 'completed';
            icon = '<i class="ph-fill ph-check-circle" style="color:var(--accent-green)"></i>';
        } else if (index === state.saga.currentStep) {
            statusClass = 'active';
            icon = '<i class="ph-fill ph-caret-circle-right" style="color:var(--accent-orange)"></i>';
        } else {
            statusClass = 'locked';
            icon = '<i class="ph-fill ph-lock-key" style="color:#444"></i>';
        }

        el.classList.add(statusClass);

        // Content
        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:bold;">${index + 1}. ${node.title}</div>
                <div>${icon}</div>
            </div>
            <div style="font-size:12px; color:#888; margin-top:4px;">${node.type.toUpperCase()}</div>
        `;

        // Click Handler (Only for active node)
        if (statusClass === 'active') {
            el.onclick = () => playNode(node, index);
        }

        mapEl.appendChild(el);
    });
    
    // Completion Message
    if (state.saga.currentStep >= CAMPAIGN.length) {
        mapEl.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="ph-fill ph-trophy" style="font-size:50px; color:var(--accent-gold); margin-bottom:20px;"></i>
                <h2>System Rooted</h2>
                <p>You have conquered the default campaign.</p>
                <div class="btn filled" onclick="app.resetSaga()">Reboot (Reset Story)</div>
            </div>
        `;
    }
};

// --- GAMEPLAY ---
const playNode = (node, index) => {
    if (node.type === 'story') {
        // Simple Alert for Story (Could be a modal, but alert is cleaner for text)
        // Using a custom "notify" style would be better, but we lack a text modal.
        // We'll use the Term output or just a confirm for now.
        // Actually, let's inject a temporary view into the Saga window.
        showEventView(node.title, node.text, "Proceed", () => completeNode());
    } 
    else if (node.type === 'loot') {
        showEventView(node.title, `You found ${node.reward} Gold data fragments.`, "Collect", () => {
            state.gold += node.reward;
            save();
            completeNode();
        });
    } 
    else if (node.type === 'battle' || node.type === 'boss') {
        startBattle(node);
    }
};

const showEventView = (title, text, btnText, callback) => {
    const mapEl = $('saga-map');
    const originalContent = mapEl.innerHTML;

    mapEl.innerHTML = `
        <div style="padding:20px; text-align:center; animation: fadeIn 0.3s;">
            <h2>${title}</h2>
            <p style="line-height:1.6; color:#ccc; margin-bottom:30px;">${text}</p>
            <div class="btn filled" id="saga-action-btn">${btnText}</div>
        </div>
    `;
    
    $('saga-action-btn').onclick = () => {
        // callback(); // We don't restore view, we re-render map which happens in init/complete
        callback();
    };
};

const completeNode = () => {
    state.saga.currentStep++;
    save();
    renderMap();
};

export const resetSaga = () => {
    state.saga.currentStep = 0;
    save();
    renderMap();
};

// --- BATTLE LOGIC (Simplified Duel) ---
const startBattle = (node) => {
    // 1. Generate Enemy based on User Pool
    // If Pool is empty, fallback
    if (state.pool.length === 0) return notify("Pool Empty! Cannot generate enemy.");

    // Difficulty determines Rarity of enemy
    // 1 = Common/Uncommon, 2 = Rare/Epic, 3 = Legend/Mythic
    let targetRarity = 'c';
    if (node.difficulty === 2) targetRarity = 'r';
    if (node.difficulty === 3) targetRarity = 'l';

    // Find a card template suitable for this boss
    // (e.g. For boss, try to find a cool looking card)
    const enemyTemplate = rand(state.pool);
    
    // User needs to select a card to fight with
    // For simplicity in this v1 Saga, we auto-select their strongest card
    // or we prompt them. To keep flow fast, let's Auto-Select Best Card.
    if (state.col.length === 0) return notify("You need cards to fight!");
    
    // Find player's best card (highest total stats)
    const playerCard = state.col.reduce((prev, current) => {
        const prevTotal = Object.values(prev.stat).reduce((a,b)=>a+b,0);
        const currTotal = Object.values(current.stat).reduce((a,b)=>a+b,0);
        return (prevTotal > currTotal) ? prev : current;
    });

    const playerTemplate = state.pool.find(x => x.id === playerCard.tid);

    // Show Battle View
    const mapEl = $('saga-map');
    mapEl.innerHTML = `
        <div style="text-align:center; padding:20px;">
            <h3>${node.title}</h3>
            <div style="display:flex; justify-content:space-around; align-items:center; margin:20px 0;">
                <div style="width:80px;">
                    <img src="${playerTemplate.img}" style="width:100%; border-radius:8px;">
                    <div style="font-size:12px; margin-top:5px;">You</div>
                </div>
                <div style="font-weight:900; color:#FF453A;">VS</div>
                <div style="width:80px;">
                    <img src="${enemyTemplate.img}" style="width:100%; border-radius:8px; filter:grayscale(100%) contrast(120%);">
                    <div style="font-size:12px; margin-top:5px;">Enemy</div>
                </div>
            </div>
            <div id="saga-battle-log" style="font-size:13px; color:#888; height:40px;">Analyzing stats...</div>
            <div class="btn danger" id="saga-fight-btn">ENGAGE</div>
        </div>
    `;

    $('saga-fight-btn').onclick = () => resolveBattle(playerCard, enemyTemplate, targetRarity, node);
};

const resolveBattle = (pCard, eTemplate, eRarityId, node) => {
    const log = $('saga-battle-log');
    
    // Create actual enemy stats
    // Note: We don't add this card to DB, just generate object
    // We use the shop generator but don't save it
    // We manually gen stats to avoid imports if circular (but we imported createCard so we good, but wait createCard checks limits!)
    // Let's just manually gen stats to be safe and unbound.
    
    const eStat = {};
    const rObj = state.rarity.find(x => x.id === eRarityId);
    const mult = state.rarity.indexOf(rObj) + 1;
    state.stats.forEach(k => eStat[k] = Math.floor(Math.random() * 20 * mult) + (10 * mult));

    // BATTLE!
    // Compare average stat
    const pAvg = Object.values(pCard.stat).reduce((a,b)=>a+b,0) / Object.keys(pCard.stat).length;
    const eAvg = Object.values(eStat).reduce((a,b)=>a+b,0) / Object.keys(eStat).length;

    // RNG Factor (+/- 10%)
    const pRoll = pAvg * (0.9 + Math.random() * 0.2);
    const eRoll = eAvg * (0.9 + Math.random() * 0.2);

    if (pRoll >= eRoll) {
        log.innerText = "VICTORY! Enemy Firewall Breached.";
        log.style.color = "#30D158";
        $('saga-fight-btn').style.display = 'none';
        
        setTimeout(() => {
            if (node.type === 'boss') {
                // Boss Drop!
                const reward = createCard(eTemplate.id, eRarityId);
                if (reward && reward !== 'CAP') {
                    state.col.push(reward);
                    notify("Boss Captured!");
                }
            }
            completeNode();
        }, 1500);
    } else {
        log.innerText = "DEFEAT! System Integrity Critical.";
        log.style.color = "#FF453A";
        $('saga-fight-btn').innerText = "Retreat";
        $('saga-fight-btn').className = "btn";
        $('saga-fight-btn').onclick = () => renderMap(); // Go back to map
    }
};

