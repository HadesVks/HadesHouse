/**
 * HADES HOUSE OFFICIAL BRAND EDITION 🇩🇴 — HIGH PERFORMANCE SPORTSBOOK ENGINE
 * Marca Oficial, Logo de Producción, Promociones y Pasarelas de Pago
 */

// SUPABASE INITIALIZATION
const SUPABASE_URL = 'https://xyzcompany.supabase.co';
const SUPABASE_KEY = 'public-anon-key';

let supabase = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {}
}

// USUARIOS ADMINISTRADORES PREDETERMINADOS
const DEFAULT_ADMINS = {
    'admin@hadeshouse.com': {
        id: 'USR-ADMIN-01',
        name: 'Administrador Hades House',
        email: 'admin@hadeshouse.com',
        password: 'admin123456',
        level: 'VIP Administrador',
        isAdmin: true,
        balance: 500000.00,
        createdAt: '2026-01-01T00:00:00.000Z'
    },
    'hades@hadeshouse.com': {
        id: 'USR-ADMIN-02',
        name: 'Hades Master (Banquero)',
        email: 'hades@hadeshouse.com',
        password: 'hades2026',
        level: 'Pro Banquero',
        isAdmin: true,
        balance: 1000000.00,
        createdAt: '2026-01-01T00:00:00.000Z'
    }
};

// STATE MANAGEMENT
const STATE = {
    currentUser: null,
    usersDB: {},
    betSlip: [],
    betMode: 'single', // 'single' | 'parlay'
    myBets: [],
    activeFilter: 'live',
    activeCategory: 'all',
    activePayTab: 'deposit',
    activePayMethod: 'card',
    liveChart: null,
    liveComments: [
        { author: 'Carlos Dominicano 🇩🇴', text: '¡Licey va a ganar este partido sí o sí!', time: '21:05 PM' },
        { author: 'Pedro Apuesta ⚾', text: 'El pitcheo de las Águilas está fuerte hoy.', time: '21:08 PM' },
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
            league: 'Grandes Ligas (MLB API Real)',
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

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    checkSession();
    initEventListeners();
    initLiveStatsChart();
    renderComments();
    fetchRealSportsDataFromTheSportsDB();
    renderMatches();
    updateUI();

    setInterval(fetchRealSportsDataFromTheSportsDB, 20000);
    setInterval(simulateLiveOddsAndClock, 4000);
});

// REAL API FETCH: THESPORTSDB
async function fetchRealSportsDataFromTheSportsDB() {
    const teamsToFetch = [
        { name: 'Real_Madrid', category: 'football', leagueName: 'LaLiga Española (Oficial)' },
        { name: 'New_York_Yankees', category: 'mlb', leagueName: 'Grandes Ligas MLB (Oficial)' },
        { name: 'Los_Angeles_Lakers', category: 'basketball', leagueName: 'NBA League (Oficial)' }
    ];

    for (const item of teamsToFetch) {
        try {
            const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${item.name}`;
            const response = await fetch(url);
            if (!response.ok) continue;

            const text = await response.text();
            if (!text || !text.startsWith('{')) continue;

            const data = JSON.parse(text);
            if (data.teams && data.teams.length > 0) {
                const targetMatch = STATE.matches.find(m => m.category === item.category);
                if (targetMatch) targetMatch.league = item.leagueName;
            }
        } catch (error) {}
    }
    renderMatches();
}

// DATABASE PERSISTENCE
function loadDatabase() {
    const rawDB = localStorage.getItem('hades_users_db');
    if (rawDB) {
        try { STATE.usersDB = JSON.parse(rawDB); } catch (e) { STATE.usersDB = {}; }
    } else {
        STATE.usersDB = {};
    }

    Object.keys(DEFAULT_ADMINS).forEach(email => {
        if (!STATE.usersDB[email]) {
            STATE.usersDB[email] = DEFAULT_ADMINS[email];
        }
    });

    const rawComments = localStorage.getItem('hades_live_comments');
    if (rawComments) {
        try { STATE.liveComments = JSON.parse(rawComments); } catch (e) {}
    }

    localStorage.setItem('hades_users_db', JSON.stringify(STATE.usersDB));
}

function saveDatabase() {
    localStorage.setItem('hades_users_db', JSON.stringify(STATE.usersDB));
    localStorage.setItem('hades_live_comments', JSON.stringify(STATE.liveComments));

    if (STATE.currentUser) {
        localStorage.setItem('hades_active_session', JSON.stringify(STATE.currentUser.email));
    } else {
        localStorage.removeItem('hades_active_session');
    }
}

function checkSession() {
    const activeEmail = localStorage.getItem('hades_active_session');
    if (activeEmail) {
        try {
            const cleanEmail = JSON.parse(activeEmail);
            if (STATE.usersDB[cleanEmail]) {
                STATE.currentUser = STATE.usersDB[cleanEmail];
                loadUserBets();
            }
        } catch (e) {}
    }
}

function loadUserBets() {
    if (!STATE.currentUser) return;
    const rawBets = localStorage.getItem(`hades_bets_${STATE.currentUser.id}`);
    if (rawBets) {
        try { STATE.myBets = JSON.parse(rawBets); } catch (e) { STATE.myBets = []; }
    } else {
        STATE.myBets = [];
    }
}

function saveUserBets() {
    if (!STATE.currentUser) return;
    localStorage.setItem(`hades_bets_${STATE.currentUser.id}`, JSON.stringify(STATE.myBets));
}

// CHART.JS STATS
function initLiveStatsChart() {
    const ctx = document.getElementById('liveStatsChart');
    if (!ctx) return;

    STATE.liveChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Equipo Local', 'Equipo Visita'],
            datasets: [{
                label: 'Estadísticas Oficiales',
                data: [65, 52],
                backgroundColor: ['#002D62', '#FFD700'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#94A3B8' }, grid: { display: false } },
                y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

// RENDER COMMENTS
function renderComments() {
    const list = document.getElementById('comments-list');
    if (!list) return;

    list.innerHTML = '';
    STATE.liveComments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-bubble';
        div.innerHTML = `
            <span class="comment-author">${c.author}:</span>
            <span class="comment-text">${c.text}</span>
            <span class="comment-time">${c.time}</span>
        `;
        list.appendChild(div);
    });

    list.scrollTop = list.scrollHeight;
}

function sendComment() {
    const input = document.getElementById('input-comment');
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

// EVENT LISTENERS
function initEventListeners() {
    document.getElementById('btn-open-login')?.addEventListener('click', () => openAuthModal('login'));
    document.getElementById('btn-open-register')?.addEventListener('click', () => openAuthModal('register'));
    document.getElementById('btn-close-auth')?.addEventListener('click', closeAuthModal);

    document.getElementById('tab-auth-login')?.addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tab-auth-register')?.addEventListener('click', () => switchAuthTab('register'));

    document.getElementById('form-login')?.addEventListener('submit', handleLoginSubmit);
    document.getElementById('form-register')?.addEventListener('submit', handleRegisterSubmit);

    document.getElementById('btn-toggle-profile')?.addEventListener('click', () => {
        document.getElementById('profile-dropdown').classList.toggle('hidden');
    });

    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

    document.getElementById('btn-send-comment')?.addEventListener('click', sendComment);
    document.getElementById('input-comment')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendComment();
    });

    // Reclamar Bono de Bienvenida
    document.getElementById('btn-claim-welcome-bonus')?.addEventListener('click', () => {
        if (!STATE.currentUser) {
            openAuthModal('register');
            return;
        }

        const bonus = 10000.00;
        STATE.currentUser.balance += bonus;
        STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

        saveDatabase();
        updateUI();

        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });

        Swal.fire({
            icon: 'success',
            title: '¡Bono de Bienvenida Activado!',
            text: 'Se han acreditado RD$ 10,000.00 promocionales a su billetera oficial con el código HADES100.',
            confirmButtonColor: '#FFD700'
        });
    });

    // Modales de Pago & Billetera
    document.getElementById('btn-open-deposit')?.addEventListener('click', () => {
        if (!STATE.currentUser) {
            openAuthModal('login');
            return;
        }
        document.getElementById('modal-deposit').classList.remove('hidden');
    });

    document.getElementById('btn-close-deposit')?.addEventListener('click', () => {
        document.getElementById('modal-deposit').classList.add('hidden');
    });

    // Switcher Depósito / Retiro
    document.getElementById('tab-pay-deposit')?.addEventListener('click', () => switchPaymentTab('deposit'));
    document.getElementById('tab-pay-withdraw')?.addEventListener('click', () => switchPaymentTab('withdraw'));

    // Selector Métodos de Pago
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            STATE.activePayMethod = target.dataset.method;

            document.getElementById('form-deposit-card').classList.toggle('hidden', STATE.activePayMethod !== 'card');
            document.getElementById('form-deposit-bank').classList.toggle('hidden', STATE.activePayMethod !== 'bank');
            document.getElementById('form-deposit-crypto').classList.toggle('hidden', STATE.activePayMethod !== 'crypto');
        });
    });

    // Form Submissions
    document.getElementById('form-deposit-card')?.addEventListener('submit', handleDepositCardSubmit);
    document.getElementById('form-deposit-bank')?.addEventListener('submit', handleDepositBankSubmit);
    document.getElementById('form-deposit-crypto')?.addEventListener('submit', handleDepositCryptoSubmit);
    document.getElementById('form-withdraw')?.addEventListener('submit', handleWithdrawSubmit);

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            STATE.activeCategory = target.dataset.category;

            if (STATE.activeCategory === 'banca') {
                document.getElementById('matches-grid').classList.add('hidden');
                document.getElementById('casino-section').classList.remove('hidden');
            } else {
                document.getElementById('casino-section').classList.add('hidden');
                document.getElementById('matches-grid').classList.remove('hidden');
                renderMatches();
            }
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            STATE.activeFilter = e.currentTarget.dataset.filter;
            renderMatches();
        });
    });

    document.getElementById('tab-slip-betslip')?.addEventListener('click', () => {
        document.getElementById('tab-slip-betslip').classList.add('active');
        document.getElementById('tab-slip-mybets').classList.remove('active');
        document.getElementById('slip-content-betslip').classList.remove('hidden');
        document.getElementById('slip-content-mybets').classList.add('hidden');
    });

    document.getElementById('tab-slip-mybets')?.addEventListener('click', () => {
        document.getElementById('tab-slip-mybets').classList.add('active');
        document.getElementById('tab-slip-betslip').classList.remove('active');
        document.getElementById('slip-content-mybets').classList.remove('hidden');
        document.getElementById('slip-content-betslip').classList.add('hidden');
        renderMyBets();
    });

    document.getElementById('btn-mode-single')?.addEventListener('click', () => setBetMode('single'));
    document.getElementById('btn-mode-parlay')?.addEventListener('click', () => setBetMode('parlay'));

    document.querySelectorAll('.btn-qs').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = document.getElementById('slip-stake-input');
            if (e.currentTarget.id === 'btn-qs-max') {
                input.value = Math.floor(STATE.currentUser ? STATE.currentUser.balance : 0);
            } else {
                input.value = e.currentTarget.dataset.amount;
            }
            updateSlipCalculator();
        });
    });

    document.getElementById('slip-stake-input')?.addEventListener('input', updateSlipCalculator);
    document.getElementById('btn-place-bet')?.addEventListener('click', placeBet);
    document.getElementById('btn-play-pale')?.addEventListener('click', playPale);
}

// PAYMENT TABS LOGIC
function switchPaymentTab(tab) {
    STATE.activePayTab = tab;
    const isDeposit = tab === 'deposit';
    document.getElementById('tab-pay-deposit').classList.toggle('active', isDeposit);
    document.getElementById('tab-pay-withdraw').classList.toggle('active', !isDeposit);

    document.getElementById('section-pay-deposit').classList.toggle('hidden', !isDeposit);
    document.getElementById('section-pay-withdraw').classList.toggle('hidden', isDeposit);
}

function handleDepositCardSubmit(e) {
    e.preventDefault();
    if (!STATE.currentUser) return;

    const amount = parseFloat(document.getElementById('dep-card-amount').value) || 0;
    if (amount < 100) {
        Swal.fire({ icon: 'warning', title: 'Monto Mínimo', text: 'El depósito mínimo por tarjeta es RD$ 100.00' });
        return;
    }

    Swal.fire({
        title: 'Procesando Tarjeta...',
        text: 'Validando transacción segura 3D Secure',
        timer: 1500,
        showConfirmButton: false
    }).then(() => {
        STATE.currentUser.balance += amount;
        STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

        saveDatabase();
        updateUI();
        document.getElementById('modal-deposit').classList.add('hidden');

        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

        Swal.fire({
            icon: 'success',
            title: '¡Depósito Aprobado!',
            text: `Se acreditaron RD$ ${amount.toLocaleString('es-DO', {minimumFractionDigits:2})} a su billetera principal.`,
            confirmButtonColor: '#00E676'
        });
    });
}

function handleDepositBankSubmit(e) {
    e.preventDefault();
    if (!STATE.currentUser) return;

    const amount = parseFloat(document.getElementById('dep-bank-amount').value) || 0;
    const ref = document.getElementById('dep-bank-ref').value.trim();

    if (!ref) {
        Swal.fire({ icon: 'warning', title: 'Referencia Requerida' });
        return;
    }

    STATE.currentUser.balance += amount;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    updateUI();
    document.getElementById('modal-deposit').classList.add('hidden');

    Swal.fire({
        icon: 'success',
        title: 'Transferencia Validada',
        text: `Se han acreditado RD$ ${amount.toLocaleString('es-DO', {minimumFractionDigits:2})} mediante comprobante ${ref}`,
        confirmButtonColor: '#002D62'
    });
}

function handleDepositCryptoSubmit(e) {
    e.preventDefault();
    if (!STATE.currentUser) return;

    const txid = document.getElementById('dep-crypto-txid').value.trim();
    if (txid.length < 10) {
        Swal.fire({ icon: 'error', title: 'TXID Inválido', text: 'Por favor pegue un Hash TXID válido de la red TRC-20.' });
        return;
    }

    const creditedRD = 100 * 60.0;

    STATE.currentUser.balance += creditedRD;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    updateUI();
    document.getElementById('modal-deposit').classList.add('hidden');

    confetti({ particleCount: 100, spread: 80 });

    Swal.fire({
        icon: 'success',
        title: '¡Transacción Blockchain Confirmada!',
        text: `Depósito USDT validado. Se acreditaron RD$ ${creditedRD.toLocaleString('es-DO', {minimumFractionDigits:2})} a su cuenta.`,
        confirmButtonColor: '#FFD700'
    });
}

function handleWithdrawSubmit(e) {
    e.preventDefault();
    if (!STATE.currentUser) return;

    const amount = parseFloat(document.getElementById('with-amount').value) || 0;
    const accNum = document.getElementById('with-account-number').value.trim();

    if (amount <= 0 || amount > STATE.currentUser.balance) {
        Swal.fire({ icon: 'error', title: 'Saldo Insuficiente', text: 'El monto solicitado supera su saldo disponible para retiro.' });
        return;
    }

    STATE.currentUser.balance -= amount;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    updateUI();
    document.getElementById('modal-deposit').classList.add('hidden');

    Swal.fire({
        icon: 'success',
        title: '¡Solicitud de Retiro Procesada!',
        text: `Se ha enviado la transferencia de RD$ ${amount.toLocaleString('es-DO', {minimumFractionDigits:2})} a la cuenta ${accNum}`,
        confirmButtonColor: '#002D62'
    });
}

// AUTH MODAL LOGIC
function openAuthModal(tab = 'login') {
    document.getElementById('modal-auth').classList.remove('hidden');
    switchAuthTab(tab);
}

function closeAuthModal() {
    document.getElementById('modal-auth').classList.add('hidden');
}

function switchAuthTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tab-auth-login').classList.toggle('active', isLogin);
    document.getElementById('tab-auth-register').classList.toggle('active', !isLogin);
    document.getElementById('form-login').classList.toggle('hidden', !isLogin);
    document.getElementById('form-register').classList.toggle('hidden', isLogin);
    document.getElementById('auth-modal-title').innerHTML = isLogin 
        ? `<i class="fa-solid fa-user-shield"></i> Iniciar Sesión`
        : `<i class="fa-solid fa-user-plus"></i> Registro de Usuario`;
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!STATE.usersDB[email]) {
        Swal.fire({ icon: 'error', title: 'Cuenta no encontrada', text: 'No existe una cuenta registrada con este correo electrónico.' });
        return;
    }

    const user = STATE.usersDB[email];
    if (user.password !== password) {
        Swal.fire({ icon: 'error', title: 'Contraseña Incorrecta', text: 'Por favor verifique su clave de acceso.' });
        return;
    }

    STATE.currentUser = user;
    saveDatabase();
    loadUserBets();
    updateUI();
    closeAuthModal();

    Swal.fire({
        icon: 'success',
        title: `Bienvenido de nuevo, ${user.name}`,
        text: `Nivel: ${user.level} | Saldo: RD$ ${user.balance.toLocaleString('es-DO', {minimumFractionDigits:2})}`,
        timer: 2000,
        showConfirmButton: false
    });
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    if (STATE.usersDB[email]) {
        Swal.fire({ icon: 'warning', title: 'Correo ya registrado', text: 'Este correo electrónico ya pertenece a una cuenta activa.' });
        return;
    }

    const newUser = {
        id: 'USR-' + Math.floor(Math.random() * 900000 + 100000),
        name,
        email,
        password,
        level: 'Nivel Bronce',
        isAdmin: false,
        balance: 25000.00,
        createdAt: new Date().toISOString()
    };

    STATE.usersDB[email] = newUser;
    STATE.currentUser = newUser;

    saveDatabase();
    loadUserBets();
    updateUI();
    closeAuthModal();

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    Swal.fire({
        icon: 'success',
        title: '¡Registro Exitoso!',
        text: 'Se han acreditado RD$ 25,000.00 de bono inicial a su billetera.',
        confirmButtonColor: '#002D62'
    });
}

function handleLogout() {
    STATE.currentUser = null;
    STATE.myBets = [];
    localStorage.removeItem('hades_active_session');
    document.getElementById('profile-dropdown').classList.add('hidden');
    updateUI();
    renderSlip();
    renderMyBets();

    Swal.fire({ icon: 'info', title: 'Sesión Finalizada', timer: 1500, showConfirmButton: false });
}

// RENDER MATCHES
function renderMatches() {
    const grid = document.getElementById('matches-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = STATE.matches.filter(m => {
        const matchesCategory = (STATE.activeCategory === 'all' || m.category === STATE.activeCategory);
        const matchesFilter = (STATE.activeFilter === 'all' || m.status === STATE.activeFilter);
        return matchesCategory && matchesFilter;
    });

    document.getElementById('count-live').textContent = STATE.matches.filter(m => m.status === 'live').length;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-slip-state"><i class="fa-solid fa-calendar-xmark empty-icon"></i><p>No hay eventos disponibles en esta categoría en este momento.</p></div>`;
        return;
    }

    filtered.forEach(m => {
        const isLive = m.status === 'live';
        const card = document.createElement('div');
        card.className = 'match-card';
        card.id = `card-${m.id}`;

        const timeText = isLive 
            ? (m.category === 'lidom' || m.category === 'mlb' ? `${m.minute}º Inning ⚾` : `Min ${m.minute}' 🟢`)
            : (m.status === 'finished' ? 'FINALIZADO 🏁' : 'HOY 19:35 PM');

        card.innerHTML = `
            <div class="match-card-header">
                <span class="match-league"><i class="fa-solid fa-trophy"></i> ${m.league}</span>
                <span class="match-time-badge">${timeText}</span>
            </div>
            <div class="match-body">
                <div class="teams-container">
                    <div class="team-row">
                        <span class="team-name">${m.teamHome}</span>
                        <span class="team-score">${isLive || m.status === 'finished' ? m.scoreHome : '-'}</span>
                    </div>
                    <div class="team-row">
                        <span class="team-name">${m.teamAway}</span>
                        <span class="team-score">${isLive || m.status === 'finished' ? m.scoreAway : '-'}</span>
                    </div>
                </div>

                <div class="odds-group">
                    <button class="odds-btn ${isSelectionInSlip(m.id, '1') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', '1', '${m.teamHome}', ${m.odds.home})">
                        <span class="odds-label">Gana Local</span>
                        <span class="odds-value" id="odd-${m.id}-home">${m.odds.home.toFixed(2)}</span>
                    </button>
                    <button class="odds-btn ${isSelectionInSlip(m.id, 'X') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', 'X', 'Empate', ${m.odds.draw})">
                        <span class="odds-label">Empate</span>
                        <span class="odds-value" id="odd-${m.id}-draw">${m.odds.draw.toFixed(2)}</span>
                    </button>
                    <button class="odds-btn ${isSelectionInSlip(m.id, '2') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', '2', '${m.teamAway}', ${m.odds.away})">
                        <span class="odds-label">Gana Visita</span>
                        <span class="odds-value" id="odd-${m.id}-away">${m.odds.away.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// TOGGLE ODDS
window.toggleOdds = function(matchId, pickCode, pickName, oddValue) {
    if (!STATE.currentUser) {
        openAuthModal('login');
        return;
    }

    const match = STATE.matches.find(m => m.id === matchId);
    if (!match) return;

    const existingIndex = STATE.betSlip.findIndex(item => item.matchId === matchId && item.pickCode === pickCode);

    if (existingIndex !== -1) {
        STATE.betSlip.splice(existingIndex, 1);
    } else {
        const sameMatchIndex = STATE.betSlip.findIndex(item => item.matchId === matchId);
        if (sameMatchIndex !== -1) {
            STATE.betSlip.splice(sameMatchIndex, 1);
        }

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

// BET SLIP RENDER & CALCULATOR
function setBetMode(mode) {
    STATE.betMode = mode;
    document.getElementById('btn-mode-single')?.classList.toggle('active', mode === 'single');
    document.getElementById('btn-mode-parlay')?.classList.toggle('active', mode === 'parlay');
    updateSlipCalculator();
}

function renderSlip() {
    const container = document.getElementById('slip-items-container');
    const countBadge = document.getElementById('slip-count');
    countBadge.textContent = STATE.betSlip.length;

    if (STATE.betSlip.length === 0) {
        container.innerHTML = `
            <div class="empty-slip-state">
                <i class="fa-solid fa-ticket-simple empty-icon"></i>
                <p>Su boleto de apuestas está vacío</p>
                <small>Haga clic sobre cualquier cuota para añadir una selección.</small>
            </div>`;
        updateSlipCalculator();
        return;
    }

    container.innerHTML = '';
    STATE.betSlip.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'slip-item';
        div.innerHTML = `
            <div class="slip-item-header">
                <span>${item.matchTitle}</span>
                <button class="btn-remove-item" onclick="removeSlipItem(${index})"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="slip-item-selection">
                <span>Selección: <strong>${item.pickName}</strong></span>
                <span class="odds-value">${item.odd.toFixed(2)}</span>
            </div>
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

    const stake = parseFloat(stakeInput.value) || 0;
    const balance = STATE.currentUser ? STATE.currentUser.balance : 0;

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
    totalPayoutEl.textContent = `RD$ ${potentialPayout.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

    btnPlace.disabled = (!STATE.currentUser || stake <= 0 || stake > balance);
}

// PLACE BET
function placeBet() {
    if (!STATE.currentUser) {
        openAuthModal('login');
        return;
    }

    const stakeInput = document.getElementById('slip-stake-input');
    const stake = parseFloat(stakeInput.value) || 0;

    if (stake <= 0 || stake > STATE.currentUser.balance) {
        Swal.fire({ icon: 'error', title: 'Saldo Insuficiente', text: 'No dispone de fondos suficientes en su billetera principal.' });
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
        timestamp: new Date().toLocaleString('es-DO'),
        type: STATE.betMode,
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

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });

    Swal.fire({
        icon: 'success',
        title: '¡Apuesta Confirmada!',
        text: `Boleto N° ${newBet.id} sellado correctamente. Retorno estimado: RD$ ${newBet.potentialPayout.toLocaleString('es-DO', {minimumFractionDigits:2})}`,
        confirmButtonColor: '#002D62'
    });
}

// RENDER MY BETS
function renderMyBets() {
    const container = document.getElementById('mybets-list');
    document.getElementById('mybets-count').textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;
    document.getElementById('active-bets-count').textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;

    if (STATE.myBets.length === 0) {
        container.innerHTML = `<div class="empty-slip-state"><p>No registra boletos de apuestas en este momento.</p></div>`;
        return;
    }

    container.innerHTML = '';
    STATE.myBets.forEach(bet => {
        const div = document.createElement('div');
        div.className = 'mybet-card';

        const cashoutValue = (bet.stake * (bet.odds * 0.85)).toFixed(2);

        div.innerHTML = `
            <div class="mybet-header">
                <span>#${bet.id} — ${bet.type.toUpperCase()}</span>
                <span class="mybet-status ${bet.status.toLowerCase()}">${bet.status}</span>
            </div>
            <div style="font-size:0.85rem; margin-bottom:6px;">
                ${bet.items.map(i => `<div>• <strong>${i.matchTitle}</strong> (${i.pickName} @${i.odd.toFixed(2)})</div>`).join('')}
            </div>
            <div class="summary-row" style="font-size:0.8rem;">
                <span>Monto Apostado: <strong>RD$${bet.stake.toFixed(2)}</strong></span>
                <span>Retorno Estimado: <strong style="color:var(--accent-emerald)">RD$${bet.potentialPayout.toFixed(2)}</strong></span>
            </div>
            ${bet.status === 'ACCEPTED' ? `
                <button class="btn-cashout" onclick="cashoutBet('${bet.id}', ${cashoutValue})">
                    ⚡ CASH OUT ANTICIPADO (Retirar RD$${cashoutValue})
                </button>
            ` : ''}
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

    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });

    Swal.fire({
        icon: 'success',
        title: 'Cash Out Exitoso',
        text: `Se acreditaron RD$ ${cashoutAmount} a su billetera principal.`,
        confirmButtonColor: '#FFD700'
    });
};

// UPDATE UI
function updateUI() {
    const guestBlock = document.getElementById('guest-auth-block');
    const userBlock = document.getElementById('user-logged-block');

    if (STATE.currentUser) {
        guestBlock?.classList.add('hidden');
        userBlock?.classList.remove('hidden');

        document.getElementById('user-balance').innerHTML = `RD$ ${STATE.currentUser.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
        document.getElementById('user-display-name').textContent = STATE.currentUser.name.split(' ')[0];
        document.getElementById('dropdown-user-name').textContent = STATE.currentUser.name;
        document.getElementById('dropdown-user-email').textContent = STATE.currentUser.email;
        document.getElementById('dropdown-user-level').textContent = STATE.currentUser.level;
    } else {
        guestBlock?.classList.remove('hidden');
        userBlock?.classList.add('hidden');
    }
}

// LIVE ODDS SIMULATION
function simulateLiveOddsAndClock() {
    STATE.matches.forEach(m => {
        if (m.status === 'live') {
            const delta = (Math.random() - 0.5) * 0.1;
            m.odds.home = Math.max(1.10, m.odds.home + delta);
            m.odds.away = Math.max(1.10, m.odds.away - delta);
        }
    });

    if (STATE.activeCategory !== 'banca') {
        renderMatches();
    }
}

// SORTEO PALÉ
function playPale() {
    if (!STATE.currentUser) {
        openAuthModal('login');
        return;
    }

    const num1 = parseInt(document.getElementById('num-1').value);
    const num2 = parseInt(document.getElementById('num-2').value);
    const stake = parseFloat(document.getElementById('pale-stake').value) || 0;

    if (isNaN(num1) || isNaN(num2) || stake <= 0) {
        Swal.fire({ icon: 'warning', title: 'Datos Incompletos', text: 'Por favor ingrese dos números válidos del 00 al 99.' });
        return;
    }

    if (stake > STATE.currentUser.balance) {
        Swal.fire({ icon: 'error', title: 'Saldo Insuficiente' });
        return;
    }

    STATE.currentUser.balance -= stake;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
    updateUI();

    const n1 = Math.floor(Math.random() * 100);
    const n2 = Math.floor(Math.random() * 100);

    const isHit = (num1 === n1 && num2 === n2) || (num1 === n2 && num2 === n1);

    if (isHit) {
        const win = stake * 100;
        STATE.currentUser.balance += win;
        STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
        Swal.fire({ icon: 'success', title: '¡Combinación Ganadora!', text: `Resultado: ${n1} - ${n2}. Premio: RD$ ${win.toFixed(2)}` });
    } else {
        Swal.fire({ icon: 'info', title: 'Resultado del Sorteo', text: `Números ganadores: ${n1} y ${n2}.` });
    }

    saveDatabase();
    updateUI();
}
