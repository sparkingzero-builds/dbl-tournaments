const CharacterManager = (() => {
  let allCharacters = [];
  let filteredCharacters = [];
  let selectedTeam = [];
  let maxTeamSize = 3;
  let allowedIds = null;
  let onTeamChange = null;

  async function load() {
    const base = window.location.pathname.includes('/admin') ? '../' : '';
    const res = await fetch(base + 'data/characters.json');
    allCharacters = await res.json();
    filteredCharacters = [...allCharacters];
    return allCharacters;
  }

  function setAllowed(ids) {
    allowedIds = ids ? new Set(ids) : null;
  }

  function filter({ search = '', element = '', rarity = '' } = {}) {
    filteredCharacters = allCharacters.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (element && c.element !== element) return false;
      if (rarity && c.rarity !== rarity) return false;
      return true;
    });
    return filteredCharacters;
  }

  function isAllowed(char) {
    if (!allowedIds) return true;
    return allowedIds.has(char.id);
  }

  function isSelected(char) {
    return selectedTeam.some(c => c.id === char.id);
  }

  function toggleSelect(char) {
    if (isSelected(char)) {
      selectedTeam = selectedTeam.filter(c => c.id !== char.id);
    } else if (selectedTeam.length < maxTeamSize) {
      selectedTeam.push(char);
    }
    onTeamChange?.(selectedTeam);
    return selectedTeam;
  }

  function removeFromTeam(index) {
    selectedTeam.splice(index, 1);
    onTeamChange?.(selectedTeam);
    return selectedTeam;
  }

  function clearTeam() {
    selectedTeam = [];
    onTeamChange?.(selectedTeam);
  }

  function getTeam() {
    return [...selectedTeam];
  }

  function setTeamChangeHandler(fn) {
    onTeamChange = fn;
  }

  const elementColors = {
    RED: 'var(--el-red)', BLU: 'var(--el-blu)', GRN: 'var(--el-grn)',
    YEL: 'var(--el-yel)', PUR: 'var(--el-pur)', LGT: 'var(--el-lgt)'
  };

  const fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23161d2e' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%238fa0c4' font-size='12'%3E%3F%3C/text%3E%3C/svg%3E";

  function renderGrid(container, { selectable = false, onSelect = null } = {}) {
    container.innerHTML = '';
    const frag = document.createDocumentFragment();

    filteredCharacters.forEach(char => {
      const card = document.createElement('div');
      card.className = 'char-card';
      if (selectable && !isAllowed(char)) card.classList.add('disabled');
      if (selectable && isSelected(char)) card.classList.add('selected');

      const rarityClass = (char.rarity || '').toLowerCase();

      card.innerHTML = `
        <div class="char-card__art">
          <img src="${char.image}" alt="${char.name}" loading="lazy" onerror="this.src='${fallbackImg}'" />
          <div class="char-card__element" style="background:${elementColors[char.element] || '#666'}"></div>
          <span class="char-card__rarity badge-${rarityClass}">${char.rarity}</span>
        </div>
        <div class="char-card__body">
          <div class="char-card__name">${char.name}</div>
        </div>
      `;

      if (selectable) {
        card.addEventListener('click', () => {
          if (!isAllowed(char)) return;
          toggleSelect(char);
          onSelect?.(char, selectedTeam);
          renderGrid(container, { selectable, onSelect });
        });
      }

      frag.appendChild(card);
    });

    container.appendChild(frag);
  }

  function renderTeamSlots(container) {
    container.innerHTML = '';
    for (let i = 0; i < maxTeamSize; i++) {
      const slot = document.createElement('div');
      slot.className = 'team-slot' + (selectedTeam[i] ? ' filled' : '');

      if (selectedTeam[i]) {
        const char = selectedTeam[i];
        slot.innerHTML = `
          <div class="team-slot__ring">
            <img src="${char.image}" alt="${char.name}" onerror="this.style.display='none'" />
          </div>
          <div class="team-slot__label">${char.name.substring(0, 18)}</div>
          <button class="remove-btn" data-index="${i}">&times;</button>
        `;
        slot.querySelector('.remove-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          removeFromTeam(parseInt(e.target.dataset.index));
          renderTeamSlots(container);
        });
      } else {
        slot.innerHTML = `
          <div class="team-slot__ring">
            <span style="color:var(--line);font-size:18px;">+</span>
          </div>
          <div class="team-slot__empty">Slot ${i + 1}</div>
        `;
      }

      container.appendChild(slot);
    }
  }

  function renderFilterBar(container, gridContainer, options = {}) {
    container.innerHTML = `
      <input type="search" placeholder="Search characters..." id="char-search" />
      <div class="element-filters">
        <button class="element-btn active" data-element="">ALL</button>
        <button class="element-btn" data-element="RED">R</button>
        <button class="element-btn" data-element="BLU">B</button>
        <button class="element-btn" data-element="GRN">G</button>
        <button class="element-btn" data-element="YEL">Y</button>
        <button class="element-btn" data-element="PUR">P</button>
        <button class="element-btn" data-element="LGT">L</button>
      </div>
      <select class="rarity-select" id="rarity-filter">
        <option value="">All Rarities</option>
        <option value="LEGEND">Legend</option>
        <option value="ULTRA">Ultra</option>
        <option value="SPARKING">Sparking</option>
        <option value="EXTREME">Extreme</option>
        <option value="HERO">Hero</option>
      </select>
      <span class="char-count" id="char-count"></span>
    `;

    const searchInput = container.querySelector('#char-search');
    const raritySelect = container.querySelector('#rarity-filter');
    const countEl = container.querySelector('#char-count');

    function applyFilters() {
      const chars = filter({
        search: searchInput.value,
        element: container.querySelector('.element-btn.active')?.dataset.element || '',
        rarity: raritySelect.value
      });
      renderGrid(gridContainer, options);
      countEl.textContent = `${chars.length} / ${allCharacters.length}`;
    }

    searchInput.addEventListener('input', applyFilters);
    raritySelect.addEventListener('change', applyFilters);

    container.querySelectorAll('.element-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.element-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });

    applyFilters();
  }

  return {
    load, filter, setAllowed, toggleSelect, removeFromTeam, clearTeam,
    getTeam, setTeamChangeHandler, isAllowed, isSelected,
    renderGrid, renderTeamSlots, renderFilterBar,
    getAll: () => allCharacters,
    getFiltered: () => filteredCharacters
  };
})();
