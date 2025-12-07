import { state, $, save, notify, rand } from '../core.js';

// --- INTERNAL STATE ---
let marketInterval = null;

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
    // But we need to save prices eventually. Let's not spam save() every 5s.
    // We update UI only.
    renderMarket();
};

// --- RENDERING ---
const renderMarket = () => {
    const list = $('market-list');
    if (!list) return;

    list.innerHTML = '';

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
                <div class="btn sm filled" id="btn-buy-${r.id}">Buy</div>
                <div class="btn sm" id="btn-sell-${r.id}">Sell</div>
            </div>
        `;

        list.appendChild(row);

        // Attach Listeners
        document.getElementById(`btn-buy-${r.id}`).onclick = () => buy(r.id);
        document.getElementById(`btn-sell-${r.id}`).onclick = () => sell(r.id);
    });
};

// --- TRANSACTIONS ---
const buy = (rid) => {
    const price = state.market.prices[rid];
    if (state.gold < price) return notify("Insufficient Gold");

    state.gold -= price;
    state.market.holdings[rid]++;
    
    save();
    renderMarket();
    // No notify to allow spam clicking
};

const sell = (rid) => {
    if (state.market.holdings[rid] <= 0) return notify("None to sell");
    
    const price = state.market.prices[rid];
    
    state.market.holdings[rid]--;
    state.gold += price;
    
    save();
    renderMarket();
};

