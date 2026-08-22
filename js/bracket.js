const BracketManager = (() => {
  function nextPowerOf2(n) {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  function generateSeeding(size) {
    if (size === 1) return [0];
    const half = generateSeeding(size / 2);
    return half.reduce((acc, seed) => {
      acc.push(seed);
      acc.push(size - 1 - seed);
      return acc;
    }, []);
  }

  function generateBracket(players, tournamentId) {
    const n = players.length;
    const bracketSize = nextPowerOf2(n);
    const totalRounds = Math.log2(bracketSize);
    const seeding = generateSeeding(bracketSize);

    const seededPlayers = [];
    for (let i = 0; i < bracketSize; i++) {
      const seedIndex = seeding[i];
      seededPlayers[i] = seedIndex < n ? players[seedIndex] : null;
    }

    const matches = [];
    let matchNum = 1;

    // Round 1
    for (let i = 0; i < bracketSize; i += 2) {
      const p1 = seededPlayers[i];
      const p2 = seededPlayers[i + 1];

      const match = {
        tournament_id: tournamentId,
        round: 1,
        match_number: matchNum++,
        player1_id: p1 ? p1.id : null,
        player2_id: p2 ? p2.id : null,
        winner_id: null,
        score: null
      };

      // Auto-advance BYEs
      if (!p1 && p2) match.winner_id = p2.id;
      if (p1 && !p2) match.winner_id = p1.id;

      matches.push(match);
    }

    // Subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let m = 1; m <= matchesInRound; m++) {
        matches.push({
          tournament_id: tournamentId,
          round: round,
          match_number: m,
          player1_id: null,
          player2_id: null,
          winner_id: null,
          score: null
        });
      }
    }

    return matches;
  }

  function propagateWinner(matches, completedMatch) {
    const nextRound = completedMatch.round + 1;
    const nextMatchNum = Math.ceil(completedMatch.match_number / 2);
    const isTopSlot = completedMatch.match_number % 2 === 1;

    const nextMatch = matches.find(
      m => m.round === nextRound && m.match_number === nextMatchNum
    );

    if (!nextMatch) return null;

    return {
      id: nextMatch.id,
      [isTopSlot ? 'player1_id' : 'player2_id']: completedMatch.winner_id
    };
  }

  function getRoundName(round, totalRounds) {
    const remaining = totalRounds - round;
    if (remaining === 0) return 'Finals';
    if (remaining === 1) return 'Semi-Finals';
    if (remaining === 2) return 'Quarter-Finals';
    return `Round ${round}`;
  }

  function getProfileBase() {
    return window.location.pathname.includes('/admin') ? '../' : '';
  }

  function renderBracket(container, matches, signups, options = {}) {
    container.innerHTML = '';

    if (!matches.length) {
      container.innerHTML = '<div class="empty-state"><h3>No bracket yet</h3><p>Bracket will appear once the tournament starts</p></div>';
      return;
    }

    const totalRounds = Math.max(...matches.map(m => m.round));
    const signupMap = {};
    signups.forEach(s => { signupMap[s.id] = s; });

    const bracket = document.createElement('div');
    bracket.className = 'bracket';

    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matches
        .filter(m => m.round === round)
        .sort((a, b) => a.match_number - b.match_number);

      const roundEl = document.createElement('div');
      roundEl.className = 'bracket-round';

      const header = document.createElement('div');
      header.className = 'round-header';
      header.textContent = getRoundName(round, totalRounds);
      roundEl.appendChild(header);

      // Calculate spacing for alignment
      const spacingMultiplier = Math.pow(2, round - 1);
      const marginTop = round === 1 ? 0 : (spacingMultiplier - 1) * 30;

      roundMatches.forEach((match, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'match-wrapper';
        if (idx === 0) wrapper.style.marginTop = marginTop + 'px';
        if (round > 1) wrapper.style.marginBottom = (spacingMultiplier - 1) * 60 + 'px';

        const card = document.createElement('div');
        card.className = 'match-card';
        if (round === totalRounds) card.classList.add('final');
        if (options.admin && match.player1_id && match.player2_id) {
          card.classList.add('clickable');
        }

        const renderPlayer = (playerId, isWinner, isLoser) => {
          const div = document.createElement('div');
          div.className = 'match-player';
          if (!playerId) {
            div.classList.add('bye');
            div.innerHTML = '<span class="player-match-name">BYE</span>';
          } else {
            const player = signupMap[playerId];
            const name = player?.discord_username || 'TBD';
            if (isWinner) div.classList.add('winner');
            if (isLoser) div.classList.add('loser');

            let teamHtml = '';
            if (options.teamsVisible && player?.team) {
              const bannedSet = options.bannedCharIds || new Set();
              teamHtml = `<div class="match-team-icons">
                ${player.team.map(c => {
                  const isBanned = bannedSet.has(String(c.id));
                  return `<img src="${c.image}" alt="${c.name}" title="${c.name}${isBanned ? ' (BANNED)' : ''}" style="${isBanned ? 'opacity:0.2;filter:grayscale(1);border-color:var(--pink);' : ''}" onerror="this.style.display='none'" />`;
                }).join('')}
              </div>`;
            }

            const nameHtml = player ? `<a href="${getProfileBase()}profile.html?player=${encodeURIComponent(name)}" class="player-match-name" onclick="event.stopPropagation()">${name}</a>` : `<span class="player-match-name">${name}</span>`;
            div.innerHTML = `
              ${nameHtml}
              ${teamHtml}
              ${match.score && isWinner ? `<span class="match-score">${match.score}</span>` : ''}
            `;

            if (options.admin && card.classList.contains('clickable')) {
              div.addEventListener('click', () => {
                options.onSelectWinner?.(match, playerId);
              });
            }
          }
          return div;
        };

        const hasWinner = !!match.winner_id;
        card.appendChild(renderPlayer(
          match.player1_id,
          hasWinner && match.winner_id === match.player1_id,
          hasWinner && match.winner_id !== match.player1_id
        ));
        card.appendChild(renderPlayer(
          match.player2_id,
          hasWinner && match.winner_id === match.player2_id,
          hasWinner && match.winner_id !== match.player2_id
        ));

        wrapper.appendChild(card);
        roundEl.appendChild(wrapper);
      });

      bracket.appendChild(roundEl);
    }

    // Champion display
    const finalMatch = matches.find(m => m.round === totalRounds);
    if (finalMatch?.winner_id) {
      const champ = signupMap[finalMatch.winner_id];
      const champEl = document.createElement('div');
      champEl.className = 'champion-card float-in';
      champEl.innerHTML = `
        <div class="champion-label">Champion</div>
        <div class="champion-name">${champ ? `<a href="${getProfileBase()}profile.html?player=${encodeURIComponent(champ.discord_username)}">${champ.discord_username}</a>` : 'Unknown'}</div>
      `;
      bracket.appendChild(champEl);
    }

    container.appendChild(bracket);

    // Dramatic reveal animation
    const rounds = bracket.querySelectorAll('.bracket-round');
    rounds.forEach((round, ri) => {
      round.classList.add('bracket-round-hidden');
      const cards = round.querySelectorAll('.match-card');
      cards.forEach(card => card.classList.add('match-card-hidden'));

      setTimeout(() => {
        round.classList.remove('bracket-round-hidden');
        round.classList.add('bracket-round-reveal');
        try { playSound('reveal'); } catch (e) {}

        cards.forEach((card, ci) => {
          setTimeout(() => {
            card.classList.remove('match-card-hidden');
            card.classList.add('match-card-reveal');
          }, 100 * (ci + 1));
        });
      }, 300 * ri);
    });

    // Champion confetti + sound
    if (finalMatch?.winner_id) {
      const totalDelay = 300 * rounds.length + 200;
      setTimeout(() => {
        try { playSound('winner'); } catch (e) {}
        try { ConfettiFX.fire(); } catch (e) {}
      }, totalDelay);
    }
  }

  return { generateBracket, propagateWinner, renderBracket, getRoundName };
})();
