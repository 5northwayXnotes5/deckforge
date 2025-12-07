import { state, $, save, notify } from '../core.js';

// --- CONFIGURATION ---
const ACHIEVEMENTS = [
    { id: 'col_5',   title: 'Novice',       desc: 'Own 5 Cards',        req: (s) => s.col.length >= 5,           reward: 50,   type: 'title' },
    { id: 'col_20',  title: 'Collector',    desc: 'Own 20 Cards',       req: (s) => s.col.length >= 20,          reward: 200,  type: 'gold' },
    { id: 'col_50',  title: 'Curator',      desc: 'Own 50 Cards',       req: (s) => s.col.length >= 50,          reward: 500,  type: 'title' },
    { id: 'gold_1k', title: 'Rich',         desc: 'Hold 1,000 Gold',    req: (s) => s.gold >= 1000,              reward: 100,  type: 'title' },
    { id: 'gold_10k',title: 'Tycoon',       desc: 'Hold 10,000 Gold',   req: (s) => s.gold >= 10000,             reward: 1000, type: 'title' },
    { id: 'bank_5k', title: 'Investor',     desc: '5,000 in Bank',      req: (s) => (s.bank || 0) >= 5000,       reward: 250,  type: 'gold' },
    { id: 'rar_r',   title: 'Shiny',        desc: 'Own a Rare',         req: (s) => s.col.some(c => c.rid === 'r'), reward: 50,   type: 'gold' },
    { id: 'rar_l',   title: 'Legend',       desc: 'Own a Legendary',    req: (s) => s.col.some(c => c.rid === 'l'), reward: 500,  type: 'title' },
    { id: 'rar_m',   title: 'Godslayer',    desc: 'Own a Mythic',       req: (s) => s.col.some(c => c.rid === 'm'), reward: 2000, type: 'title' }
];

// --- INITIALIZATION ---
export const init = () => {
    // 1. Lazy Load State
    if (typeof state.museum === 'undefined') {
        state.museum = {
            completed: [], // Array of IDs
            activeTitle: 'Novice'
        };
    }

    renderMuseum();
    updateTitleDisplay();
};

// --- LOGIC ---
const renderMuseum = () => {
    const grid = $('mus-grid');
    if (!grid) return;

    grid.innerHTML = '';

    ACHIEVEMENTS.forEach(ach => {
        const isCompleted = state.museum.completed.includes(ach.id);
        const canComplete = !isCompleted && ach.req(state);
        
        const el = document.createElement('div');
        el.className = 'shop-item'; // Re-use styling
        
        let icon = '<i class="ph-fill ph-lock-key" style="color:#666"></i>';
        let action = '';
        let statusColor = '#444';

        if (isCompleted) {
            icon = '<i class="ph-fill ph-medal" style="color:var(--accent-gold)"></i>';
            statusColor = 'var(--panel-bg)'; // Neutral
            // If it's a title, show "Equip" button
            if (ach.type === 'title') {
                if (state.museum.activeTitle === ach.title) {
                    action = `<div class="list-sub" style="color:var(--accent-green)">Equipped</div>`;
                } else {
                    action = `<div class="btn sm" id="btn-equip-${ach.id}">Equip</div>`;
                }
            } else {
                action = `<div class="list-sub">Claimed</div>`;
            }
        } else if (canComplete) {
            icon = '<i class="ph-fill ph-star" style="color:var(--accent-blue)"></i>';
            statusColor = 'rgba(10, 132, 255, 0.1)'; // Blue tint
            action = `<div class="btn sm filled" id="btn-claim-${ach.id}">Claim</div>`;
        } else {
            // Locked
            action = `<div class="list-sub" style="opacity:0.5">${ach.type === 'title' ? 'Title' : ach.reward + 'G'}</div>`;
        }

        el.style.background = statusColor;
        el.innerHTML = `
            <div style="font-size:24px; width:40px; text-align:center;">${icon}</div>
            <div style="flex:1;">
                <div style="font-weight:700;">${ach.title}</div>
                <div class="list-sub">${ach.desc}</div>
            </div>
            <div>${action}</div>
        `;

        grid.appendChild(el);

        // Listeners
        if (canComplete) {
            const btn = document.getElementById(`btn-claim-${ach.id}`);
            if (btn) btn.onclick = () => claim(ach);
        }
        if (isCompleted && ach.type === 'title' && state.museum.activeTitle !== ach.title) {
            const btn = document.getElementById(`btn-equip-${ach.id}`);
            if (btn) btn.onclick = () => equip(ach.title);
        }
    });
};

const claim = (ach) => {
    state.museum.completed.push(ach.id);
    
    if (ach.type === 'gold') {
        state.gold += ach.reward;
        notify(`Achievement Unlocked! +${ach.reward}G`);
    } else {
        notify(`Title Unlocked: "${ach.title}"`);
    }
    
    save();
    renderMuseum();
};

const equip = (title) => {
    state.museum.activeTitle = title;
    save();
    renderMuseum();
    updateTitleDisplay();
    notify(`Title set to "${title}"`);
};

const updateTitleDisplay = () => {
    const el = $('mus-title');
    if (el) el.innerText = state.museum.activeTitle || 'Novice';
};

