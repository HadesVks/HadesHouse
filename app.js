/**
 * HADES HOUSE OFFICIAL BRAND EDITION 🇩🇴 — ULTRA RESILIENT BROWSER ENGINE
 * Resiliencia total para GitHub Pages: Fallbacks defensivos contra errores de CDN/Swal/Confetti
 */

// MANEJADOR GLOBAL SILENCIOSO PARA EVITAR QUE SE DETENGAN LOS BOTONES
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.warn('HadesHouse Defensive Safeguard:', msg);
    return true; // Previene que el navegador detenga la ejecución de los botones
};

// HELPER ALERT DEFENSIVO (Si Swal falla por CDN, usa alerta nativa)
function safeAlert(type, title, text, callback) {
    if (typeof Swal !== 'undefined' && typeof Swal.fire === 'function') {
        Swal.fire({
            icon: type,
            title: title,
            text: text,
            confirmButtonColor: '#002D62'
        }).then(() => {
            if (typeof callback === 'function') callback();
        });
    } else {
        alert(`${title}\n\n${text}`);
        if (typeof callback === 'function') callback();
    }
}

// HELPER CONFETTI DEFENSIVO
function safeConfetti(opts) {
    if (typeof confetti === 'function') {
        try { confetti(opts); } catch (e) {}
    }
}

// STATE MANAGEMENT
const STATE = {
    currentUser: null,
    usersDB: {},
    betSlip: [],
    betMode: 'single',
    myBets: [],
    activeFilter: 'live',
    activeCategory: 'all',
    activePayTab: 'deposit',
    activePayMethod: 'card',
    liveComments: [
        { author: 'Carlos Dominicano 🇩🇴', text: '¡Licey va a ganar este partido sí o sí!', time: '21:05 PM' },
        { author: 'Pedro Apuestas ⚾', text: 'El pitcheo de las Águilas está fuerte hoy.', time: '21:08 PM' },
        { author: 'Banquero Master 💼', text: 'Recuerden que el Cash Out está habilitado hasta el 9no Inning.', time: '21:10 PM' }
    ],
    matches: [
        {
            id: 'm1',
            league: 'LIDOM (Pelota Invernal RD 🇩🇴)',
            category: 'lidom',
            teamHome: 'Tigres del Licey 💙',
            teamAway: 'Águilas Cibaeñas 💛',
            scoreHome: 4,
            scoreAway: 3,
            minute: 8,
            status: 'live',
            odds: { home: 1.80, draw: 12.0, away: 2.10 }
        },
        {
            id: 'm2',
            league: 'LIDOM (Pelota Invernal RD 🇩🇴)',
            category: 'lidom',
            teamHome: 'Leones del Escogido ❤️',
            teamAway: 'Gigantes del Cibao 🤎',
            scoreHome: 2,
            scoreAway: 1,
            minute: 6,
            status: 'live',
            odds: { home: 1.95, draw: 14.0, away: 1.85 }
        },
        {
            id: 'm3',
            league: 'Grandes Ligas (MLB Oficial)',
            category: 'mlb',
            teamHome: 'NY Yankees (Juan Soto 🇩🇴)',
            teamAway: 'Boston Red Sox (Devers 🇩🇴)',
            scoreHome: 5,
            scoreAway: 4,
            minute: 7,
            status: 'live',
            odds: { home: 1.65, draw: 15.0, away: 2.30 }
        },
        {
            id: 'm4',
            league: 'UEFA Champions League',
            category: 'football',
            teamHome: 'Real Madrid FC',
            teamAway: 'FC Barcelona',
            scoreHome: 2,
            scoreAway: 1,
            minute: 78,
            status: 'live',
            odds: { home: 1.85, draw: 3.40, away: 4.10 }
        },
        {
            id: 'm5',
            league: 'NBA League',
            category: 'basketball',
            teamHome: 'LA Lakers',
            teamAway: 'Golden State Warriors',
            scoreHome: 104,
            scoreAway: 101,
            minute: 42,
            status: 'live',
            odds: { home: 1.85, draw: 15.0, away: 1.95 }
        }
    ]
};

// INITIALIZATION SAFELY
function startApp() {
    loadDatabase();
    checkSession();
    initEventListeners();
    renderComments();
    renderMatches();
    updateUI();

    setInterval(simulateLiveOddsAndClock, 4000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// DATABASE PERSISTENCE
function loadDatabase() {
    try {
        const rawDB = localStorage.getItem('hades_users_db');
        if (rawDB) STATE.usersDB = JSON.parse(rawDB);
    } catch (e) { STATE.usersDB = {}; }

    // Admin por defecto
    if (!STATE.usersDB['admin@hadeshouse.com']) {
        STATE.usersDB['admin@hadeshouse.com'] = {
            id: 'USR-ADMIN-01',
            name: 'Administrador Hades House',
            email: 'admin@hadeshouse.com',
            password: 'admin123456',
            level: 'VIP Administrador',
            balance: 500000.00
        };
    }
}

function saveDatabase() {
    try {
        localStorage.setItem('hades_users_db', JSON.stringify(STATE.usersDB));
        localStorage.setItem('hades_live_comments', JSON.stringify(STATE.liveComments));

        if (STATE.currentUser) {
            localStorage.setItem('hades_active_session', JSON.stringify(STATE.currentUser.email));
        } else {
            localStorage.removeItem('hades_active_session');
        }
    } catch (e) {}
}

function checkSession() {
    try {
        const activeEmail = localStorage.getItem('hades_active_session');
        if (activeEmail) {
            const cleanEmail = JSON.parse(activeEmail);
            if (STATE.usersDB[cleanEmail]) {
                STATE.currentUser = STATE.usersDB[cleanEmail];
                loadUserBets();
            }
        }
    } catch (e) {}
}

function loadUserBets() {
    if (!STATE.currentUser) return;
    try {
        const rawBets = localStorage.getItem(`hades_bets_${STATE.currentUser.id}`);
        if (rawBets) STATE.myBets = JSON.parse(rawBets);
    } catch (e) { STATE.myBets = []; }
}

function saveUserBets() {
    if (!STATE.currentUser) return;
    try {
        localStorage.setItem(`hades_bets_${STATE.currentUser.id}`, JSON.stringify(STATE.myBets));
    } catch (e) {}
}

// RENDER COMMENTS
function renderComments() {
    const list = document.getElementById('comments-list');
    if (!list) return;

    list.innerHTML = '';
    STATE.liveComments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-bubble';
        div.innerHTML = `<span class="comment-author">${c.author}:</span> <span class="comment-text">${c.text}</span> <span class="comment-time">${c.time}</span>`;
        list.appendChild(div);
    });
    list.scrollTop = list.scrollHeight;
}

function sendComment() {
    const input = document.getElementById('input-comment');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const author = STATE.currentUser ? STATE.currentUser.name : 'Usuario Invitado';
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

    STATE.liveComments.push({ author, text, time });
    input.value = '';
    saveDatabase();
    renderComments();
}

// DELEGACIÓN UNIVERSAL DE EVENTOS EN DOCUMENT (GARANTIZA 100% DE BOTONES OPERATIVOS)
function initEventListeners() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, a, input, .cat-btn, .league-link, .tab-btn, .btn-roulette, .odds-btn');
        if (!target) return;

        // Cuentas / Auth Modals
        if (target.id === 'btn-open-login') openAuthModal('login');
        if (target.id === 'btn-open-register') openAuthModal('register');
        if (target.id === 'btn-close-auth') closeAuthModal();
        if (target.id === 'tab-auth-login') switchAuthTab('login');
        if (target.id === 'tab-auth-register') switchAuthTab('register');

        // Toggle Profile Dropdown
        if (target.id === 'btn-toggle-profile' || target.closest('#btn-toggle-profile')) {
            const drop = document.getElementById('profile-dropdown');
            if (drop) drop.classList.toggle('hidden');
        }
        if (target.id === 'btn-logout') handleLogout();

        // Billetera & Modales
        if (target.id === 'btn-open-deposit' || target.id === 'btn-quick-deposit-trigger') {
            if (!STATE.currentUser) {
                openAuthModal('login');
                return;
            }
            const modal = document.getElementById('modal-deposit');
            if (modal) modal.classList.remove('hidden');
        }
        if (target.id === 'btn-close-deposit') {
            const modal = document.getElementById('modal-deposit');
            if (modal) modal.classList.add('hidden');
        }

        // Tabs de Depósito/Retiro
        if (target.id === 'tab-pay-deposit') switchPaymentTab('deposit');
        if (target.id === 'tab-pay-withdraw') switchPaymentTab('withdraw');

        // Métodos de Pago
        if (target.classList.contains('method-btn')) {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            target.classList.add('active');
            STATE.activePayMethod = target.dataset.method;

            const cardForm = document.getElementById('form-deposit-card');
            const bankForm = document.getElementById('form-deposit-bank');
            const cryptoForm = document.getElementById('form-deposit-crypto');

            if (cardForm) cardForm.classList.toggle('hidden', STATE.activePayMethod !== 'card');
            if (bankForm) bankForm.classList.toggle('hidden', STATE.activePayMethod !== 'bank');
            if (cryptoForm) cryptoForm.classList.toggle('hidden', STATE.activePayMethod !== 'crypto');
        }

        // Bono de Bienvenida
        if (target.id === 'btn-claim-welcome-bonus') {
            if (!STATE.currentUser) {
                openAuthModal('register');
                return;
            }
            STATE.currentUser.balance += 10000.00;
            STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
            saveDatabase();
            updateUI();
            safeConfetti({ particleCount: 100, spread: 70 });
            safeAlert('success', '¡Bono Activado!', 'Se han acreditado RD$ 10,000.00 a su billetera.');
        }

        // Acciones de Boleto
        if (target.id === 'btn-mode-single') setBetMode('single');
        if (target.id === 'btn-mode-parlay') setBetMode('parlay');
        if (target.id === 'btn-place-bet') placeBet();
        if (target.id === 'btn-play-pale') playPale();
        if (target.id === 'btn-spin-gallo') playGallos();

        // Stake Rápido
        if (target.classList.contains('btn-qs')) {
            const input = document.getElementById('slip-stake-input');
            if (input) {
                if (target.id === 'btn-qs-max') {
                    input.value = Math.floor(STATE.currentUser ? STATE.currentUser.balance : 0);
                } else {
                    input.value = target.dataset.amount;
                }
                updateSlipCalculator();
            }
        }

        // Categorías & Filtros
        if (target.classList.contains('cat-btn')) {
            const cat = target.dataset.category;
            if (cat) {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                STATE.activeCategory = cat;
                renderMatches();
            }
        }

        if (target.classList.contains('tab-btn')) {
            const filter = target.dataset.filter;
            if (filter) {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                STATE.activeFilter = filter;
                renderMatches();
            }
        }

        // Selección Gallos
        if (target.classList.contains('btn-roulette')) {
            document.querySelectorAll('.btn-roulette').forEach(b => b.classList.remove('selected'));
            target.classList.add('selected');
        }

        // Comentarios
        if (target.id === 'btn-send-comment') sendComment();
    });

    document.getElementById('form-login')?.addEventListener('submit', handleLoginSubmit);
    document.getElementById('form-register')?.addEventListener('submit', handleRegisterSubmit);
    document.getElementById('form-deposit-card')?.addEventListener('submit', handleDepositCardSubmit);
    document.getElementById('form-deposit-bank')?.addEventListener('submit', handleDepositBankSubmit);
    document.getElementById('form-deposit-crypto')?.addEventListener('submit', handleDepositCryptoSubmit);
    document.getElementById('form-withdraw')?.addEventListener('submit', handleWithdrawSubmit);
}

// PAYMENT TABS LOGIC
function switchPaymentTab(tab) {
    STATE.activePayTab = tab;
    const isDeposit = tab === 'deposit';
    document.getElementById('tab-pay-deposit')?.classList.toggle('active', isDeposit);
    document.getElementById('tab-pay-withdraw')?.classList.toggle('active', !isDeposit);

    document.getElementById('section-pay-deposit')?.classList.toggle('hidden', !isDeposit);
    document.getElementById('section-pay-withdraw')?.classList.toggle('hidden', isDeposit);
}

function handleDepositCardSubmit(e) {
    e.preventDefault();
    if (!STATE.currentUser) return;

    const amount = parseFloat(document.getElementById('dep-card-amount').value) || 0;
    if (amount < 100) {
        safeAlert('warning', 'Monto Mínimo', 'El depósito mínimo por tarjeta es RD$ 100.00');
        return;
    }

    STATE.currentUser.balance += amount;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    updateUI();
    document.getElementById('modal-deposit')?.classList.add('hidden');
    safeConfetti({ particleCount: 70, spread: 60 });
    safeAlert('success', '¡Depósito Aprobado!', `Se acreditaron RD$ ${amount.toFixed(2)} a su billetera.`);
}

function handleDepositBankSubmit(e) {
    e.preventDefault();
    if (!STATE.currentUser) return;

    const amount = parseFloat(document.getElementById('dep-bank-amount').value) || 0;
    const ref = document.getElementById('dep-bank-ref').value.trim();

    if (!ref) {
        safeAlert('warning', 'Referencia Requerida');
        return;
    }

    STATE.currentUser.balance += amount;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    updateUI();
    document.getElementById('modal-deposit')?.classList.add('hidden');
    safeAlert('success', 'Transferencia Validada', `Acreditados RD$ ${amount.toFixed(2)} mediante comprobante ${ref}`);
}

function handleDepositCryptoSubmit(e) {
    e.preventDefault();
    if (!STATE.currentUser) return;

    const txid = document.getElementById('dep-crypto-txid').value.trim();
    if (txid.length < 10) {
        safeAlert('error', 'TXID Inválido');
        return;
    }

    const creditedRD = 6000.0;
    STATE.currentUser.balance += creditedRD;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    updateUI();
    document.getElementById('modal-deposit')?.classList.add('hidden');
    safeConfetti({ particleCount: 100, spread: 80 });
    safeAlert('success', '¡Confirmado!', `Se acreditaron RD$ ${creditedRD.toFixed(2)} por depósito USDT.`);
}

function handleWithdrawSubmit(e) {
    e.preventDefault();
    if (!STATE.currentUser) return;

    const amount = parseFloat(document.getElementById('with-amount').value) || 0;
    const accNum = document.getElementById('with-account-number').value.trim();

    if (amount <= 0 || amount > STATE.currentUser.balance) {
        safeAlert('error', 'Saldo Insuficiente');
        return;
    }

    STATE.currentUser.balance -= amount;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    updateUI();
    document.getElementById('modal-deposit')?.classList.add('hidden');
    safeAlert('success', 'Retiro Procesado', `Se envió la transferencia de RD$ ${amount.toFixed(2)} a la cuenta ${accNum}`);
}

// AUTH MODAL LOGIC
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.remove('hidden');
    switchAuthTab(tab);
}

function closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.add('hidden');
}

function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tab-auth-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-auth-register')?.classList.toggle('active', !isLogin);
    document.getElementById('form-login')?.classList.toggle('hidden', !isLogin);
    document.getElementById('form-register')?.classList.toggle('hidden', isLogin);

    const titleEl = document.getElementById('auth-modal-title');
    if (titleEl) {
        titleEl.innerHTML = isLogin ? `<i class="fa-solid fa-user-shield"></i> Iniciar Sesión` : `<i class="fa-solid fa-user-plus"></i> Abrir Cuenta`;
    }
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!STATE.usersDB[email]) {
        safeAlert('error', 'Cuenta no encontrada');
        return;
    }

    const user = STATE.usersDB[email];
    if (user.password !== password) {
        safeAlert('error', 'Contraseña Incorrecta');
        return;
    }

    STATE.currentUser = user;
    saveDatabase();
    loadUserBets();
    updateUI();
    closeAuthModal();
    safeAlert('success', `Bienvenido, ${user.name}`, `Saldo disponible: RD$ ${user.balance.toFixed(2)}`);
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    if (STATE.usersDB[email]) {
        safeAlert('warning', 'Correo ya registrado');
        return;
    }

    const newUser = {
        id: 'USR-' + Math.floor(Math.random() * 900000 + 100000),
        name,
        email,
        password,
        level: 'Miembro VIP',
        balance: 25000.00
    };

    STATE.usersDB[email] = newUser;
    STATE.currentUser = newUser;

    saveDatabase();
    loadUserBets();
    updateUI();
    closeAuthModal();
    safeConfetti({ particleCount: 100, spread: 70 });
    safeAlert('success', '¡Registro Exitoso!', 'Acreditados RD$ 25,000.00 de bono a su cuenta.');
}

function handleLogout() {
    STATE.currentUser = null;
    STATE.myBets = [];
    localStorage.removeItem('hades_active_session');
    document.getElementById('profile-dropdown')?.classList.add('hidden');
    updateUI();
    renderSlip();
    renderMyBets();
    safeAlert('info', 'Sesión Finalizada');
}

// RENDER MATCHES
function renderMatches() {
    const grid = document.getElementById('matches-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = STATE.matches.filter(m => {
        const matchesCat = (STATE.activeCategory === 'all' || m.category === STATE.activeCategory);
        const matchesFilt = (STATE.activeFilter === 'all' || m.status === STATE.activeFilter);
        return matchesCat && matchesFilt;
    });

    const countEl = document.getElementById('count-live');
    if (countEl) countEl.textContent = STATE.matches.filter(m => m.status === 'live').length;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-slip-state"><p>No hay eventos disponibles en esta categoría.</p></div>`;
        return;
    }

    filtered.forEach(m => {
        const isLive = m.status === 'live';
        const card = document.createElement('div');
        card.className = 'match-card';

        card.innerHTML = `
            <div class="match-card-header">
                <span class="match-league"><i class="fa-solid fa-trophy"></i> ${m.league}</span>
                <span class="match-time-badge">${isLive ? `Min ${m.minute}' 🟢` : 'HOY 19:35 PM'}</span>
            </div>
            <div class="match-body">
                <div class="teams-container">
                    <div class="team-row"><span class="team-name">${m.teamHome}</span><span class="team-score">${isLive ? m.scoreHome : '-'}</span></div>
                    <div class="team-row"><span class="team-name">${m.teamAway}</span><span class="team-score">${isLive ? m.scoreAway : '-'}</span></div>
                </div>
                <div class="odds-group">
                    <button class="odds-btn ${isSelectionInSlip(m.id, '1') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', '1', '${m.teamHome}', ${m.odds.home})">
                        <span class="odds-label">Local</span>
                        <span class="odds-value">${m.odds.home.toFixed(2)}</span>
                    </button>
                    <button class="odds-btn ${isSelectionInSlip(m.id, 'X') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', 'X', 'Empate', ${m.odds.draw})">
                        <span class="odds-label">Empate</span>
                        <span class="odds-value">${m.odds.draw.toFixed(2)}</span>
                    </button>
                    <button class="odds-btn ${isSelectionInSlip(m.id, '2') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', '2', '${m.teamAway}', ${m.odds.away})">
                        <span class="odds-label">Visita</span>
                        <span class="odds-value">${m.odds.away.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// TOGGLE ODDS (PERMITE ARMAR BOLETOS SIN EXIGIR LOGIN PREVIO)
window.toggleOdds = function(matchId, pickCode, pickName, oddValue) {
    const match = STATE.matches.find(m => m.id === matchId);
    if (!match) return;

    const existingIndex = STATE.betSlip.findIndex(item => item.matchId === matchId && item.pickCode === pickCode);

    if (existingIndex !== -1) {
        STATE.betSlip.splice(existingIndex, 1);
    } else {
        const sameMatchIndex = STATE.betSlip.findIndex(item => item.matchId === matchId);
        if (sameMatchIndex !== -1) STATE.betSlip.splice(sameMatchIndex, 1);

        STATE.betSlip.push({
            matchId: match.id,
            matchTitle: `${match.teamHome} vs ${match.teamAway}`,
            pickCode,
            pickName,
            odd: oddValue
        });
    }

    renderMatches();
    renderSlip();
};

function isSelectionInSlip(matchId, pickCode) {
    return STATE.betSlip.some(item => item.matchId === matchId && item.pickCode === pickCode);
}

function setBetMode(mode) {
    STATE.betMode = mode;
    document.getElementById('btn-mode-single')?.classList.toggle('active', mode === 'single');
    document.getElementById('btn-mode-parlay')?.classList.toggle('active', mode === 'parlay');
    updateSlipCalculator();
}

function renderSlip() {
    const container = document.getElementById('slip-items-container');
    const countBadge = document.getElementById('slip-count');
    if (countBadge) countBadge.textContent = STATE.betSlip.length;

    if (!container) return;

    if (STATE.betSlip.length === 0) {
        container.innerHTML = `<div class="empty-slip-state"><p>Su boleto de apuestas está vacío</p></div>`;
        updateSlipCalculator();
        return;
    }

    container.innerHTML = '';
    STATE.betSlip.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'slip-item';
        div.innerHTML = `
            <div class="slip-item-header"><span>${item.matchTitle}</span><button class="btn-remove-item" onclick="removeSlipItem(${index})">&times;</button></div>
            <div class="slip-item-selection"><span>Selección: <strong>${item.pickName}</strong></span><span class="odds-value">${item.odd.toFixed(2)}</span></div>
        `;
        container.appendChild(div);
    });

    updateSlipCalculator();
}

window.removeSlipItem = function(index) {
    STATE.betSlip.splice(index, 1);
    renderMatches();
    renderSlip();
};

function updateSlipCalculator() {
    const totalOddsEl = document.getElementById('slip-total-odds');
    const totalPayoutEl = document.getElementById('slip-total-payout');
    const btnPlace = document.getElementById('btn-place-bet');
    const stakeInput = document.getElementById('slip-stake-input');

    if (!totalOddsEl || !totalPayoutEl || !btnPlace || !stakeInput) return;

    const stake = parseFloat(stakeInput.value) || 0;

    if (STATE.betSlip.length === 0) {
        totalOddsEl.textContent = '1.00';
        totalPayoutEl.textContent = 'RD$ 0.00';
        btnPlace.disabled = true;
        return;
    }

    let totalOdds = 1;
    if (STATE.betMode === 'parlay') {
        totalOdds = STATE.betSlip.reduce((acc, item) => acc * item.odd, 1);
    } else {
        totalOdds = STATE.betSlip[0].odd;
    }

    const potentialPayout = stake * totalOdds;
    totalOddsEl.textContent = totalOdds.toFixed(2);
    totalPayoutEl.textContent = `RD$ ${potentialPayout.toFixed(2)}`;
    btnPlace.disabled = (stake <= 0);
}

// PLACE BET (PIDE LOGIN SOLO AL SELLAR)
function placeBet() {
    if (!STATE.currentUser) {
        openAuthModal('login');
        return;
    }

    const stakeInput = document.getElementById('slip-stake-input');
    const stake = parseFloat(stakeInput.value) || 0;

    if (stake <= 0 || stake > STATE.currentUser.balance) {
        safeAlert('error', 'Saldo Insuficiente');
        return;
    }

    let totalOdds = 1;
    if (STATE.betMode === 'parlay') {
        totalOdds = STATE.betSlip.reduce((acc, item) => acc * item.odd, 1);
    } else {
        totalOdds = STATE.betSlip[0].odd;
    }

    const newBet = {
        id: 'TICKET-' + Math.floor(Math.random() * 900000 + 100000),
        items: [...STATE.betSlip],
        stake,
        odds: totalOdds,
        potentialPayout: stake * totalOdds,
        status: 'ACCEPTED'
    };

    STATE.currentUser.balance -= stake;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    STATE.myBets.unshift(newBet);
    STATE.betSlip = [];

    saveDatabase();
    saveUserBets();
    updateUI();
    renderMatches();
    renderSlip();

    safeConfetti({ particleCount: 60, spread: 60 });
    safeAlert('success', '¡Apuesta Sellada!', `Boleto N° ${newBet.id} aceptado. Retorno: RD$ ${newBet.potentialPayout.toFixed(2)}`);
}

function renderMyBets() {
    const container = document.getElementById('mybets-list');
    const countEl = document.getElementById('mybets-count');

    if (countEl) countEl.textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;
    if (!container) return;

    if (STATE.myBets.length === 0) {
        container.innerHTML = `<div class="empty-slip-state"><p>No registra boletos de apuestas.</p></div>`;
        return;
    }

    container.innerHTML = '';
    STATE.myBets.forEach(bet => {
        const div = document.createElement('div');
        div.className = 'mybet-card';
        const cashoutValue = (bet.stake * (bet.odds * 0.85)).toFixed(2);

        div.innerHTML = `
            <div class="mybet-header"><span>#${bet.id}</span><span class="mybet-status ${bet.status.toLowerCase()}">${bet.status}</span></div>
            <div style="font-size:0.85rem;">${bet.items.map(i => `<div>• ${i.matchTitle} (${i.pickName} @${i.odd.toFixed(2)})</div>`).join('')}</div>
            <div style="font-size:0.8rem; margin-top:4px;">Apostado: <strong>RD$${bet.stake.toFixed(2)}</strong> | Retorno: <strong>RD$${bet.potentialPayout.toFixed(2)}</strong></div>
            ${bet.status === 'ACCEPTED' ? `<button class="btn-cashout" onclick="cashoutBet('${bet.id}', ${cashoutValue})">⚡ CASH OUT (Retirar RD$${cashoutValue})</button>` : ''}
        `;
        container.appendChild(div);
    });
}

window.cashoutBet = function(betId, cashoutAmount) {
    const bet = STATE.myBets.find(b => b.id === betId);
    if (!bet || bet.status !== 'ACCEPTED') return;

    bet.status = 'CASHED_OUT';
    STATE.currentUser.balance += parseFloat(cashoutAmount);
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    saveUserBets();
    updateUI();
    renderMyBets();

    safeConfetti({ particleCount: 80, spread: 80 });
    safeAlert('success', 'Cash Out Exitoso', `Se acreditaron RD$ ${cashoutAmount} a su cuenta.`);
};

function updateUI() {
    const guestBlock = document.getElementById('guest-auth-block');
    const userBlock = document.getElementById('user-logged-block');

    if (STATE.currentUser) {
        guestBlock?.classList.add('hidden');
        userBlock?.classList.remove('hidden');

        const balEl = document.getElementById('user-balance');
        if (balEl) balEl.innerHTML = `RD$ ${STATE.currentUser.balance.toFixed(2)}`;

        const nameEl = document.getElementById('user-display-name');
        if (nameEl) nameEl.textContent = STATE.currentUser.name.split(' ')[0];

        const dropName = document.getElementById('dropdown-user-name');
        if (dropName) dropName.textContent = STATE.currentUser.name;

        const dropEmail = document.getElementById('dropdown-user-email');
        if (dropEmail) dropEmail.textContent = STATE.currentUser.email;
    } else {
        guestBlock?.classList.remove('hidden');
        userBlock?.classList.add('hidden');
    }
}

function simulateLiveOddsAndClock() {
    STATE.matches.forEach(m => {
        if (m.status === 'live') {
            const delta = (Math.random() - 0.5) * 0.1;
            m.odds.home = Math.max(1.10, m.odds.home + delta);
            m.odds.away = Math.max(1.10, m.odds.away - delta);
        }
    });
    renderMatches();
}

function playPale() {
    if (!STATE.currentUser) { openAuthModal('login'); return; }

    const num1 = parseInt(document.getElementById('num-1').value);
    const num2 = parseInt(document.getElementById('num-2').value);
    const stake = parseFloat(document.getElementById('pale-stake').value) || 0;

    if (isNaN(num1) || isNaN(num2) || stake <= 0) { safeAlert('warning', 'Ingrese dos números del 00 al 99.'); return; }
    if (stake > STATE.currentUser.balance) { safeAlert('error', 'Saldo Insuficiente'); return; }

    STATE.currentUser.balance -= stake;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
    updateUI();

    const n1 = Math.floor(Math.random() * 100);
    const n2 = Math.floor(Math.random() * 100);

    if ((num1 === n1 && num2 === n2) || (num1 === n2 && num2 === n1)) {
        const win = stake * 100;
        STATE.currentUser.balance += win;
        STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
        safeConfetti({ particleCount: 150, spread: 90 });
        safeAlert('success', '¡Palé Ganador!', `Premio: RD$ ${win.toFixed(2)}`);
    } else {
        safeAlert('info', 'Resultado', `Ganadores: ${n1} y ${n2}`);
    }

    saveDatabase();
    updateUI();
}

function playGallos() {
    if (!STATE.currentUser) { openAuthModal('login'); return; }

    const selected = document.querySelector('.btn-roulette.selected');
    if (!selected) { safeAlert('warning', 'Selección Requerida'); return; }

    const choice = selected.dataset.choice;
    const stake = parseFloat(document.getElementById('gallo-stake').value) || 0;

    if (stake <= 0 || stake > STATE.currentUser.balance) { safeAlert('error', 'Saldo Insuficiente'); return; }

    STATE.currentUser.balance -= stake;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
    updateUI();

    setTimeout(() => {
        const winner = Math.random() > 0.5 ? 'indio' : 'giro';
        if (choice === winner) {
            const win = stake * (winner === 'indio' ? 1.95 : 1.85);
            STATE.currentUser.balance += win;
            STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
            safeConfetti({ particleCount: 100, spread: 80 });
            safeAlert('success', '¡Victoria!', `Ganador: ${winner.toUpperCase()}. Acreditados RD$ ${win.toFixed(2)}`);
        } else {
            safeAlert('error', 'Resultado', `Ganador: ${winner.toUpperCase()}`);
        }
        saveDatabase();
        updateUI();
    }, 1000);
}
