import { state, $, save, notify, uid, exportCartridge, importCartridge, openAppWindow } from '../core.js';

// --- INTERNAL STATE ---
let studio = {
    activeTab: 'pool',
    poolMode: 'visual', // visual vs raw
    sagaMode: 'visual'
};

// --- INITIALIZATION ---
export const init = () => {
    // 1. Load Data into Editors
    refreshPoolEditor();
    refreshStatList();
    refreshSagaEditor();
    
    // 2. Set Active Tab
    switchTab('pool');
};

// --- TABS ---
export const switchTab = (tabId) => {
    studio.activeTab = tabId;
    
    // Update UI (Simple visibility toggle based on IDs we will create in HTML)
    const tabs = ['pool', 'stats', 'saga', 'cartridge'];
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

// ================= POOL EDITOR =================

export const togglePoolMode = () => {
    studio.poolMode = studio.poolMode === 'visual' ? 'raw' : 'visual';
    const vis = $('studio-pool-visual');
    const raw = $('studio-pool-raw');
    
    if (studio.poolMode === 'visual') {
        vis.style.display = 'block';
        raw.style.display = 'none';
        renderPoolList(); // Sync from State
    } else {
        vis.style.display = 'none';
        raw.style.display = 'block';
        refreshPoolEditor(); // Sync from State to Text
    }
};

const refreshPoolEditor = () => {
    // Updates the Raw Text area from State
    const poolIn = $('studio-pool-in');
    if (poolIn && state.pool) {
        // Convert object array back to string format: [Name]URL
        poolIn.value = state.pool.map(p => `[${p.name}]${p.img}`).join('\n');
    }
    
    // Update count display
    updatePoolCount();
};

const updatePoolCount = () => {
    const count = $('studio-pool-count');
    if(count) count.innerText = `${state.pool.length} Cards`;
};

const renderPoolList = () => {
    const list = $('studio-pool-list');
    list.innerHTML = '';
    
    state.pool.forEach((card, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.padding = '8px';
        row.style.borderBottom = '1px solid #333';
        row.style.gap = '10px';
        
        row.innerHTML = `
            <img src="${card.img}" style="width:30px; height:40px; object-fit:cover; border-radius:4px; background:#222;">
            <div style="flex:1; font-size:13px;">${card.name}</div>
            <div class="btn sm danger" style="padding:4px 8px;">X</div>
        `;
        
        // Delete Handler
        row.querySelector('.btn').onclick = () => {
            state.pool.splice(idx, 1);
            save();
            renderPoolList();
            updatePoolCount();
        };
        
        list.appendChild(row);
    });
};

export const addCard = () => {
    const nameIn = $('pool-add-name');
    const imgIn = $('pool-add-img');
    const name = nameIn.value.trim();
    const img = imgIn.value.trim();
    
    if (!name || !img) return notify("Enter Name & URL");
    
    // Add to top of list
    state.pool.unshift({
        id: uid(),
        name: name,
        img: img
    });
    
    save();
    
    nameIn.value = '';
    imgIn.value = '';
    renderPoolList();
    updatePoolCount();
    notify("Card Added");
};

export const parsePool = () => {
    // RAW IMPORT LOGIC
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
        return notify("No valid data found");
    }

    state.pool = newPool;
    save();
    notify(`Imported ${newPool.length} Cards`);
    updatePoolCount();
    // If user switches back to visual, it will re-render automatically because toggle calls render
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
    refreshPoolEditor(); // Update text
    renderPoolList(); // Update visual
    notify("Demo Data Loaded");
};

// ================= STAT MANAGER =================
// (Unchanged logic, just exported correctly)
const refreshStatList = () => {
    const list = $('studio-stat-list');
    if (!list) return;

    list.innerHTML = state.stats.map(k => `
        <div class="list-row">
            <label>${k}</label>
            <div class="btn danger sm" onclick="app.studioRemStat('${k}')">X</div>
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

// ================= SAGA EDITOR =================

export const toggleSagaMode = () => {
    studio.sagaMode = studio.sagaMode === 'visual' ? 'raw' : 'visual';
    const vis = $('studio-saga-visual');
    const raw = $('studio-saga-raw');
    
    if (studio.sagaMode === 'visual') {
        vis.style.display = 'block';
        raw.style.display = 'none';
        renderSagaList();
    } else {
        vis.style.display = 'none';
        raw.style.display = 'block';
        refreshSagaEditor();
    }
};

const refreshSagaEditor = () => {
    const box = $('studio-saga-in');
    if(box && state.campaign) {
        // Pretty print JSON
        box.value = JSON.stringify(state.campaign, null, 4);
    }
};

export const saveSaga = () => {
    // Save from Raw Text
    const box = $('studio-saga-in');
    const raw = box.value;
    
    try {
        const data = JSON.parse(raw);
        if(!Array.isArray(data)) throw new Error("Root must be array");
        
        state.campaign = data;
        save();
        notify("Campaign Saved");
    } catch(e) {
        notify("Invalid JSON syntax");
    }
};

export const resetSagaDefault = () => {
    // Reset to basic template
    const def = [
        { type: 'story', title: 'The Beginning', text: 'Custom Narrative Start...' },
        { type: 'battle', title: 'First Guard', difficulty: 1 }, 
        { type: 'loot',   title: 'Hidden Stash', reward: 100 },
        { type: 'boss',   title: 'The End', difficulty: 3 }
    ];
    state.campaign = def;
    save();
    notify("Reset to Default Template");
    refreshSagaEditor();
    renderSagaList();
};

// --- VISUAL SAGA BUILDER ---
const renderSagaList = () => {
    const list = $('studio-saga-list');
    list.innerHTML = '';
    
    state.campaign.forEach((node, idx) => {
        const item = document.createElement('div');
        item.style.background = '#222';
        item.style.marginBottom = '8px';
        item.style.borderRadius = '8px';
        item.style.padding = '10px';
        item.style.borderLeft = `4px solid ${getNodeColor(node.type)}`;
        
        // Header (Title + Delete)
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="font-weight:bold; font-size:13px;">${idx+1}. ${node.type.toUpperCase()}</span>
                <span class="btn sm danger" style="padding:2px 6px; font-size:10px;">X</span>
            </div>
        `;
        
        // Delete Handler
        item.querySelector('.btn').onclick = () => {
            state.campaign.splice(idx, 1);
            save();
            renderSagaList();
        };
        
        // Input Fields based on Type
        // Title Input
        const titleRow = createInputRow("Title", node.title, (val) => { node.title = val; save(); });
        item.appendChild(titleRow);
        
        if (node.type === 'story') {
            const textRow = createInputRow("Text", node.text, (val) => { node.text = val; save(); }, true); // true = textarea
            item.appendChild(textRow);
        }
        else if (node.type === 'battle' || node.type === 'boss') {
            // Difficulty Select
            const diffRow = document.createElement('div');
            diffRow.style.display = 'flex';
            diffRow.style.fontSize = '12px';
            diffRow.innerHTML = `<label style="width:60px; color:#888;">Diff</label>`;
            
            const sel = document.createElement('select');
            sel.style.background = '#111';
            sel.style.border = '1px solid #444';
            sel.innerHTML = `
                <option value="1" ${node.difficulty===1?'selected':''}>Easy</option>
                <option value="2" ${node.difficulty===2?'selected':''}>Med</option>
                <option value="3" ${node.difficulty===3?'selected':''}>Hard</option>
            `;
            sel.onchange = () => { node.difficulty = parseInt(sel.value); save(); };
            diffRow.appendChild(sel);
            item.appendChild(diffRow);
        }
        else if (node.type === 'loot') {
            const rewRow = createInputRow("Gold", node.reward, (val) => { node.reward = parseInt(val); save(); });
            item.appendChild(rewRow);
        }
        
        list.appendChild(item);
    });
};

const createInputRow = (label, value, onChange, isArea=false) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.fontSize = '12px';
    row.style.marginTop = '4px';
    
    const lbl = document.createElement('label');
    lbl.innerText = label;
    lbl.style.width = '60px';
    lbl.style.color = '#888';
    
    let input;
    if(isArea) {
        input = document.createElement('textarea');
        input.style.height = '60px';
    } else {
        input = document.createElement('input');
    }
    
    input.value = value || '';
    input.style.flex = '1';
    input.style.background = 'transparent';
    input.style.border = '1px solid #444';
    input.style.padding = '4px';
    input.style.color = 'white';
    
    input.onchange = () => onChange(input.value);
    
    row.appendChild(lbl);
    row.appendChild(input);
    return row;
};

const getNodeColor = (type) => {
    if(type==='story') return '#0A84FF';
    if(type==='battle') return '#FF453A';
    if(type==='loot') return '#FFD60A';
    if(type==='boss') return '#BF5AF2';
    return '#888';
};

export const addNode = (type) => {
    let node = { type, title: 'New Node' };
    if(type==='story') node.text = 'Write story here...';
    if(type==='battle' || type==='boss') node.difficulty = 1;
    if(type==='loot') node.reward = 50;
    
    state.campaign.push(node);
    save();
    renderSagaList();
};

// ================= CARTRIDGE SYSTEM =================
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
        refreshSagaEditor();
        renderPoolList(); // Update visuals too
        renderSagaList();
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
    notify("System Locked.");
};
