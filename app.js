/**
 * HADES HOUSE — PLATAFORMA DE APUESTAS & CASINO VIRTUAL
 * Lógica en Vanilla JS Modular con Persistencia en LocalStorage
 */

// STATE MANAGEMENT
const STATE = {
    balance: 10000.00,
    betSlip: [],
    betMode: 'single', // 'single' | 'parlay'
    myBets: [],
    activeFilter: 'live', // 'all' | 'live' | 'upcoming' | 'finished'
    activeCategory: 'all', // 'all' | 'football' | 'basketball' | 'tennis' | 'esports' | 'casino'
    crashGame: {
        multiplier: 1.00,
        running: false,
        crashed: false,
        betAmount: 0,
        userCashedOut: false,
        intervalId: null
    },
    matches: [
        {
            id: 'm1',
            league: 'UEFA Champions League',
            category: 'football',
            teamHome: 'Real Madrid',
            teamAway: 'Barcelona',
            scoreHome: 2,
            scoreAway: 1,
            minute: 78,
            status: 'live',
            odds: { home: 1.85, draw: 3.40, away: 4.10, over25: 1.65, under25: 2.10, btts: 1.55 }
        },
        {
            id: 'm2',
            league: 'Premier League',
            category: 'football',
            teamHome: 'Manchester City',
            teamAway: 'Liverpool',
            scoreHome: 1,
            scoreAway: 1,
            minute: 54,
            status: 'live',
            odds: { home: 2.10, draw: 3.25, away: 3.50, over25: 1.80, under25: 1.95, btts: 1.45 }
        },
        {
            id: 'm3',
            league: 'NBA League',
            category: 'basketball',
            teamHome: 'LA Lakers',
            teamAway: 'Boston Celtics',
            scoreHome: 102,
            scoreAway: 98,
            minute: 42,
            status: 'live',
            odds: { home: 1.90, draw: 15.0, away: 1.90, over25: 1.75, under25: 2.05, btts: 1.90 }
        },
        {
            id: 'm4',
            league: 'LaLiga EA Sports',
            category: 'football',
            teamHome: 'Atlético de Madrid',
            teamAway: 'Sevilla FC',
            scoreHome: 0,
            scoreAway: 0,
            minute: 0,
            status: 'upcoming',
            odds: { home: 1.70, draw: 3.60, away: 5.20, over25: 2.00, under25: 1.75, btts: 1.95 }
        },
        {
            id: 'm5',
            league: 'eSports CS2 Major',
            category: 'esports',
            teamHome: 'Natus Vincere',
            teamAway: 'FaZe Clan',
            scoreHome: 1,
            scoreAway: 0,
            minute: 25,
            status: 'live',
            odds: { home: 1.50, draw: 9.00, away: 2.60, over25: 1.70, under25: 2.10, btts: 1.85 }
        },
        {
            id: 'm6',
            league: 'ATP Grand Slam',
            category: 'tennis',
            teamHome: 'Carlos Alcaraz',
            teamAway: 'Jannik Sinner',
            scoreHome: 2,
            scoreAway: 2,
            minute: 88,
            status: 'live',
            odds: { home: 1.95, draw: 20.0, away: 1.85, over25: 1.60, under25: 2.20, btts: 1.95 }
        }
    ]
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    loadLocalStorage();
    initEventListeners();
    renderMatches();
    updateUI();

    // Iniciar simulación de cuotas en vivo cada 4 segundos
    setInterval(simulateLiveOddsAndClock, 4000);
});

// LOCAL STORAGE PERSISTENCE
function loadLocalStorage() {
    const savedBalance = localStorage.getItem('hades_balance');
    if (savedBalance !== null) STATE.balance = parseFloat(savedBalance);

    const savedBets = localStorage.getItem('hades_mybets');
    if (savedBets) STATE.myBets = JSON.parse(savedBets);
}

function saveLocalStorage() {
    localStorage.setItem('hades_balance', STATE.balance.toFixed(2));
    localStorage.setItem('hades_mybets', JSON.stringify(STATE.myBets));
}

// EVENT LISTENERS
function initEventListeners() {
    // Categorías de navegación
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            STATE.activeCategory = target.dataset.category;

            if (STATE.activeCategory === 'casino') {
                document.getElementById('matches-grid').classList.add('hidden');
                document.getElementById('casino-section').classList.remove('hidden');
            } else {
                document.getElementById('casino-section').classList.add('hidden');
                document.getElementById('matches-grid').classList.remove('hidden');
                renderMatches();
            }
        });
    });

    // Filtros de partidos (En Vivo / Próximos / Finalizados)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            STATE.activeFilter = e.currentTarget.dataset.filter;
            renderMatches();
        });
    });

    // Ligas en el sidebar
    document.querySelectorAll('.league-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.league-link').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderMatches();
        });
    });

    // Pestañas del Boleto / Mis Apuestas
    document.getElementById('tab-slip-betslip').addEventListener('click', () => {
        document.getElementById('tab-slip-betslip').classList.add('active');
        document.getElementById('tab-slip-mybets').classList.remove('active');
        document.getElementById('slip-content-betslip').classList.remove('hidden');
        document.getElementById('slip-content-mybets').classList.add('hidden');
    });

    document.getElementById('tab-slip-mybets').addEventListener('click', () => {
        document.getElementById('tab-slip-mybets').classList.add('active');
        document.getElementById('tab-slip-betslip').classList.remove('active');
        document.getElementById('slip-content-mybets').classList.remove('hidden');
        document.getElementById('slip-content-betslip').classList.add('hidden');
        renderMyBets();
    });

    // Toggle modo de apuesta (Simple / Parlay)
    document.getElementById('btn-mode-single').addEventListener('click', () => setBetMode('single'));
    document.getElementById('btn-mode-parlay').addEventListener('click', () => setBetMode('parlay'));

    // Botones rápidos de monto
    document.querySelectorAll('.btn-qs').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = document.getElementById('slip-stake-input');
            if (e.currentTarget.id === 'btn-qs-max') {
                input.value = Math.floor(STATE.balance);
            } else {
                input.value = e.currentTarget.dataset.amount;
            }
            updateSlipCalculator();
        });
    });

    document.getElementById('slip-stake-input').addEventListener('input', updateSlipCalculator);

    // Botón Colocar Apuesta
    document.getElementById('btn-place-bet').addEventListener('click', placeBet);

    // Recarga / Faucet Modal
    document.getElementById('btn-open-deposit').addEventListener('click', () => {
        document.getElementById('modal-deposit').classList.remove('hidden');
    });
    document.getElementById('btn-close-deposit').addEventListener('click', () => {
        document.getElementById('modal-deposit').classList.add('hidden');
    });
    document.getElementById('btn-claim-faucet').addEventListener('click', claimFaucet);

    // Controles de Operador
    document.getElementById('btn-simulate-minute').addEventListener('click', () => {
        STATE.matches.forEach(m => {
            if (m.status === 'live') {
                m.minute += 10;
                if (Math.random() > 0.5) m.scoreHome += 1;
            }
        });
        renderMatches();
        renderMyBets();
    });

    document.getElementById('btn-finish-matches').addEventListener('click', finishAllMatchesAndSettle);

    // Casino: Crash Game
    document.getElementById('btn-crash-bet').addEventListener('click', startCrashGame);
    document.getElementById('btn-crash-cashout').addEventListener('click', cashoutCrashGame);

    // Casino: Ruleta
    document.getElementById('btn-spin-roulette').addEventListener('click', spinRoulette);
    document.querySelectorAll('.btn-roulette').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-roulette').forEach(b => b.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
        });
    });
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
        grid.innerHTML = `<div class="empty-slip-state"><i class="fa-solid fa-calendar-xmark empty-icon"></i><p>No hay eventos disponibles en esta categoría</p></div>`;
        return;
    }

    filtered.forEach(m => {
        const isLive = m.status === 'live';
        const card = document.createElement('div');
        card.className = 'match-card';
        card.id = `card-${m.id}`;

        card.innerHTML = `
            <div class="match-card-header">
                <span class="match-league"><i class="fa-solid fa-trophy"></i> ${m.league}</span>
                <span class="match-time-badge">${isLive ? `Min ${m.minute}' 🟢` : (m.status === 'finished' ? 'FINALIZADO' : 'HOY 21:00')}</span>
            </div>
            <div class="match-body">
                <div class="teams-container">
                    <div class="team-row">
                        <span class="team-name"><i class="fa-solid fa-shield"></i> ${m.teamHome}</span>
                        <span class="team-score">${isLive || m.status === 'finished' ? m.scoreHome : '-'}</span>
                    </div>
                    <div class="team-row">
                        <span class="team-name"><i class="fa-solid fa-shield-halved"></i> ${m.teamAway}</span>
                        <span class="team-score">${isLive || m.status === 'finished' ? m.scoreAway : '-'}</span>
                    </div>
                </div>

                <div class="odds-group">
                    <button class="odds-btn ${isSelectionInSlip(m.id, '1') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', '1', '${m.teamHome}', ${m.odds.home})">
                        <span class="odds-label">1 (Local)</span>
                        <span class="odds-value" id="odd-${m.id}-home">${m.odds.home.toFixed(2)}</span>
                    </button>
                    <button class="odds-btn ${isSelectionInSlip(m.id, 'X') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', 'X', 'Empate', ${m.odds.draw})">
                        <span class="odds-label">X (Empate)</span>
                        <span class="odds-value" id="odd-${m.id}-draw">${m.odds.draw.toFixed(2)}</span>
                    </button>
                    <button class="odds-btn ${isSelectionInSlip(m.id, '2') ? 'selected' : ''}" onclick="toggleOdds('${m.id}', '2', '${m.teamAway}', ${m.odds.away})">
                        <span class="odds-label">2 (Visita)</span>
                        <span class="odds-value" id="odd-${m.id}-away">${m.odds.away.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// TOGGLE ODDS IN BET SLIP
window.toggleOdds = function(matchId, pickCode, pickName, oddValue) {
    const match = STATE.matches.find(m => m.id === matchId);
    if (!match) return;

    const existingIndex = STATE.betSlip.findIndex(item => item.matchId === matchId && item.pickCode === pickCode);

    if (existingIndex !== -1) {
        STATE.betSlip.splice(existingIndex, 1);
    } else {
        // Si es apuesta simple o parlay, reemplazar selecciones del mismo partido si existían
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
    document.getElementById('btn-mode-single').classList.toggle('active', mode === 'single');
    document.getElementById('btn-mode-parlay').classList.toggle('active', mode === 'parlay');
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
                <p>Tu boleto está vacío</p>
                <small>Haz clic en cualquier cuota para agregar una apuesta.</small>
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
                <span>Elección: <strong>${item.pickName}</strong></span>
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

    if (STATE.betSlip.length === 0) {
        totalOddsEl.textContent = '1.00';
        totalPayoutEl.textContent = '$0.00';
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
    totalPayoutEl.textContent = `$${potentialPayout.toFixed(2)}`;

    btnPlace.disabled = (stake <= 0 || stake > STATE.balance);
}

// PLACE BET
function placeBet() {
    const stakeInput = document.getElementById('slip-stake-input');
    const stake = parseFloat(stakeInput.value) || 0;

    if (stake <= 0 || stake > STATE.balance) {
        alert('❌ Saldo insuficiente o monto inválido.');
        return;
    }

    let totalOdds = 1;
    if (STATE.betMode === 'parlay') {
        totalOdds = STATE.betSlip.reduce((acc, item) => acc * item.odd, 1);
    } else {
        totalOdds = STATE.betSlip[0].odd;
    }

    const newBet = {
        id: 'BET-' + Math.floor(Math.random() * 900000 + 100000),
        timestamp: new Date().toLocaleString(),
        type: STATE.betMode,
        items: [...STATE.betSlip],
        stake,
        odds: totalOdds,
        potentialPayout: stake * totalOdds,
        status: 'ACCEPTED' // ACCEPTED | WON | LOST | CASHED_OUT
    };

    STATE.balance -= stake;
    STATE.myBets.unshift(newBet);
    STATE.betSlip = [];

    saveLocalStorage();
    updateUI();
    renderMatches();
    renderSlip();

    // Notificación
    alert(`🎉 ¡Apuesta colocada con éxito! Ticket #${newBet.id}`);
}

// RENDER MY BETS & CASHOUT
function renderMyBets() {
    const container = document.getElementById('mybets-list');
    document.getElementById('mybets-count').textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;
    document.getElementById('active-bets-count').textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;

    if (STATE.myBets.length === 0) {
        container.innerHTML = `<div class="empty-slip-state"><p>No tienes apuestas realizadas aún.</p></div>`;
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
                <span>Apostado: <strong>$${bet.stake.toFixed(2)}</strong></span>
                <span>Pago Potencial: <strong style="color:var(--accent-emerald)">$${bet.potentialPayout.toFixed(2)}</strong></span>
            </div>
            ${bet.status === 'ACCEPTED' ? `
                <button class="btn-cashout" onclick="cashoutBet('${bet.id}', ${cashoutValue})">
                    ⚡ CASH OUT AHORA ($${cashoutValue})
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
    STATE.balance += cashoutAmount;

    saveLocalStorage();
    updateUI();
    renderMyBets();

    alert(`💵 Cash Out exitoso. Retiraste $${cashoutAmount.toFixed(2)} antes de finalizar.`);
};

// FAUCET RECHARGE
function claimFaucet() {
    STATE.balance += 1000.00;
    saveLocalStorage();
    updateUI();
    document.getElementById('modal-deposit').classList.add('hidden');
    alert('💰 ¡Has recibido +$1,000.00 HDC virtuales gratis!');
}

// UPDATE GENERAL UI
function updateUI() {
    document.getElementById('user-balance').innerHTML = `$${STATE.balance.toFixed(2)} <small class="currency">HDC</small>`;
    document.getElementById('active-bets-count').textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;
}

// LIVE ODDS & CLOCK SIMULATION
function simulateLiveOddsAndClock() {
    STATE.matches.forEach(m => {
        if (m.status === 'live') {
            m.minute += 1;
            if (m.minute > 90) m.status = 'finished';

            // Variación leve de cuotas
            const delta = (Math.random() - 0.5) * 0.1;
            m.odds.home = Math.max(1.10, m.odds.home + delta);
            m.odds.away = Math.max(1.10, m.odds.away - delta);
        }
    });

    if (STATE.activeCategory !== 'casino') {
        renderMatches();
    }
}

// FINISH MATCHES AND SETTLE BETS
function finishAllMatchesAndSettle() {
    STATE.matches.forEach(m => {
        m.status = 'finished';
    });

    STATE.myBets.forEach(bet => {
        if (bet.status === 'ACCEPTED') {
            // Simular ganada o perdida 60/40
            const won = Math.random() > 0.4;
            if (won) {
                bet.status = 'WON';
                STATE.balance += bet.potentialPayout;
            } else {
                bet.status = 'LOST';
            }
        }
    });

    saveLocalStorage();
    updateUI();
    renderMatches();
    renderMyBets();

    alert('🏁 Todos los partidos han finalizado. Las apuestas fueron liquidadas.');
}

// CASINO: CRASH GAME
function startCrashGame() {
    const stakeInput = document.getElementById('crash-stake');
    const stake = parseFloat(stakeInput.value) || 0;

    if (stake <= 0 || stake > STATE.balance) {
        alert('❌ Saldo insuficiente para el Crash.');
        return;
    }

    STATE.balance -= stake;
    updateUI();

    STATE.crashGame.running = true;
    STATE.crashGame.crashed = false;
    STATE.crashGame.multiplier = 1.00;
    STATE.crashGame.betAmount = stake;
    STATE.crashGame.userCashedOut = false;

    document.getElementById('btn-crash-bet').classList.add('hidden');
    document.getElementById('btn-crash-cashout').classList.remove('hidden');

    const crashLimit = (1 + Math.random() * 8).toFixed(2); // Punto de crash entre 1.0x y 9.0x

    STATE.crashGame.intervalId = setInterval(() => {
        STATE.crashGame.multiplier += 0.05;
        const current = STATE.crashGame.multiplier.toFixed(2);
        document.getElementById('crash-multiplier').textContent = `${current}x`;
        document.getElementById('crash-fill').style.width = `${Math.min(100, current * 10)}%`;

        if (parseFloat(current) >= parseFloat(crashLimit)) {
            // CRASHED!
            clearInterval(STATE.crashGame.intervalId);
            STATE.crashGame.crashed = true;
            STATE.crashGame.running = false;
            document.getElementById('crash-status').textContent = `💥 ¡CRASH en ${current}x!`;
            document.getElementById('crash-status').style.color = 'var(--danger-red)';

            document.getElementById('btn-crash-bet').classList.remove('hidden');
            document.getElementById('btn-crash-cashout').classList.add('hidden');
        }
    }, 100);
}

function cashoutCrashGame() {
    if (!STATE.crashGame.running || STATE.crashGame.userCashedOut) return;

    STATE.crashGame.userCashedOut = true;
    clearInterval(STATE.crashGame.intervalId);

    const winAmount = STATE.crashGame.betAmount * STATE.crashGame.multiplier;
    STATE.balance += winAmount;

    saveLocalStorage();
    updateUI();

    document.getElementById('crash-status').textContent = `🎉 Retirado a ${STATE.crashGame.multiplier.toFixed(2)}x (+$${winAmount.toFixed(2)})`;
    document.getElementById('crash-status').style.color = 'var(--accent-emerald)';

    document.getElementById('btn-crash-bet').classList.remove('hidden');
    document.getElementById('btn-crash-cashout').classList.add('hidden');
}

// CASINO: RULETA
function spinRoulette() {
    const selectedBtn = document.querySelector('.btn-roulette.selected');
    if (!selectedBtn) {
        alert('Por favor selecciona una opción (Rojo, Negro o Verde)');
        return;
    }

    const choice = selectedBtn.dataset.choice;
    const stake = parseFloat(document.getElementById('roulette-stake').value) || 0;

    if (stake <= 0 || stake > STATE.balance) {
        alert('❌ Saldo insuficiente.');
        return;
    }

    STATE.balance -= stake;
    updateUI();

    const rouletteDisplay = document.getElementById('roulette-result-display');
    rouletteDisplay.textContent = '🎰';

    setTimeout(() => {
        const num = Math.floor(Math.random() * 37); // 0 al 36
        rouletteDisplay.textContent = num;

        let isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
        let win = false;
        let payoutMultiplier = 2;

        if (choice === 'red' && isRed) win = true;
        if (choice === 'black' && !isRed && num !== 0) win = true;
        if (choice === 'zero' && num === 0) { win = true; payoutMultiplier = 35; }

        if (win) {
            const winAmount = stake * payoutMultiplier;
            STATE.balance += winAmount;
            alert(`🎉 ¡Ganaste $${winAmount.toFixed(2)} HDC en la Ruleta! Número: ${num}`);
        } else {
            alert(`❌ Cayó en ${num}. No acertaste esta vez.`);
        }

        saveLocalStorage();
        updateUI();
    }, 1500);
}
