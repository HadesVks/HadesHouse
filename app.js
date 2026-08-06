/**
 * HADES HOUSE RD 🇩🇴 — LA BANCA DOMINICANA DE APUESTAS & CASINO VIRTUAL
 * Lógica en Vanilla JS Modular con Persistencia en LocalStorage (Moneda: RD$)
 */

// STATE MANAGEMENT
const STATE = {
    balance: 25000.00, // RD$
    betSlip: [],
    betMode: 'single', // 'single' | 'parlay'
    myBets: [],
    activeFilter: 'live', // 'all' | 'live' | 'upcoming' | 'finished'
    activeCategory: 'all', // 'all' | 'lidom' | 'mlb' | 'basketball' | 'ldf' | 'banca' | 'gallos'
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
            minute: 6, // 6to Inning
            status: 'live',
            odds: { home: 1.95, draw: 14.0, away: 1.85 }
        },
        {
            id: 'm3',
            league: 'Grandes Ligas (MLB)',
            category: 'mlb',
            teamHome: 'NY Yankees (Soto 🇩🇴)',
            teamAway: 'Boston Red Sox (Devers 🇩🇴)',
            scoreHome: 5,
            scoreAway: 4,
            minute: 7,
            status: 'live',
            odds: { home: 1.65, draw: 15.0, away: 2.30 }
        },
        {
            id: 'm4',
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
            id: 'm5',
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
            id: 'm6',
            league: 'LIDOM (Próximo Juego)',
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
    loadLocalStorage();
    initEventListeners();
    renderMatches();
    updateUI();

    // Iniciar simulación de cuotas en vivo cada 4 segundos
    setInterval(simulateLiveOddsAndClock, 4000);
});

// LOCAL STORAGE PERSISTENCE
function loadLocalStorage() {
    const savedBalance = localStorage.getItem('hades_rd_balance');
    if (savedBalance !== null) STATE.balance = parseFloat(savedBalance);

    const savedBets = localStorage.getItem('hades_rd_mybets');
    if (savedBets) STATE.myBets = JSON.parse(savedBets);
}

function saveLocalStorage() {
    localStorage.setItem('hades_rd_balance', STATE.balance.toFixed(2));
    localStorage.setItem('hades_rd_mybets', JSON.stringify(STATE.myBets));
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

    // Pestañas del Ticket / Mis Jugadas
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

    // Botones rápidos de monto RD$
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

    // Botón Sellar Ticket en la Banca
    document.getElementById('btn-place-bet').addEventListener('click', placeBet);

    // Recarga / Fiao Modal
    document.getElementById('btn-open-deposit').addEventListener('click', () => {
        document.getElementById('modal-deposit').classList.remove('hidden');
    });
    document.getElementById('btn-close-deposit').addEventListener('click', () => {
        document.getElementById('modal-deposit').classList.add('hidden');
    });
    document.getElementById('btn-claim-faucet').addEventListener('click', claimFaucet);

    // Controles de Banquero
    document.getElementById('btn-simulate-minute').addEventListener('click', () => {
        STATE.matches.forEach(m => {
            if (m.status === 'live') {
                m.minute += 1;
                if (Math.random() > 0.5) m.scoreHome += 1;
            }
        });
        renderMatches();
        renderMyBets();
    });

    document.getElementById('btn-finish-matches').addEventListener('click', finishAllMatchesAndSettle);

    // Banca: El Palé RD
    document.getElementById('btn-play-pale').addEventListener('click', playPale);

    // Gallos Virtuales
    document.getElementById('btn-spin-gallo').addEventListener('click', playGallos);
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
        grid.innerHTML = `<div class="empty-slip-state"><i class="fa-solid fa-baseball-bat-ball empty-icon"></i><p>No hay jugadas disponibles en esta liga ahora mismo manín.</p></div>`;
        return;
    }

    filtered.forEach(m => {
        const isLive = m.status === 'live';
        const card = document.createElement('div');
        card.className = 'match-card';
        card.id = `card-${m.id}`;

        const timeText = isLive 
            ? (m.category === 'lidom' || m.category === 'mlb' ? `${m.minute}º Inning ⚾` : `Min ${m.minute}' 🟢`)
            : (m.status === 'finished' ? 'FINALIZADO 🏁' : 'HOY 7:35 PM');

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

// TOGGLE ODDS IN BET SLIP
window.toggleOdds = function(matchId, pickCode, pickName, oddValue) {
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
                <p>Tu ticket está limpio manín</p>
                <small>Tócale a cualquier cuota para armar tu jugada.</small>
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
                <span>Jugada: <strong>${item.pickName}</strong></span>
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

    btnPlace.disabled = (stake <= 0 || stake > STATE.balance);
}

// PLACE BET IN BANCA
function placeBet() {
    const stakeInput = document.getElementById('slip-stake-input');
    const stake = parseFloat(stakeInput.value) || 0;

    if (stake <= 0 || stake > STATE.balance) {
        alert('❌ No tienes ese dinero en la banca. Pide un fiao.');
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

    STATE.balance -= stake;
    STATE.myBets.unshift(newBet);
    STATE.betSlip = [];

    saveLocalStorage();
    updateUI();
    renderMatches();
    renderSlip();

    alert(`🇩🇴 ¡Ticket Sellado en la Banca! N° ${newBet.id}`);
}

// RENDER MY BETS & CASH OUT
function renderMyBets() {
    const container = document.getElementById('mybets-list');
    document.getElementById('mybets-count').textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;
    document.getElementById('active-bets-count').textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;

    if (STATE.myBets.length === 0) {
        container.innerHTML = `<div class="empty-slip-state"><p>No tienes tickets sellados aún.</p></div>`;
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
                <span>Apostado: <strong>RD$${bet.stake.toFixed(2)}</strong></span>
                <span>Premio: <strong style="color:var(--accent-emerald)">RD$${bet.potentialPayout.toFixed(2)}</strong></span>
            </div>
            ${bet.status === 'ACCEPTED' ? `
                <button class="btn-cashout" onclick="cashoutBet('${bet.id}', ${cashoutValue})">
                    ⚡ CASH OUT AHORA (Cobrar RD$${cashoutValue})
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
    STATE.balance += parseFloat(cashoutAmount);

    saveLocalStorage();
    updateUI();
    renderMyBets();

    alert(`💵 Le vendiste el ticket a la Banca por RD$${cashoutAmount}. ¡Cobrado!`);
};

// FAUCET FIAO
function claimFaucet() {
    STATE.balance += 5000.00;
    saveLocalStorage();
    updateUI();
    document.getElementById('modal-deposit').classList.add('hidden');
    alert('💰 ¡El Banquero te acreditó RD$5,000.00 de Fiao gratis!');
}

// UPDATE GENERAL UI
function updateUI() {
    document.getElementById('user-balance').innerHTML = `RD$ ${STATE.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
    document.getElementById('active-bets-count').textContent = STATE.myBets.filter(b => b.status === 'ACCEPTED').length;
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

    STATE.myBets.forEach(bet => {
        if (bet.status === 'ACCEPTED') {
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

    alert('🏁 ¡Cantaron el 9no Inning! Todos los partidos concluyeron y se pagaron los tickets.');
}

// BANCA: PLAY PALÉ
function playPale() {
    const num1 = parseInt(document.getElementById('num-1').value);
    const num2 = parseInt(document.getElementById('num-2').value);
    const stake = parseFloat(document.getElementById('pale-stake').value) || 0;

    if (isNaN(num1) || isNaN(num2) || stake <= 0) {
        alert('Escribe tus 2 números del 00 al 99.');
        return;
    }

    if (stake > STATE.balance) {
        alert('❌ Saldo insuficiente.');
        return;
    }

    STATE.balance -= stake;
    updateUI();

    const n1 = Math.floor(Math.random() * 100);
    const n2 = Math.floor(Math.random() * 100);

    const isHit = (num1 === n1 && num2 === n2) || (num1 === n2 && num2 === n1);

    if (isHit) {
        const win = stake * 100;
        STATE.balance += win;
        alert(`🎉 ¡¡¡PEGASTE EL PALÉ!!! Salieron ${n1} - ${n2}. Ganaste RD$${win.toFixed(2)}`);
    } else {
        alert(`🎰 Salieron el ${n1} y el ${n2}. Sigue intentando en el próximo sorteo.`);
    }

    saveLocalStorage();
    updateUI();
}

// GALLERA VIRTUAL
function playGallos() {
    const selected = document.querySelector('.btn-roulette.selected');
    if (!selected) {
        alert('Selecciona tu gallo (Indio o Giro).');
        return;
    }

    const choice = selected.dataset.choice;
    const stake = parseFloat(document.getElementById('gallo-stake').value) || 0;

    if (stake <= 0 || stake > STATE.balance) {
        alert('❌ Saldo insuficiente para la Gallera.');
        return;
    }

    STATE.balance -= stake;
    updateUI();

    alert('🐓 ¡Soltaron los gallos en el redondel! La pelea está picante...');

    setTimeout(() => {
        const winner = Math.random() > 0.5 ? 'indio' : 'giro';
        if (choice === winner) {
            const win = stake * (winner === 'indio' ? 1.95 : 1.85);
            STATE.balance += win;
            alert(`🏆 ¡Ganó el Gallo ${winner.toUpperCase()}! Cobraste RD$${win.toFixed(2)}`);
        } else {
            alert(`❌ Tu gallo no pudo en esta pelea. Ganó el Gallo ${winner.toUpperCase()}.`);
        }

        saveLocalStorage();
        updateUI();
    }, 1500);
}
