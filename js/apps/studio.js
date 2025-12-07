import { state, $, save, notify, uid, exportCartridge, importCartridge, openAppWindow } from '../core.js';

// --- INTERNAL STATE ---
let studio = {
    activeTab: 'pool' // pool, stats, cartridge
};

// --- INITIALIZATION ---
export const init = () => {
    // 1. Load Data into Editors
    refreshPoolEditor();
    refreshStatList();
    
    // 2. Set Active Tab
    switchTab('pool');
};

// --- TABS ---
export const switchTab = (tabId) => {
    studio.activeTab = tabId;
    
    // Update UI (Simple visibility toggle based on IDs we will create in HTML)
    const tabs = ['pool', 'stats', 'cartridge'];
    tabs.forEach(t => {
        const el = $(`studio-tab-${t}`);
        const btn = $(`btn-tab-${t}`);
        if (el && btn) {
            if (t === tabId) {
                el.style.display = 'block';
                btn.classList.add('filled');
            } else {
                el.style.display = 'none';
                btn.classList.remove('filled');
            }
        }
    });
};

// --- POOL EDITOR (Legacy Support) ---
const refreshPoolEditor = () => {
    const poolIn = $('studio-pool-in');
    if (poolIn && state.pool) {
        // Convert object array back to string format: [Name]URL
        poolIn.value = state.pool.map(p => `[${p.name}]${p.img}`).join('\n');
    }
    
    // Update count display
    const count = $('studio-pool-count');
    if(count) count.innerText = `${state.pool.length} Cards Loaded`;
};

export const parsePool = () => {
    const text = $('studio-pool-in').value;
    const lines = text.split('\n');
    const newPool = [];

    // Regex to match [Name]URL
    const regex = /\[(.*?)\](.*)/;

    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            newPool.push({
                id: uid(),
                name: match[1].trim(),
                img: match[2].trim()
            });
        }
    });

    if (newPool.length === 0) {
        return notify("No valid data. Format: [Name]URL");
    }

    state.pool = newPool;
    save();
    notify(`Pool Updated (${newPool.length} Cards)`);
    refreshPoolEditor();
};

export const loadDemo = () => {
    const demoPool = [
        {id:uid(), name:'Pikachu', img:'https://img.icons8.com/color/96/pikachu-pokemon.png'},
        {id:uid(), name:'Charmander', img:'https://img.icons8.com/color/96/charmander.png'},
        {id:uid(), name:'Squirtle', img:'https://img.icons8.com/color/96/squirtle.png'},
        {id:uid(), name:'Bulbasaur', img:'https://img.icons8.com/color/96/bulbasaur.png'},
        {id:uid(), name:'Gengar', img:'https://img.icons8.com/color/96/gengar.png'},
        {id:uid(), name:'Dragon', img:'https://img.icons8.com/color/96/dragon.png'},
        {id:uid(), name:'Knight', img:'https://img.icons8.com/color/96/knight.png'},
        {id:uid(), name:'Wizard', img:'https://img.icons8.com/color/96/wizard.png'}
    ];
    state.pool = demoPool;
    save();
    refreshPoolEditor();
    notify("Demo Data Loaded");
};

// --- STAT MANAGER ---
const refreshStatList = () => {
    const list = $('studio-stat-list');
    if (!list) return;

    list.innerHTML = state.stats.map(k => `
        <div class="list-row">
            <label>${k}</label>
            <div class="btn danger sm" onclick="app.remStat('${k}')">X</div>
        </div>
    `).join('');
};

export const addStat = () => {
    const input = $('studio-stat-in');
    const val = input.value.trim().toUpperCase(); 
    
    if (!val) return notify("Enter Name");
    if (state.stats.includes(val)) return notify("Exists");
    if (val.length > 8) return notify("Max 8 Chars");

    state.stats.push(val);
    input.value = '';
    save();
    refreshStatList();
    notify(`Stat "${val}" Added`);
};

export const remStat = (key) => {
    if (state.stats.length <= 1) return notify("Keep at least 1");
    state.stats = state.stats.filter(x => x !== key);
    save();
    refreshStatList();
    notify("Stat Removed");
};

// --- CARTRIDGE SYSTEM ---
export const exportConfig = () => {
    const json = exportCartridge();
    const out = $('studio-cart-out');
    if (out) {
        out.value = json;
        // Select all text for easy copy
        out.select();
        document.execCommand('copy');
        notify("Config Copied to Clipboard");
    }
};

export const importConfig = () => {
    const input = $('studio-cart-out'); // We use the same box for I/O
    const json = input.value.trim();
    
    if (!json) return notify("Paste Config JSON first");
    
    const success = importCartridge(json);
    if (success) {
        refreshPoolEditor();
        refreshStatList();
        input.value = '';
    }
};

// --- DEPLOYMENT ---
export const lockStudio = () => {
    // This hides the Studio app and "Deploys" the game
    state.gmMode = false;
    save();
    
    // Remove Visuals
    document.body.classList.remove('gm-mode');
    
    // Close Window
    openAppWindow('settings'); // Redirect to safe place
    notify("System Locked. (Type 'sudo open_studio' in Terminal to return)");
};

