import { state, $, save, notify } from '../core.js';

// --- INTERNAL STATE ---
let interestInterval = null;

// --- INITIALIZATION ---
export const init = () => {
    // 1. Lazy Load State
    if (typeof state.bank === 'undefined') {
        state.bank = 0;
    }

    // 2. Render Balance
    updateBankUI();

    // 3. Start Interest Clock (1% every 60s)
    if (interestInterval) clearInterval(interestInterval);
    interestInterval = setInterval(applyInterest, 60000);
};

// --- LOGIC ---
const updateBankUI = () => {
    const el = $('bank-bal');
    if (el) el.innerText = Math.floor(state.bank).toLocaleString();
};

export const deposit = () => {
    const input = $('bank-in');
    const val = parseInt(input.value);

    if (isNaN(val) || val <= 0) return notify("Invalid Amount");
    if (state.gold < val) return notify("Insufficient Gold");

    state.gold -= val;
    state.bank += val;

    input.value = ''; // Clear input
    save();
    updateBankUI();
    notify(`Deposited ${val}G`);
};

export const withdraw = () => {
    const input = $('bank-in');
    const val = parseInt(input.value);

    if (isNaN(val) || val <= 0) return notify("Invalid Amount");
    if (state.bank < val) return notify("Insufficient Funds in Bank");

    state.bank -= val;
    state.gold += val;

    input.value = '';
    save();
    updateBankUI();
    notify(`Withdrew ${val}G`);
};

const applyInterest = () => {
    if (state.bank > 0) {
        // 5% APY is too complex for a game tick, let's do 1% per minute "Game Interest"
        // Cap it at 1000G per tick to prevent infinite scaling abuse
        let interest = Math.floor(state.bank * 0.01);
        if (interest > 1000) interest = 1000;
        
        if (interest > 0) {
            state.bank += interest;
            save();
            updateBankUI();
            notify(`Bank Interest Paid: +${interest}G`);
        }
    }
};

