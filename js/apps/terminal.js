import { state, $, save, notify, factoryReset, importCartridge } from '../core.js';

// --- INITIALIZATION ---
export const init = () => {
    const input = $('term-in');
    if (input) {
        input.value = '';
        input.focus();
    }
    print("DeckOS Kernel v5.1", "sys");
    print("Type 'help' for command list.", "sys");
};

// --- I/O LOGIC ---
export const handleInput = (e) => {
    if (e.key === 'Enter') {
        const input = $('term-in');
        const cmd = input.value.trim();
        
        if (cmd) {
            print(`> ${cmd}`, "user");
            execute(cmd);
        }
        
        input.value = '';
        // Scroll to bottom
        const win = $('term-out');
        win.scrollTop = win.scrollHeight;
    }
};

const print = (text, type = "std") => {
    const out = $('term-out');
    if (!out) return;

    const line = document.createElement('div');
    line.style.marginBottom = "4px";
    
    if (type === "sys") line.style.color = "var(--accent-gold)";
    else if (type === "err") line.style.color = "var(--accent-red)";
    else if (type === "user") line.style.color = "#888";
    else line.style.color = "var(--accent-green)"; // std

    line.innerText = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
};

// --- COMMAND EXECUTION ---
const execute = (rawCmd) => {
    // Handle arguments with spaces
    const parts = rawCmd.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
        case 'help':
            print("AVAILABLE COMMANDS:");
            print("  status    - System overview");
            print("  whoami    - User identity");
            print("  clear     - Clear terminal");
            print("  reboot    - Reload OS");
            print("  wipe      - Factory Reset");
            print("  sudo      - Admin commands");
            break;

        case 'clear':
            $('term-out').innerHTML = '';
            break;

        case 'status':
            print(`[SYSTEM STATUS]`);
            print(`Gold: ${state.gold}`);
            print(`Bank: ${state.bank || 0}`);
            print(`Cards: ${state.col.length}`);
            print(`Pool: ${state.pool.length} templates`);
            print(`Version: ${state.ver}`);
            print(`GM Mode: ${state.gmMode ? "ACTIVE" : "Disabled"}`);
            break;

        case 'whoami':
            const id = state.identity || { name: 'Unknown', avatarSeed: '?' };
            print(`User: ${id.name}`);
            print(`UID: ${id.avatarSeed}`);
            break;

        case 'inject':
            // Cheat code (Still here for quick testing)
            const amt = parseInt(args[0]);
            if (!isNaN(amt)) {
                state.gold += amt;
                save();
                print(`[CHEAT] Injected ${amt}G.`, "sys");
            } else {
                print("Usage: inject <amount>", "err");
            }
            break;

        case 'sudo':
            if (args[0] === 'open_studio') {
                state.gmMode = true;
                save();
                document.body.classList.add('gm-mode');
                print("ACCESS GRANTED.", "sys");
                print("Studio App unlocked on Grid.", "sys");
                notify("GM Mode Active");
            } else {
                print("Access Denied.", "err");
            }
            break;

        case 'load_config':
            // Allow pasting raw JSON string here
            const jsonStr = args.join(' ');
            if (!jsonStr) {
                print("Usage: load_config <json_string>", "err");
                return;
            }
            if (importCartridge(jsonStr)) {
                print("Cartridge Loaded.", "sys");
            } else {
                print("Import Failed. Check format.", "err");
            }
            break;

        case 'reboot':
            print("Rebooting...", "sys");
            setTimeout(() => location.reload(), 1000);
            break;

        case 'wipe':
            print("WARNING: This will delete all data.", "err");
            print("Type 'confirm_wipe' to proceed.", "err");
            break;

        case 'confirm_wipe':
            factoryReset();
            break;

        default:
            print(`Command '${cmd}' not found.`, "err");
    }
};


            break;

        case 'clear':
            $('term-out').innerHTML = '';
            break;

        case 'status':
            print(`[SYSTEM STATUS]`);
            print(`Gold: ${state.gold}`);
            print(`Bank: ${state.bank || 0}`);
            print(`Cards: ${state.col.length}`);
            print(`Pool Size: ${state.pool.length}`);
            print(`Version: ${state.ver}`);
            break;

        case 'whoami':
            const id = state.identity || { name: 'Unknown', avatarSeed: '?' };
            print(`User: ${id.name}`);
            print(`Seed: ${id.avatarSeed}`);
            break;

        case 'inject':
            const amt = parseInt(args[0]);
            if (!isNaN(amt)) {
                state.gold += amt;
                save();
                print(`[CHEAT] Injected ${amt}G. Don't tell anyone.`, "sys");
            } else {
                print("Usage: inject <amount>", "err");
            }
            break;

        case 'reboot':
            print("Rebooting...", "sys");
            setTimeout(() => location.reload(), 1000);
            break;

        case 'wipe':
            print("WARNING: This will delete all data.", "err");
            print("Type 'confirm_wipe' to proceed.", "err");
            break;

        case 'confirm_wipe':
            factoryReset();
            break;

        default:
            print(`Command '${cmd}' not found.`, "err");
    }
};

