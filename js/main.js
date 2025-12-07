import * as Core from './core.js';

// --- APP MODULES ---
import * as Duel from './apps/duel.js';
import * as Shop from './apps/shop.js';
import * as Lab from './apps/lab.js';
import * as Casino from './apps/casino.js';
import * as Royale from './apps/royale.js';
import * as Memory from './apps/memory.js';
import * as Pressure from './apps/pressure.js';
import * as Collection from './apps/collection.js';
import * as Settings from './apps/settings.js';

// --- NEW APP MODULES ---
import * as Bank from './apps/bank.js';
import * as Saga from './apps/saga.js';
import * as Oracle from './apps/oracle.js';
import * as Market from './apps/market.js';
import * as Museum from './apps/museum.js';
import * as Terminal from './apps/terminal.js';
import * as Identity from './apps/identity.js';

// --- GLOBAL CONTROLLER ---
const app = {
    // 1. Navigation
    open: (id) => {
        Core.openAppWindow(id);
        
        // Init Logic per App
        switch(id) {
            case 'duel':       Duel.init(); break;
            case 'collection': Collection.render(); break;
            case 'lab':        Lab.init(); break;
            case 'royale':     Royale.init(); break;
            case 'memory':     Memory.init(); break;
            case 'settings':   Settings.init(); break;
            case 'casino':     Casino.init(); break;
            case 'shop':       /* Shop doesn't need init, it's static */ break;
            case 'pressure':   Pressure.init(); break;
            
            // New Apps
            case 'bank':       Bank.init(); break;
            case 'saga':       Saga.init(); break;
            case 'oracle':     Oracle.init(); break;
            case 'market':     Market.init(); break;
            case 'museum':     Museum.init(); break;
            case 'terminal':   Terminal.init(); break;
            case 'identity':   Identity.init(); break;
        }
    },
    
    home: Core.goHome,
    
    // 2. Bridge Functions (HTML -> JS)
    
    // SHOP
    buyPack: (id) => Shop.buyPack(id),
    closePack: () => Shop.closePack(),
    
    // DUEL
    filterDuel: () => Duel.filter(),
    resolveDuel: () => Duel.resolve(),
    
    // CASINO
    openCasinoGame: (g) => Casino.openGame(g),
    backCasino: () => Casino.back(),
    playBJ: () => Casino.playBJ(),
    hitBJ: () => Casino.hitBJ(),
    standBJ: () => Casino.standBJ(),
    spinRoulette: (c) => Casino.spinRoulette(c),
    spinSlots: () => Casino.spinSlots(),
    rollDice: (t) => Casino.rollDice(t),
    
    // PRESSURE
    startPressure: () => Pressure.start(),
    pressureTap: () => Pressure.tap(),
    
    // COLLECTION
    showSheet: (c) => Collection.showSheet(c),
    closeSheet: () => Collection.closeSheet(),
    delCard: () => Collection.delCard(),
    togDeck: () => Collection.togDeck(),
    
    // LAB
    saveDeck: () => Lab.saveDeck(),
    selDeck: (v) => Lab.selDeck(v),
    fuse: () => Lab.fuse(),
    updateReactor: () => Lab.updateReactor(),
    
    // ROYALE
    runRoyale: () => Royale.run(),
    
    // SETTINGS
    setWall: () => Settings.setWall(),
    addStat: () => Settings.addStat(),
    remStat: (k) => Settings.remStat(k),
    parsePool: () => Settings.parsePool(),
    loadDemo: () => Settings.loadDemo(), // Using Settings wrapper if present, else Core
    askWipe: () => { Core.openAppWindow('confirm'); },
    wipe: () => Core.factoryReset(),
    closeConfirm: () => { document.getElementById('confirm-modal').classList.remove('active'); },
    
    // MEMORY
    initMem: () => Memory.init(),

    // --- NEW APP BRIDGES ---
    
    // BANK
    bankDeposit: () => Bank.deposit(),
    bankWithdraw: () => Bank.withdraw(),

    // ORACLE
    oracleConsult: () => Oracle.consult(),

    // TERMINAL
    termInput: (e) => Terminal.handleInput(e),

    // SAGA
    resetSaga: () => Saga.resetSaga(),

    // IDENTITY
    idChangeAvatar: () => Identity.idChangeAvatar(),
    idSave: () => Identity.idSave()
};

// Expose to Window
window.app = app;

// Boot OS
window.onload = Core.load;


