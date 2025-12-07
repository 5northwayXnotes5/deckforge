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
    
    // Loan UI (We need to inject this HTML since the original didn't have it)
    // I'll assume we can hijack the pill or add a new section via JS if needed,
    // but ideally we should update HTML. For now, let's toggle the rate pill.
    const ratePill = document.querySelector('.rate-pill');
    if (ratePill) ratePill.innerText = `Savings: 1% / 10m`;

    // Show Debt if exists
    // We will append a Debt display dynamically if it doesn't exist
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
    if (state.gold < val) return notify("Insufficient Cash");

    // Pay off debt first logic? No, let them hoard if they want (bad idea for them)
    
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
    
    // Check if trying to withdraw from Savings
    if (state.bank >= val) {
        state.bank -= val;
        state.gold += val;
        input.value = '';
        save();
        updateBankUI();
        notify(`Withdrew ${val}G`);
        return;
    } 
    
    // If not enough in savings, maybe they want a LOAN?
    // Loan Logic: Max Loan = 50% of Collection Value (Estimated 100G per card average)
    const collateral = state.col.length * 100; 
    const maxLoan = collateral - state.debt;

    if (val <= maxLoan) {
        // Take a Loan
        // Prompt? We can't really prompt easily without a custom modal.
        // Let's just notify them "Taking Loan" implies they hit withdraw with 0 bank.
        // Actually, that's dangerous UX.
        // Let's stick to strict: Withdraw only takes money you have.
        // To take a loan, you enter a NEGATIVE number? Or we add a button.
        // Limitation: We only have 2 buttons in HTML.
        return notify("Insufficient Funds in Bank");
    }
    
    return notify("Insufficient Funds");
};
