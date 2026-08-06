/**
 * HADES HOUSE — SISTEMA PROFESIONAL DE APUESTAS & AUTENTICACIÓN DB
 * Incluye Usuarios Administradores Predeterminados y Cartelera Deportiva Expandida
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
    matches: [
        {
            id: 'm1',
            league: 'LIDOM (Pelota Invernal RD 🇩🇴)',
            category: 'lidom',
            teamHome: 'Tigres del Licey 💙',
            teamAway: 'Águilas Cibaeñas 💛',
            scoreHome: 4,
            scoreAway: 3,
            minute: 8, // 8vo Inning
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
            league: 'Grandes Ligas (MLB)',
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
            league: 'Grandes Ligas (MLB)',
            category: 'mlb',
            teamHome: 'LA Dodgers (Shohei Ohtani)',
            teamAway: 'SD Padres (Tatis Jr 🇩🇴)',
            scoreHome: 3,
            scoreAway: 2,
            minute: 5,
            status: 'live',
            odds: { home: 1.70, draw: 14.0, away: 2.20 }
        },
        {
            id: 'm5',
            league: 'UEFA Champions League',
            category: 'football',
            teamHome: 'Real Madrid (Vinícius Jr)',
            teamAway: 'FC Barcelona (Lamine Yamal)',
            scoreHome: 2,
            scoreAway: 1,
            minute: 78,
            status: 'live',
            odds: { home: 1.85, draw: 3.40, away: 4.10 }
        },
        {
            id: 'm6',
            league: 'Premier League',
            category: 'football',
            teamHome: 'Manchester City (Haaland)',
            teamAway: 'Arsenal FC (Saka)',
            scoreHome: 1,
            scoreAway: 1,
            minute: 54,
            status: 'live',
            odds: { home: 2.10, draw: 3.25, away: 3.50 }
        },
        {
            id: 'm7',
            league: 'NBA League (Baloncesto)',
            category: 'basketball',
            teamHome: 'LA Lakers (LeBron James)',
            teamAway: 'Golden State Warriors (Curry)',
            scoreHome: 104,
            scoreAway: 101,
            minute: 42,
            status: 'live',
            odds: { home: 1.85, draw: 15.0, away: 1.95 }
        },
        {
            id: 'm8',
            league: 'LNB Baloncesto RD 🇩🇴',
            category: 'basketball',
            teamHome: 'Reales de La Vega',
            teamAway: 'Titanes del Distrito',
            scoreHome: 88,
            scoreAway: 84,
            minute: 38,
            status: 'live',
            odds: { home: 1.75, draw: 18.0, away: 2.10 }
        },
        {
            id: 'm9',
            league: 'LDF Fútbol Dominicano 🇩🇴',
            category: 'ldf',
            teamHome: 'Cibao FC 🧡',
            teamAway: 'Atlético Pantoja 💙',
            scoreHome: 1,
            scoreAway: 0,
            minute: 65,
            status: 'live',
            odds: { home: 1.90, draw: 3.20, away: 4.00 }
        },
        {
            id: 'm10',
            league: 'UFC Championship MMA',
            category: 'ufc',
            teamHome: 'Alex Pereira 🇧🇷',
            teamAway: 'Magomed Ankalaev 🇷🇺',
            scoreHome: 0,
            scoreAway: 0,
            minute: 3,
            status: 'live',
            odds: { home: 1.70, draw: 25.0, away: 2.20 }
        },
        {
            id: 'm11',
            league: 'LIDOM (Próximo Juego 🇩🇴)',
            category: 'lidom',
            teamHome: 'Estrellas Orientales 💚',
            teamAway: 'Toros del Este 🧡',
            scoreHome: 0,
            scoreAway: 0,
            minute: 0,
            status: 'upcoming',
            odds: { home: 1.85, draw: 11.0, away: 1.95 }
        }
    ]
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    checkSession();
    initEventListeners();
    renderMatches();
    updateUI();

    setInterval(simulateLiveOddsAndClock, 4000);
});

// DATABASE & LOCAL PERSISTENCE
function loadDatabase() {
    const rawDB = localStorage.getItem('hades_users_db');
    if (rawDB) {
        try { STATE.usersDB = JSON.parse(rawDB); } catch (e) { STATE.usersDB = {}; }
    } else {
        STATE.usersDB = {};
    }

    // Inyectar o actualizar siempre los usuarios Administradores por defecto
    Object.keys(DEFAULT_ADMINS).forEach(email => {
        if (!STATE.usersDB[email]) {
            STATE.usersDB[email] = DEFAULT_ADMINS[email];
        }
    });

    localStorage.setItem('hades_users_db', JSON.stringify(STATE.usersDB));
}

function saveDatabase() {
    localStorage.setItem('hades_users_db', JSON.stringify(STATE.usersDB));
    if (STATE.currentUser) {
        localStorage.setItem('hades_active_session', JSON.stringify(STATE.currentUser.email));
    } else {
        localStorage.removeItem('hades_active_session');
    }
}

function checkSession() {
    const activeEmail = localStorage.getItem('hades_active_session');
    if (activeEmail) {
        const cleanEmail = JSON.parse(activeEmail);
        if (STATE.usersDB[cleanEmail]) {
            STATE.currentUser = STATE.usersDB[cleanEmail];
            loadUserBets();
        }
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

// EVENT LISTENERS
function initEventListeners() {
    // Auth Modal Triggers
    document.getElementById('btn-open-login')?.addEventListener('click', () => openAuthModal('login'));
    document.getElementById('btn-open-register')?.addEventListener('click', () => openAuthModal('register'));
    document.getElementById('btn-close-auth')?.addEventListener('click', closeAuthModal);

    // Auth Tabs Switcher
    document.getElementById('tab-auth-login')?.addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tab-auth-register')?.addEventListener('click', () => switchAuthTab('register'));

    // Auth Forms Submission
    document.getElementById('form-login')?.addEventListener('submit', handleLoginSubmit);
    document.getElementById('form-register')?.addEventListener('submit', handleRegisterSubmit);

    // Profile Dropdown
    document.getElementById('btn-toggle-profile')?.addEventListener('click', () => {
        document.getElementById('profile-dropdown').classList.toggle('hidden');
    });

    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

    // Categorías de navegación
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            STATE.activeCategory = target.dataset.category;

            if (STATE.activeCategory === 'banca' || STATE.activeCategory === 'gallos') {
                document.getElementById('matches-grid').classList.add('hidden');
                document.getElementById('casino-section').classList.remove('hidden');
            } else {
                document.getElementById('casino-section').classList.add('hidden');
                document.getElementById('matches-grid').classList.remove('hidden');
                renderMatches();
            }
        });
    });

    // Filtros de partidos
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            STATE.activeFilter = e.currentTarget.dataset.filter;
            renderMatches();
        });
    });

    // Pestañas del Ticket / Mis Apuestas
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

    // Toggle modo de apuesta
    document.getElementById('btn-mode-single')?.addEventListener('click', () => setBetMode('single'));
    document.getElementById('btn-mode-parlay')?.addEventListener('click', () => setBetMode('parlay'));

    // Botones rápidos de monto RD$
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

    // Recarga / Billetera Modal
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
    document.getElementById('btn-claim-faucet')?.addEventListener('click', claimFaucet);

    // Controles de Simulación
    document.getElementById('btn-simulate-minute')?.addEventListener('click', () => {
        STATE.matches.forEach(m => {
            if (m.status === 'live') {
                m.minute += 1;
                if (Math.random() > 0.5) m.scoreHome += 1;
            }
        });
        renderMatches();
        renderMyBets();
    });

    document.getElementById('btn-finish-matches')?.addEventListener('click', finishAllMatchesAndSettle);

    // Sorteo & Gallos
    document.getElementById('btn-play-pale')?.addEventListener('click', playPale);
    document.getElementById('btn-spin-gallo')?.addEventListener('click', playGallos);
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
        alert('❌ No existe una cuenta registrada con este correo electrónico.');
        return;
    }

    const user = STATE.usersDB[email];
    if (user.password !== password) {
        alert('❌ Contraseña incorrecta.');
        return;
    }

    STATE.currentUser = user;
    saveDatabase();
    loadUserBets();
    updateUI();
    closeAuthModal();

    alert(`✅ Bienvenido de nuevo, ${user.name} (${user.level})`);
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    if (STATE.usersDB[email]) {
        alert('⚠️ Este correo electrónico ya se encuentra registrado.');
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

    alert(`🎉 ¡Registro exitoso! Te hemos acreditado un bono inicial de RD$ 25,000.00`);
}

function handleLogout() {
    STATE.currentUser = null;
    STATE.myBets = [];
    localStorage.removeItem('hades_active_session');
    document.getElementById('profile-dropdown').classList.add('hidden');
    updateUI();
    renderSlip();
    renderMyBets();

    alert('Sesión cerrada correctamente.');
}

// RENDER MATCHES
function renderMatches() {
    const grid = document.getElementById('matches-grid');
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
        alert('❌ Saldo insuficiente en su billetera principal.');
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

    alert(`✅ Apuesta sellada con éxito. Boleto N° ${newBet.id}`);
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

    alert(`💵 Cierre de apuesta exitoso. Se acreditaron RD$ ${cashoutAmount} a su billetera.`);
};

// FAUCET
function claimFaucet() {
    if (!STATE.currentUser) {
        openAuthModal('login');
        return;
    }

    STATE.currentUser.balance += 5000.00;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;

    saveDatabase();
    updateUI();
    document.getElementById('modal-deposit').classList.add('hidden');
    alert('💰 Recarga acreditada. Se han añadido +RD$ 5,000.00 a su billetera.');
}

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

    if (STATE.activeCategory !== 'banca' && STATE.activeCategory !== 'gallos') {
        renderMatches();
    }
}

// FINISH MATCHES AND SETTLE
function finishAllMatchesAndSettle() {
    STATE.matches.forEach(m => {
        m.status = 'finished';
    });

    if (STATE.currentUser) {
        STATE.myBets.forEach(bet => {
            if (bet.status === 'ACCEPTED') {
                const won = Math.random() > 0.4;
                if (won) {
                    bet.status = 'WON';
                    STATE.currentUser.balance += bet.potentialPayout;
                    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
                } else {
                    bet.status = 'LOST';
                }
            }
        });
        saveDatabase();
        saveUserBets();
    }

    updateUI();
    renderMatches();
    renderMyBets();

    alert('🏁 Eventos concluidos. Se ha completado la liquidación de las apuestas activas.');
}

// SORTEO & GALLOS
function playPale() {
    if (!STATE.currentUser) {
        openAuthModal('login');
        return;
    }

    const num1 = parseInt(document.getElementById('num-1').value);
    const num2 = parseInt(document.getElementById('num-2').value);
    const stake = parseFloat(document.getElementById('pale-stake').value) || 0;

    if (isNaN(num1) || isNaN(num2) || stake <= 0) {
        alert('Por favor ingrese dos números válidos del 00 al 99.');
        return;
    }

    if (stake > STATE.currentUser.balance) {
        alert('❌ Saldo insuficiente.');
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
        alert(`🎉 ¡Combinación ganadora! Resultado: ${n1} - ${n2}. Ha obtenido RD$ ${win.toFixed(2)}`);
    } else {
        alert(`🎰 Números ganadores del sorteo: ${n1} y ${n2}. Le invitamos a participar en el siguiente sorteo.`);
    }

    saveDatabase();
    updateUI();
}

function playGallos() {
    if (!STATE.currentUser) {
        openAuthModal('login');
        return;
    }

    const selected = document.querySelector('.btn-roulette.selected');
    if (!selected) {
        alert('Por favor seleccione una opción.');
        return;
    }

    const choice = selected.dataset.choice;
    const stake = parseFloat(document.getElementById('gallo-stake').value) || 0;

    if (stake <= 0 || stake > STATE.currentUser.balance) {
        alert('❌ Saldo insuficiente.');
        return;
    }

    STATE.currentUser.balance -= stake;
    STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
    updateUI();

    setTimeout(() => {
        const winner = Math.random() > 0.5 ? 'indio' : 'giro';
        if (choice === winner) {
            const win = stake * (winner === 'indio' ? 1.95 : 1.85);
            STATE.currentUser.balance += win;
            STATE.usersDB[STATE.currentUser.email].balance = STATE.currentUser.balance;
            alert(`🏆 ¡Victoria para el participante ${winner.toUpperCase()}! Se acreditaron RD$ ${win.toFixed(2)}`);
        } else {
            alert(`❌ Resultado final: Ganador Participante ${winner.toUpperCase()}.`);
        }

        saveDatabase();
        updateUI();
    }, 1200);
}
