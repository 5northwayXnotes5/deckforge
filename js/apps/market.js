import { state, $, save, notify, rand } from '../core.js';

// --- INTERNAL STATE ---
let marketInterval = null;
let bulkMult = 1; // Default to x1

// Initial Base Prices
const BASE_PRICES = {
    'c': 10,
    'u': 25,
    'r': 50,
    'e': 100,
    'l': 250,
    'm': 1000
};

// --- INITIALIZATION ---
export const init = () => {
    // 1. Lazy Load State
    if (typeof state.market === 'undefined') {
        state.market = {
            holdings: {}, // { 'c': 10, 'u': 0 ... }
            prices: { ...BASE_PRICES }
        };
    }

    // Ensure all rarities exist in holdings/prices
    state.rarity.forEach(r => {
        if (typeof state.market.holdings[r.id] === 'undefined') state.market.holdings[r.id] = 0;
        if (typeof state.market.prices[r.id] === 'undefined') state.market.prices[r.id] = BASE_PRICES[r.id] || 10;
    });

    // 2. Start Ticker
    renderMarket();
    if (marketInterval) clearInterval(marketInterval);
    marketInterval = setInterval(tick, 5000); // Update every 5s
};

// --- MARKET ENGINE ---
const tick = () => {
    state.rarity.forEach(r => {
        let current = state.market.prices[r.id];
        const base = BASE_PRICES[r.id] || 10;

        // Volatility: Higher rarity = More volatile
        const volatility = 0.05 + (state.rarity.indexOf(r) * 0.02);
        
        // Random Walk
        let change = 1 + (Math.random() * volatility * 2 - volatility); // e.g. 0.95 to 1.05
        
        // Mean Reversion (Rubber band effect)
        // If price is 2x base, pull it down. If 0.5x base, push it up.
        if (current > base * 2) change -= 0.02;
        if (current < base * 0.5) change += 0.02;

        let newPrice = Math.floor(current * change);
        if (newPrice < 1) newPrice = 1; // Floor

        state.market.prices[r.id] = newPrice;
    });
    
    // Auto-save occasionally? No, only on transaction. 
    // We update UI only.
    renderMarket();
};

// --- RENDERING ---
const renderMarket = () => {
    const list = $('market-list');
    if (!list) return;

    list.innerHTML = '';

    // NEW: Bulk Toggle Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'flex-end';
    header.style.padding = '0 10px 10px';
    header.innerHTML = `
        <div class="btn sm ${bulkMult === 10 ? 'filled' : ''}" id="btn-bulk-tog">
            ${bulkMult === 10 ? 'Bulk: x10' : 'Mode: x1'}
        </div>
    `;
    list.appendChild(header);

    document.getElementById('btn-bulk-tog').onclick = toggleBulk;

    state.rarity.forEach(r => {
        const price = state.market.prices[r.id];
        const owned = state.market.holdings[r.id];
        const base = BASE_PRICES[r.id] || 10;

        // Trend Color
        let color = '#fff';
        let icon = '';
        if (price > base * 1.2) { color = '#30D158'; icon = '▲'; } // Green
        else if (price < base * 0.8) { color = '#FF453A'; icon = '▼'; } // Red
        else { color = '#FFD60A'; icon = '-'; } // Yellow

        // Template
        const row = document.createElement('div');
        row.className = 'shop-item'; // Re-use shop style
        row.style.marginBottom = '10px';
        
        row.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; width:50px;">
                <div style="font-size:20px; font-weight:bold; color:${r.c}">${r.n.charAt(0)}</div>
                <div style="font-size:10px; color:#666;">${r.id.toUpperCase()}</div>
            </div>
            <div style="flex:1; padding:0 10px;">
                <div style="display:flex; justify-content:space-between;">
                    <span style="font-weight:700;">${r.n} Fund</span>
                    <span style="font-family:monospace; color:${color}">${icon} ${price} G</span>
                </div>
                <div style="font-size:11px; color:#888; margin-top:4px;">
                    Owned: <span style="color:white">${owned}</span> (Value: ${owned * price}G)
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:4px;">
                <div class="btn sm filled" id="btn-buy-${r.id}">Buy x${bulkMult}</div>
                <div class="btn sm" id="btn-sell-${r.id}">Sell x${bulkMult}</div>
            </div>
        `;

        list.appendChild(row);

        // Attach Listeners
        document.getElementById(`btn-buy-${r.id}`).onclick = () => buy(r.id);
        document.getElementById(`btn-sell-${r.id}`).onclick = () => sell(r.id);
    });
};

// --- TRANSACTIONS ---
const toggleBulk = () => {
    bulkMult = bulkMult === 1 ? 10 : 1;
    renderMarket();
};

const buy = (rid) => {
    const unitPrice = state.market.prices[rid];
    const totalCost = unitPrice * bulkMult;

    if (state.gold < totalCost) return notify(`Need ${totalCost}G`);

    state.gold -= totalCost;
    state.market.holdings[rid] += bulkMult;
    
    save();
    renderMarket();
};

const sell = (rid) => {
    if (state.market.holdings[rid] < bulkMult) return notify(`Need ${bulkMult} to sell`);
    
    const unitPrice = state.market.prices[rid];
    const totalVal = unitPrice * bulkMult;
    
    state.market.holdings[rid] -= bulkMult;
    state.gold += totalVal;
    
    save();
    renderMarket();
};
