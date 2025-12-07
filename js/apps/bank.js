import { state, $, save, notify } from '../core.js';

// --- CONFIGURATION ---
const BASE_RATE = 0.01; // 1% per tick (10 minutes)
const LOAN_RATE = 0.05; // 5% per tick
const TICK_MS = 10 * 60 * 1000; // 10 Minutes per "Bank Tick"

// --- INITIALIZATION ---
export const init = () => {
    // 1. Lazy Load State
    if (typeof state.bank === 'undefined') state.bank = 0;
    if (typeof state.debt === 'undefined') state.debt = 0;
    if (typeof state.lastBankTime === 'undefined') state.lastBankTime = Date.now();

    // 2. Process Offline Interest
    processOfflineTime();

    // 3. Render
    updateBankUI();
};

// --- CORE LOGIC ---
const processOfflineTime = () => {
    const now = Date.now();
    const diff = now - state.lastBankTime;
    
    // Calculate how many full "Ticks" passed
    const ticksPassed = Math.floor(diff / TICK_MS);
    
    if (ticksPassed > 0) {
        // Compound Interest Formula: A = P(1 + r)^t
        // Savings
        if (state.bank > 0) {
            const newBalance = Math.floor(state.bank * Math.pow(1 + BASE_RATE, ticksPassed));
            const gain = newBalance - state.bank;
            state.bank = newBalance;
            if (gain > 0) notify(`Bank: +${gain}G Interest (Away for ${ticksPassed} cycles)`);
        }

        // Debt (Compounding is scary)
        if (state.debt > 0) {
            const newDebt = Math.floor(state.debt * Math.pow(1 + LOAN_RATE, ticksPassed));
            const addedDebt = newDebt - state.debt;
            state.debt = newDebt;
            if (addedDebt > 0) notify(`Loan: Interest grew by ${addedDebt}G`);
        }

        // Update Timestamp to now (minus remainder to keep cycle steady)
        state.lastBankTime = now - (diff % TICK_MS);
        save();
    }
};

const updateBankUI = () => {
    // Savings UI
    const balEl = $('bank-bal');
    if (balEl) balEl.innerText = Math.floor(state.bank).toLocaleString();
    
    // Rate UI
    const ratePill = document.querySelector('.rate-pill');
    if (ratePill) ratePill.innerText = `Savings: 1% / 10m`;

    // Debt UI
    let debtDisplay = $('bank-debt-display');
    if (!debtDisplay) {
        const container = document.querySelector('.bank-vault');
        if (container) {
            debtDisplay = document.createElement('div');
            debtDisplay.id = 'bank-debt-display';
            debtDisplay.style.color = '#FF453A';
            debtDisplay.style.marginTop = '10px';
            debtDisplay.style.fontSize = '14px';
            container.appendChild(debtDisplay);
        }
    }
    
    if (debtDisplay) {
        if (state.debt > 0) {
            debtDisplay.innerText = `Outstanding Loan: ${state.debt.toLocaleString()}G (5% Interest)`;
            debtDisplay.style.display = 'block';
        } else {
            debtDisplay.style.display = 'none';
        }
    }
};

// --- ACTIONS ---
export const deposit = () => {
    const input = $('bank-in');
    const val = parseInt(input.value);

    if (isNaN(val) || val <= 0) return notify("Invalid Amount");
    if (state.gold < val) return notify("Insufficient Gold");

    // Auto-pay debt logic (Optional, but usually banks take their money first)
    // For now, let's keep it manual to let players hang themselves with debt.
    
    state.gold -= val;
    state.bank += val;

    input.value = ''; 
    save();
    updateBankUI();
    notify(`Deposited ${val}G`);
};

export const withdraw = () => {
    const input = $('bank-in');
    const val = parseInt(input.value);

    if (isNaN(val) || val <= 0) return notify("Invalid Amount");
    
    if (state.bank >= val) {
        state.bank -= val;
        state.gold += val;
        input.value = '';
        save();
        updateBankUI();
        notify(`Withdrew ${val}G`);
    } else {
        notify("Insufficient Funds in Savings");
    }
};

export const takeLoan = () => {
    const input = $('bank-in');
    const val = parseInt(input.value);

    if (isNaN(val) || val <= 0) return notify("Enter Loan Amount");
    
    // Calculate Max Loan (Equity based)
    // Equity = Cash + Bank + Collection Value (Approx 100G per card)
    const equity = state.gold + state.bank + (state.col.length * 100);
    const maxLoan = Math.floor(equity * 0.5); // Can borrow up to 50% of net worth
    
    const currentDebt = state.debt || 0;
    
    if ((currentDebt + val) > maxLoan) {
        return notify(`Loan Denied. Max Debt: ${maxLoan}G`);
    }

    state.debt = currentDebt + val;
    state.gold += val;
    
    input.value = '';
    save();
    updateBankUI();
    notify(`Loan Approved: +${val}G`);
};
