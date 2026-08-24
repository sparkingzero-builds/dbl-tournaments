const ShopSearch = (function() {
  'use strict';

  const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ultimate'];

  const SEARCH_CATEGORIES = {
    all: 'all',
    cosmetics: ['flair_border', 'flair_title', 'profile_bg', 'badge', 'alt_art'],
    effects: ['aura', 'golden_name', 'hype_bomb'],
    social: ['victory_quote', 'kings_commentary']
  };

  let _state = {
    query: '',
    category: 'all',
    sort: 'rarity-desc'
  };

  let _onFilterChange = null;
  let _debounceTimer = null;

  function onFilterChange(cb) {
    _onFilterChange = cb;
  }

  function _notify() {
    if (typeof _onFilterChange === 'function') _onFilterChange();
  }

  function _debounce(fn, ms) {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(fn, ms);
  }

  function _getRarityIndex(item) {
    var rarity = typeof getRarity === 'function' ? getRarity(item) : 'common';
    var idx = RARITY_ORDER.indexOf(rarity);
    return idx === -1 ? 0 : idx;
  }

  function _tagItems(items) {
    var now = Date.now();
    var sevenDays = 7 * 24 * 60 * 60 * 1000;

    items.forEach(function(item) {
      // New tag
      if (item.created_at) {
        var created = new Date(item.created_at).getTime();
        item._isNew = (now - created) < sevenDays;
      } else {
        item._isNew = false;
      }

      // Limited tag
      var meta = item.metadata || {};
      if (meta.limited === true) {
        item._isLimited = true;
        item._limitedCountdown = null;
      } else if (meta.expires_at) {
        var expires = new Date(meta.expires_at).getTime();
        if (expires > now) {
          item._isLimited = true;
          item._limitedCountdown = expires - now;
        } else {
          item._isLimited = false;
          item._limitedCountdown = null;
        }
      } else {
        item._isLimited = false;
        item._limitedCountdown = null;
      }
    });
  }

  function _matchesCategory(item) {
    if (_state.category === 'all') return true;
    var types = SEARCH_CATEGORIES[_state.category];
    if (!types) return true;
    return types.indexOf(item.type) !== -1;
  }

  function _matchesSearch(item) {
    var q = _state.query.toLowerCase().trim();
    if (!q) return true;

    var name = (item.name || '').toLowerCase();
    var desc = (item.description || '').toLowerCase();
    var typeLabels = (typeof TYPE_LABELS !== 'undefined') ? TYPE_LABELS : {};
    var typeLabel = (typeLabels[item.type] || item.type || '').toLowerCase();

    return name.indexOf(q) !== -1 || typeLabel.indexOf(q) !== -1 || desc.indexOf(q) !== -1;
  }

  function _sortItems(items) {
    var sorted = items.slice();
    switch (_state.sort) {
      case 'price-asc':
        sorted.sort(function(a, b) { return (a.cost || 0) - (b.cost || 0); });
        break;
      case 'price-desc':
        sorted.sort(function(a, b) { return (b.cost || 0) - (a.cost || 0); });
        break;
      case 'rarity-asc':
        sorted.sort(function(a, b) { return _getRarityIndex(a) - _getRarityIndex(b); });
        break;
      case 'rarity-desc':
        sorted.sort(function(a, b) { return _getRarityIndex(b) - _getRarityIndex(a); });
        break;
      case 'name-asc':
        sorted.sort(function(a, b) { return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()); });
        break;
      case 'newest':
        sorted.sort(function(a, b) {
          var aVal = a.created_at ? new Date(a.created_at).getTime() : (a.id || 0);
          var bVal = b.created_at ? new Date(b.created_at).getTime() : (b.id || 0);
          return bVal - aVal;
        });
        break;
      default:
        sorted.sort(function(a, b) { return _getRarityIndex(b) - _getRarityIndex(a); });
    }
    return sorted;
  }

  function _countCategories(items) {
    var counts = { all: items.length, cosmetics: 0, effects: 0, social: 0 };
    items.forEach(function(item) {
      Object.keys(SEARCH_CATEGORIES).forEach(function(cat) {
        if (cat === 'all') return;
        var types = SEARCH_CATEGORIES[cat];
        if (types.indexOf(item.type) !== -1) counts[cat]++;
      });
    });
    return counts;
  }

  function apply(items) {
    _tagItems(items);

    var categoryCount = _countCategories(items);

    var filtered = items.filter(_matchesCategory);
    filtered = filtered.filter(_matchesSearch);
    filtered = _sortItems(filtered);

    return {
      items: filtered,
      total: items.length,
      filtered: filtered.length,
      categoryCount: categoryCount
    };
  }

  function getState() {
    return {
      query: _state.query,
      category: _state.category,
      sort: _state.sort
    };
  }

  function init() {
    var searchInput = document.getElementById('shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var val = searchInput.value;
        _debounce(function() {
          _state.query = val;
          _notify();
        }, 300);
      });
    }

    var sortSelect = document.getElementById('shop-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function() {
        _state.sort = sortSelect.value;
        _notify();
      });
    }

    var categoryTabs = document.querySelectorAll('.shop-category-tab');
    categoryTabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        _state.category = tab.getAttribute('data-category') || 'all';
        categoryTabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        _notify();
      });
    });
  }

  return {
    init: init,
    apply: apply,
    getState: getState,
    onFilterChange: onFilterChange
  };
})();
