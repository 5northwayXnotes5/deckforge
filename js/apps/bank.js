import { state, $, save, notify } from '../core.js';

// --- CONFIGURATION ---
const BASE_RATE = 0.01; // Savings: 1% per 10m
const LOAN_RATE = 0.05; // Debt: 5% per 10m
const TICK_MS = 10 * 60 * 1000; 

// --- INITIALIZATION ---
export const init = () => {
    // Lazy Load
    if (typeof state.bank === 'undefined') state.bank = 0;
    if (typeof state.debt === 'undefined') state.debt = 0;
    if (typeof state.lastBankTime === 'undefined') state.lastBankTime = Date.now();

    processOfflineTime();
    updateBankUI();
};

// --- CORE ---
const processOfflineTime = () => {
    const now = Date.now();
    const diff = now - state.lastBankTime;
    const ticksPassed = Math.floor(diff / TICK_MS);
    
    if (ticksPassed > 0) {
        // Savings Interest
        if (state.bank > 0) {
            const newBal = Math.floor(state.bank * Math.pow(1 + BASE_RATE, ticksPassed));
            const gain = newBal - state.bank;
            state.bank = newBal;
            if (gain > 0) notify(`Interest: +${gain}G`);
        }

        // Debt Interest (The Pain)
        if (state.debt > 0) {
            const newDebt = Math.floor(state.debt * Math.pow(1 + LOAN_RATE, ticksPassed));
            const added = newDebt - state.debt;
            state.debt = newDebt;
            if (added > 0) notify(`Debt Interest: -${added}G`);
        }

        state.lastBankTime = now - (diff % TICK_MS);
        save();
    }
};

const updateBankUI = () => {
    // 1. Savings
    const balEl = $('bank-bal');
    if (balEl) balEl.innerText = Math.floor(state.bank).toLocaleString();

    // 2. Debt
    const debtEl = $('bank-debt');
    if (debtEl) debtEl.innerText = Math.floor(state.debt).toLocaleString();

    // 3. Credit Limit (Collateral based)
    // Value = 100G per card (simplified valuation)
    const collateral = (state.col.length * 100); 
    const maxLoan = Math.floor(collateral * 0.5); // 50% LTV
    
    const limitEl = $('bank-limit');
    if (limitEl) {
        limitEl.innerText = `Collateral: ${state.col.length} Cards | Limit: ${maxLoan.toLocaleString()}G`;
    }
};

// --- ACTIONS ---
export const deposit = () => {
    const input = $('bank-in');
    const val = parseInt(input.value);
    if (isNaN(val) || val <= 0) return notify("Invalid Amount");
    if (state.gold < val) return notify("Insufficient Cash");

    state.gold -= val;
    state.bank += val;
    
    finishTransaction(input, `Deposited ${val}G`);
};

export const withdraw = () => {
    const input = $('bank-in');
    const val = parseInt(input.value);
    if (isNaN(val) || val <= 0) return notify("Invalid Amount");
    if (state.bank < val) return notify("Insufficient Savings");

    state.bank -= val;
    state.gold += val;
    
    finishTransaction(input, `Withdrew ${val}G`);
};

export const takeLoan = () => {
    const input = $('bank-in'); // Reuse same input for simplicity
    const val = parseInt(input.value);
    if (isNaN(val) || val <= 0) return notify("Enter Amount");

    // Collateral Check
    const collateral = (state.col.length * 100); 
    const maxLoan = Math.floor(collateral * 0.5); 
    
    if (maxLoan <= 0) return notify("No Collateral (Need Cards)");
    
    if ((state.debt + val) > maxLoan) {
        return notify(`Denied. Over Limit (${maxLoan}G)`);
    }

    state.debt += val;
    state.gold += val;
    
    finishTransaction(input, `Borrowed ${val}G`);
};

export const repayLoan = () => {
    const input = $('bank-in');
    let val = parseInt(input.value);
    if (isNaN(val) || val <= 0) return notify("Enter Amount");

    if (state.debt <= 0) return notify("No Debt to pay!");
    
    // Cap payment at total debt
    if (val > state.debt) val = state.debt;

    if (state.gold < val) return notify("Insufficient Cash");

    state.gold -= val;
    state.debt -= val;
    
    finishTransaction(input, `Repaid ${val}G`);
};

const finishTransaction = (input, msg) => {
    input.value = '';
    save();
    updateBankUI();
    notify(msg);
};
