/**
 * ShopRenderer — Rendering engine for the shop page.
 * Depends on: ShopCore, ShopAssets, ShopSearch, ShopModal (for open), TitleManager (for titles tab)
 */
const ShopRenderer = (function () {
  'use strict';

  var esc = ShopAssets.esc;

  // ── Helpers ────────────────────────────────────────────────

  function _sectionHeader(title, gradientStyle) {
    var style = gradientStyle
      ? ' style="' + gradientStyle + '"'
      : '';
    return '<div class="shop-section-header"><h2' + style + '>' + title + '</h2></div>';
  }

  function _emptyState(message) {
    return '<div class="empty-state">' + esc(message) + '</div>';
  }

  // ── renderCard ─────────────────────────────────────────────

  function renderCard(item, index, featured) {
    var rarity = ShopCore.getRarity(item);
    var owned = ShopCore.state.ownedIds.has(item.id);
    var canBuy = !owned && ShopCore.state.balance >= item.cost;
    var badge = owned
      ? '<div class="card-badge" style="background:var(--green);box-shadow:0 0 10px rgba(46,213,115,0.4);">OWNED</div>'
      : ShopCore.getBadge(item);
    var typeLabel = ShopCore.TYPE_LABELS[item.type] || item.type;

    var btnClass = 'btn-get';
    var btnText = 'LOCKED';
    var btnDisabled = true;
    if (owned) { btnClass += ' owned'; btnText = 'OWNED'; }
    else if (canBuy) { btnDisabled = false; btnText = 'GET'; }

    var bgEffect = (rarity === 'legendary' || rarity === 'mythic' || rarity === 'ultimate')
      ? 'aura-effect' : 'shimmer-effect';

    var escapedName = esc(item.name || '');

    return '<div class="item-card ' + (featured ? 'featured-card ' : '') + (owned ? 'owned-card ' : '') + '"'
      + ' data-rarity="' + rarity + '"'
      + ' data-id="' + esc(item.id) + '"'
      + ' style="--i: ' + index + '"'
      + ' onclick="ShopModal.open(\'' + esc(item.id) + '\')">'
      + badge
      + '<div class="card-visual">'
        + '<div class="card-bg-effect ' + bgEffect + '"></div>'
        + '<div class="card-icon">' + ShopAssets.makeVisual(item, featured ? 100 : 80) + '</div>'
      + '</div>'
      + '<div class="card-info">'
        + '<div class="card-name">' + escapedName + '</div>'
        + '<div class="card-type">' + esc(typeLabel) + '</div>'
      + '</div>'
      + '<div class="card-price-bar">'
        + '<div class="card-price">'
          + (item.cost > 0
            ? '<div class="price-coin"></div><span class="price-value">' + item.cost.toLocaleString() + '</span>'
            : '<span class="price-value free">FREE</span>')
        + '</div>'
        + '<button class="' + btnClass + '"'
          + (btnDisabled ? ' disabled' : '')
          + ' onclick="event.stopPropagation();ShopCore.buyItem(\'' + esc(item.id) + '\',' + item.cost + ',\'' + escapedName.replace(/'/g, "\\'") + '\')">'
          + btnText
        + '</button>'
      + '</div>'
    + '</div>';
  }

  // ── render (main shop tab) ─────────────────────────────────

  function render() {
    var container = document.getElementById('shop-items-container');
    if (!container) return;

    var items = ShopCore.state.items;
    if (!items || !items.length) {
      container.innerHTML = _emptyState('No items available right now. Check back soon!');
      _updateCategoryTabs(null);
      return;
    }

    var result = ShopSearch.apply(items);
    var filtered = result.items;

    _updateCategoryTabs(result.categoryCount);

    if (!filtered.length) {
      container.innerHTML = _emptyState('No items match your search.');
      return;
    }

    // Group into sections
    var ultimate = [];
    var featured = [];
    var daily = [];
    var idx = 0;

    for (var i = 0; i < filtered.length; i++) {
      var r = ShopCore.getRarity(filtered[i]);
      if (r === 'ultimate') ultimate.push(filtered[i]);
      else if (r === 'legendary' || r === 'mythic') featured.push(filtered[i]);
      else daily.push(filtered[i]);
    }

    // Sort daily by cost descending
    daily.sort(function (a, b) { return (b.cost || 0) - (a.cost || 0); });

    var html = '';

    if (ultimate.length) {
      html += _sectionHeader('ULTIMATE',
        'background:linear-gradient(90deg,#00ffcc,#a855f7,#ff2d78);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:22px;');
      html += '<div class="item-grid featured" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));">';
      for (var u = 0; u < ultimate.length; u++) {
        html += renderCard(ultimate[u], idx++, true);
      }
      html += '</div>';
    }

    if (featured.length) {
      html += _sectionHeader('⭐ Featured');
      html += '<div class="item-grid featured">';
      for (var f = 0; f < featured.length; f++) {
        html += renderCard(featured[f], idx++, true);
      }
      html += '</div>';
    }

    if (daily.length) {
      if (featured.length || ultimate.length) {
        html += _sectionHeader('🛒 Daily Items');
      }
      html += '<div class="item-grid">';
      for (var d = 0; d < daily.length; d++) {
        html += renderCard(daily[d], idx++, false);
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Staggered entrance via rAF
    requestAnimationFrame(function () {
      var cards = container.querySelectorAll('.item-card');
      for (var c = 0; c < cards.length; c++) {
        cards[c].style.opacity = '1';
      }
    });
  }

  // ── Category tab counts ────────────────────────────────────

  function _updateCategoryTabs(categoryCount) {
    var tabsEl = document.getElementById('category-tabs');
    if (!tabsEl) return;

    if (!categoryCount) {
      tabsEl.innerHTML = '';
      return;
    }

    var activeCategory = ShopCore.state.activeCategory || 'all';
    var labels = ShopCore.CATEGORY_LABELS;
    var html = '';

    Object.keys(labels).forEach(function (key) {
      var count = categoryCount[key];
      if (!count) return;
      html += '<button class="shop-tab ' + (activeCategory === key ? 'active' : '') + '"'
        + ' onclick="ShopCore.state.activeCategory=\'' + key + '\';ShopSearch.getState().category=\'' + key + '\';ShopRenderer.render()">'
        + labels[key]
        + '<span class="tab-count">' + count + '</span>'
      + '</button>';
    });

    tabsEl.innerHTML = html;
  }

  // ── updateCard (optimistic patch) ──────────────────────────

  function updateCard(itemId) {
    var card = document.querySelector('.item-card[data-id="' + itemId + '"]');
    if (!card) return;

    var item = ShopCore.state.itemMap.get(itemId);
    if (!item) return;

    var owned = ShopCore.state.ownedIds.has(itemId);

    // Update button
    var btn = card.querySelector('.btn-get');
    if (btn) {
      if (owned) {
        btn.className = 'btn-get owned';
        btn.textContent = 'OWNED';
        btn.disabled = true;
      } else {
        var canBuy = ShopCore.state.balance >= item.cost;
        btn.className = 'btn-get';
        btn.textContent = canBuy ? 'GET' : 'LOCKED';
        btn.disabled = !canBuy;
      }
    }

    // Update badge area
    if (owned) {
      card.classList.add('owned-card');
      // Replace any existing badge with OWNED
      var existingBadge = card.querySelector('.card-badge');
      if (existingBadge) {
        existingBadge.style.background = 'var(--green)';
        existingBadge.style.boxShadow = '0 0 10px rgba(46,213,115,0.4)';
        existingBadge.textContent = 'OWNED';
      } else {
        var badgeEl = document.createElement('div');
        badgeEl.className = 'card-badge';
        badgeEl.style.background = 'var(--green)';
        badgeEl.style.boxShadow = '0 0 10px rgba(46,213,115,0.4)';
        badgeEl.textContent = 'OWNED';
        card.insertBefore(badgeEl, card.firstChild);
      }
    } else {
      card.classList.remove('owned-card');
    }
  }

  // ── renderInventory ────────────────────────────────────────

  function renderInventory() {
    var container = document.getElementById('inventory-container');
    if (!container) return;

    var inventory = ShopCore.state.inventory;
    if (!inventory || !inventory.length) {
      container.innerHTML = _emptyState('No items yet — go grab something from the shop!');
      return;
    }

    var html = '<div class="inv-grid">';
    for (var i = 0; i < inventory.length; i++) {
      var inv = inventory[i];
      var item = inv.item || {};
      var typeLabel = ShopCore.TYPE_LABELS[item.type] || item.type || '';

      html += '<div class="inv-card">'
        + '<div class="inv-card-visual">' + ShopAssets.makeVisual(item, 60) + '</div>'
        + '<div class="inv-card-info">'
          + '<div class="inv-card-name">' + esc(item.name || 'Unknown') + '</div>'
          + '<div class="inv-card-type">' + esc(typeLabel) + '</div>'
          + '<button class="inv-equip-btn ' + (inv.equipped ? 'equipped' : '') + '"'
            + ' onclick="ShopCore.toggleEquip(\'' + esc(inv.id) + '\',' + !!inv.equipped + ').then(function(){ShopCore.loadInventory(true).then(function(){ShopRenderer.renderInventory();})})">'
            + (inv.equipped ? '✓ Equipped' : 'Equip')
          + '</button>'
        + '</div>'
      + '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // ── renderTransactions ─────────────────────────────────────

  function renderTransactions() {
    var container = document.getElementById('tx-container');
    if (!container) return;

    container.innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';

    ShopCore.loadTransactions().then(function (txs) {
      if (!txs || !txs.length) {
        container.innerHTML = _emptyState('No transactions yet.');
        return;
      }

      var html = '<div class="tx-list">';
      for (var i = 0; i < txs.length; i++) {
        var tx = txs[i];
        var isPositive = tx.amount >= 0;
        var date = new Date(tx.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        html += '<div class="tx-row">'
          + '<div>'
            + '<div class="tx-reason">' + esc(tx.reason || 'Unknown') + '</div>'
            + '<div class="tx-date">' + date + '</div>'
          + '</div>'
          + '<div class="tx-amount ' + (isPositive ? 'positive' : 'negative') + '">'
            + (isPositive ? '+' : '') + tx.amount.toLocaleString() + ' pts'
          + '</div>'
        + '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
    }).catch(function () {
      container.innerHTML = _emptyState('Failed to load transactions.');
    });
  }

  // ── renderTitles ───────────────────────────────────────────

  function renderTitles() {
    var grid = document.getElementById('titles-shop-grid');
    if (!grid) return;

    if (typeof TitleManager === 'undefined') {
      grid.innerHTML = _emptyState('Titles system loading...');
      return;
    }

    var username = ShopCore.state.username;
    if (!username) {
      grid.innerHTML = _emptyState('Log in to view titles.');
      return;
    }

    grid.innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';

    var shopTitles = Object.values(TitleManager.TITLES).filter(function (t) {
      return t.source === 'shop';
    });

    if (!shopTitles.length) {
      grid.innerHTML = _emptyState('No titles available.');
      return;
    }

    TitleManager.getPlayerTitles(username).then(function (ownedTitles) {
      var ownedIds = new Set(ownedTitles.map(function (t) { return t.title_id; }));
      var balance = ShopCore.state.balance;
      var html = '';

      for (var i = 0; i < shopTitles.length; i++) {
        var t = shopTitles[i];
        var owned = ownedIds.has(t.id);
        var canBuy = !owned && balance >= t.price;
        var rarity = t.price >= 1500 ? 'mythic' : t.price >= 1000 ? 'legendary' : t.price >= 750 ? 'epic' : 'rare';

        html += '<div class="item-card ' + (owned ? 'owned-card' : '') + '" data-rarity="' + rarity + '" style="aspect-ratio:4/3;">'
          + (owned ? '<div class="card-badge" style="background:var(--green);box-shadow:0 0 10px rgba(46,213,115,0.4);">OWNED</div>' : '')
          + '<div class="card-visual">'
            + '<div class="card-bg-effect aura-effect"></div>'
            + '<div style="z-index:1;text-align:center;padding:16px;">'
              + '<div style="font-family:\'Exo 2\',sans-serif;font-size:18px;font-weight:900;color:' + esc(t.color) + ';text-shadow:0 0 12px ' + esc(t.color) + ';text-transform:uppercase;letter-spacing:0.08em;">' + esc(t.name) + '</div>'
              + '<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4;">' + esc(t.description) + '</div>'
            + '</div>'
          + '</div>'
          + '<div class="card-info">'
            + '<div class="card-name">' + esc(t.name) + '</div>'
            + '<div class="card-type" style="color:' + esc(t.color) + ';">Player Title</div>'
          + '</div>'
          + '<div class="card-price-bar">'
            + '<div class="card-price">'
              + '<div class="price-coin"></div>'
              + '<span class="price-value">' + t.price.toLocaleString() + '</span>'
            + '</div>'
            + '<button class="btn-get ' + (owned ? 'owned' : '') + '"'
              + (owned || !canBuy ? ' disabled' : '')
              + ' onclick="event.stopPropagation();ShopCore.buyTitle(\'' + esc(t.id) + '\').then(function(){ShopRenderer.renderTitles();}).catch(function(e){if(typeof NotificationSystem!==\'undefined\')NotificationSystem.show(e.message||\'Purchase failed\',\'error\')})">'
              + (owned ? 'OWNED' : canBuy ? 'GET' : 'LOCKED')
            + '</button>'
          + '</div>'
        + '</div>';
      }

      grid.innerHTML = html;
    }).catch(function () {
      grid.innerHTML = _emptyState('Failed to load titles.');
    });
  }

  // ── Public API ─────────────────────────────────────────────

  return {
    render: render,
    renderInventory: renderInventory,
    renderTransactions: renderTransactions,
    renderTitles: renderTitles,
    updateCard: updateCard
  };
})();

window.ShopRenderer = ShopRenderer;
