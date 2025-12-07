import { state, $, save, notify, rand } from '../core.js';
import { createCard } from './shop.js';

// --- DEFAULT CAMPAIGN (Fallback) ---
const DEFAULT_CAMPAIGN = [
    { type: 'story', title: 'The Beginning', text: 'You boot up the system. The path ahead is fragmented. Digital entities block your root access.' },
    { type: 'battle', title: 'Firewall Sentry', difficulty: 1 }, 
    { type: 'loot',   title: 'Cache Dump', reward: 50 },
    { type: 'story', title: 'Deep Sector', text: 'You have breached the outer layer. The encryption here is denser.' },
    { type: 'battle', title: 'Logic Gate Keeper', difficulty: 2 },
    { type: 'loot',   title: 'Encrypted Drop', reward: 100 },
    { type: 'boss',   title: 'Root Admin', difficulty: 3 }
];

// --- INITIALIZATION ---
export const init = () => {
    // 1. Lazy Load Player Progress
    if (typeof state.saga === 'undefined') {
        state.saga = {
            currentStep: 0
        };
    }

    // 2. Lazy Load Campaign Data
    if (!state.campaign || state.campaign.length === 0) {
        state.campaign = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN));
        save();
    }

    renderMap();
};

// --- MAP RENDERING ---
const renderMap = () => {
    const mapEl = $('saga-map');
    if (!mapEl) return;

    mapEl.innerHTML = '';

    state.campaign.forEach((node, index) => {
        const el = document.createElement('div');
        el.className = 'saga-node';
        
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

        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:bold;">${index + 1}. ${node.title}</div>
                <div>${icon}</div>
            </div>
            <div style="font-size:12px; color:#888; margin-top:4px;">${node.type.toUpperCase()}</div>
        `;

        if (statusClass === 'active') {
            el.onclick = () => playNode(node);
        }

        mapEl.appendChild(el);
    });
    
    // Victory Screen
    if (state.saga.currentStep >= state.campaign.length) {
        mapEl.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="ph-fill ph-trophy" style="font-size:50px; color:var(--accent-gold); margin-bottom:20px;"></i>
                <h2>Campaign Complete</h2>
                <p>System Rooted.</p>
                <div class="btn filled" onclick="app.resetSaga()">Reboot (Reset Story)</div>
            </div>
        `;
    }
};

// --- GAMEPLAY ---
const playNode = (node) => {
    if (node.type === 'story') {
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
    
    mapEl.innerHTML = `
        <div style="padding:20px; text-align:center; animation: fadeIn 0.3s;">
            <h2>${title}</h2>
            <p style="line-height:1.6; color:#ccc; margin-bottom:30px;">${text}</p>
            <div class="btn filled" id="saga-action-btn">${btnText}</div>
        </div>
    `;
    
    $('saga-action-btn').onclick = callback;
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

// --- BATTLE LOGIC ---
const startBattle = (node) => {
    if (state.pool.length === 0) return notify("Pool Empty! Cannot generate enemy.");

    let targetRarity = 'c';
    if (node.difficulty === 2) targetRarity = 'r';
    if (node.difficulty === 3) targetRarity = 'l';

    const enemyTemplate = rand(state.pool);
    
    if (state.col.length === 0) return notify("You need cards to fight!");
    
    const playerCard = state.col.reduce((prev, current) => {
        const prevTotal = Object.values(prev.stat).reduce((a,b)=>a+b,0);
        const currTotal = Object.values(current.stat).reduce((a,b)=>a+b,0);
        return (prevTotal > currTotal) ? prev : current;
    });

    const playerTemplate = state.pool.find(x => x.id === playerCard.tid);

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
    
    const eStat = {};
    const rObj = state.rarity.find(x => x.id === eRarityId) || state.rarity[0];
    const mult = state.rarity.indexOf(rObj) + 1;
    state.stats.forEach(k => eStat[k] = Math.floor(Math.random() * 20 * mult) + (10 * mult));

    const pAvg = Object.values(pCard.stat).reduce((a,b)=>a+b,0) / Object.keys(pCard.stat).length;
    const eAvg = Object.values(eStat).reduce((a,b)=>a+b,0) / Object.keys(eStat).length;

    const pRoll = pAvg * (0.9 + Math.random() * 0.2);
    const eRoll = eAvg * (0.9 + Math.random() * 0.2);

    if (pRoll >= eRoll) {
        log.innerText = "VICTORY! Enemy Defeated.";
        log.style.color = "#30D158";
        $('saga-fight-btn').style.display = 'none';
        
        setTimeout(() => {
            if (node.type === 'boss') {
                const reward = createCard(eTemplate.id, eRarityId);
                if (reward && reward !== 'CAP') {
                    state.col.push(reward);
                    notify(`Boss Captured: ${eTemplate.name}`);
                } else {
                    notify("Boss Defeated (Capacity Full)");
                }
            }
            completeNode();
        }, 1500);
    } else {
        log.innerText = "DEFEAT! Critical Failure.";
        log.style.color = "#FF453A";
        $('saga-fight-btn').innerText = "Retreat";
        $('saga-fight-btn').className = "btn";
        $('saga-fight-btn').onclick = () => renderMap(); 
    }
};
