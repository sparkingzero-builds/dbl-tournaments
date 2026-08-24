/**
 * ShopModal — Detail modal and purchase animation module for the shop.
 * Depends on: ShopCore, ShopAssets
 */
const ShopModal = (function () {
  'use strict';

  var _el = null;        // modal root element
  var _currentId = null;  // currently displayed item id
  var _buying = false;    // purchase in progress

  // ── helpers ───────────────────────────────────────────────

  function _esc(s) { return ShopAssets.esc(s || ''); }

  function _getFilteredItems() {
    var cat = ShopCore.state.activeCategory;
    if (cat === 'all') return ShopCore.state.items;
    return ShopCore.state.items.filter(function (i) {
      return (ShopCore.CATEGORY_MAP[i.type] || 'other') === cat;
    });
  }

  // ── init ──────────────────────────────────────────────────

  function init() {
    if (_el) return; // already initialised

    _el = document.createElement('div');
    _el.className = 'shop-modal';
    _el.id = 'shop-modal';
    _el.innerHTML =
      '<div class="shop-modal-backdrop"></div>' +
      '<div class="shop-modal-content">' +
        '<button class="shop-modal-close">&times;</button>' +
        '<div class="shop-modal-preview"></div>' +
        '<div class="shop-modal-info">' +
          '<div class="shop-modal-name"></div>' +
          '<div class="shop-modal-rarity"></div>' +
          '<div class="shop-modal-type"></div>' +
          '<div class="shop-modal-desc"></div>' +
          '<div class="shop-modal-preview-demo-wrap">' +
            '<div class="shop-modal-preview-label">Preview</div>' +
            '<div class="shop-modal-preview-demo"></div>' +
          '</div>' +
          '<div class="shop-modal-actions"></div>' +
          '<div class="shop-modal-error"></div>' +
        '</div>' +
      '</div>';

    if (!document.body) { _el = null; return; }
    document.body.appendChild(_el);

    // inject styles
    var style = document.createElement('style');
    style.textContent = _getStyles();
    document.head.appendChild(style);

    // close on backdrop click
    _el.querySelector('.shop-modal-backdrop').addEventListener('click', close);
    _el.querySelector('.shop-modal-close').addEventListener('click', close);

    // keyboard
    document.addEventListener('keydown', function (e) {
      if (!_el.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowLeft')  { _cycle(-1); return; }
      if (e.key === 'ArrowRight') { _cycle(1); return; }
    });
  }

  // ── open ──────────────────────────────────────────────────

  function open(itemId) {
    if (!_el) init();

    var item = ShopCore.state.itemMap.get(itemId);
    if (!item) return;

    _currentId = itemId;
    _buying = false;
    _el.querySelector('.shop-modal-error').textContent = '';

    var rarity = ShopCore.getRarity(item);
    var color = ShopCore.RARITY_COLORS[rarity] || '#9ca3af';
    var owned = ShopCore.state.ownedIds.has(itemId);
    var canBuy = !owned && ShopCore.state.balance >= item.cost;
    var typeLabel = ShopCore.TYPE_LABELS[item.type] || item.type || '';

    // preview area
    var previewEl = _el.querySelector('.shop-modal-preview');
    previewEl.style.background = 'linear-gradient(160deg, ' + color + '22, ' + color + '08)';
    previewEl.innerHTML =
      '<div class="shop-modal-preview-aura" style="--rarity-color:' + color + ';"></div>' +
      '<div class="shop-modal-preview-icon">' + ShopAssets.makeVisual(item, 'large') + '</div>';

    // rarity tag
    var rarityEl = _el.querySelector('.shop-modal-rarity');
    rarityEl.textContent = ShopCore.RARITY_LABELS[rarity] || rarity;
    rarityEl.style.background = color;
    rarityEl.style.color = '#000';

    // name
    _el.querySelector('.shop-modal-name').textContent = item.name || '';

    // type
    var typeEl = _el.querySelector('.shop-modal-type');
    typeEl.textContent = typeLabel;
    typeEl.style.color = color;

    // description
    _el.querySelector('.shop-modal-desc').textContent = ShopCore.getItemDescription(item);

    // preview demo
    var demoWrap = _el.querySelector('.shop-modal-preview-demo-wrap');
    var demoEl = _el.querySelector('.shop-modal-preview-demo');
    var previewHTML = ShopAssets.getPreviewHTML(item);
    if (previewHTML && previewHTML.indexOf('Preview not available') === -1) {
      demoWrap.style.display = '';
      demoEl.innerHTML = previewHTML;
    } else {
      demoWrap.style.display = 'none';
    }

    // actions
    var actionsEl = _el.querySelector('.shop-modal-actions');
    if (owned) {
      actionsEl.innerHTML =
        '<div class="shop-modal-owned-indicator">✓ OWNED</div>' +
        '<button class="shop-modal-gift-btn" type="button">🎁 Gift</button>';
    } else {
      var priceHTML = item.cost > 0
        ? '<div class="price-coin"></div><span class="price-value">' + item.cost.toLocaleString() + '</span>'
        : '<span class="price-value free">FREE</span>';

      var btnLabel = canBuy ? 'GET' : 'NEED ' + (item.cost - ShopCore.state.balance).toLocaleString() + ' MORE';

      actionsEl.innerHTML =
        '<div class="shop-modal-price">' + priceHTML + '</div>' +
        '<div class="shop-modal-btn-row">' +
          '<button class="shop-modal-buy-btn" type="button"' + (canBuy ? '' : ' disabled') +
            ' style="' + (canBuy ? 'background:' + color + ';' : '') + '">' + _esc(btnLabel) + '</button>' +
          '<button class="shop-modal-gift-btn" type="button">🎁 Gift</button>' +
        '</div>';
    }

    // wire up buttons
    var buyBtn = actionsEl.querySelector('.shop-modal-buy-btn');
    if (buyBtn) {
      buyBtn.onclick = function () { _handlePurchase(item); };
    }
    var giftBtn = actionsEl.querySelector('.shop-modal-gift-btn');
    if (giftBtn) {
      giftBtn.onclick = function () { alert('Gifting coming soon!'); };
    }

    // animate in
    _el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // ── close ─────────────────────────────────────────────────

  function close() {
    if (!_el) return;
    _el.classList.add('closing');
    setTimeout(function () {
      _el.classList.remove('open', 'closing');
      document.body.style.overflow = '';
      _currentId = null;
    }, 200);
  }

  // ── arrow cycling ─────────────────────────────────────────

  function _cycle(dir) {
    if (_buying) return;
    var filtered = _getFilteredItems();
    if (!filtered.length) return;
    var idx = -1;
    for (var i = 0; i < filtered.length; i++) {
      if (filtered[i].id === _currentId) { idx = i; break; }
    }
    if (idx === -1) return;
    var next = (idx + dir + filtered.length) % filtered.length;
    open(filtered[next].id);
  }

  // ── purchase ──────────────────────────────────────────────

  function _handlePurchase(item) {
    if (_buying) return;
    _buying = true;

    var buyBtn = _el.querySelector('.shop-modal-buy-btn');
    var errorEl = _el.querySelector('.shop-modal-error');
    errorEl.textContent = '';

    // spinner state
    buyBtn.disabled = true;
    buyBtn.innerHTML = '<span class="shop-modal-spinner"></span>';

    ShopCore.buyItem(item.id, item.cost, item.name).then(function () {
      // success
      if (typeof Sounds !== 'undefined' && Sounds.play) {
        try { Sounds.play('purchase'); } catch (_) {}
      }

      // particle burst
      _burstParticles(item);

      // icon bounce
      var iconEl = _el.querySelector('.shop-modal-preview-icon');
      if (iconEl) {
        iconEl.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
        iconEl.style.transform = 'scale(1.2)';
        setTimeout(function () { iconEl.style.transform = 'scale(1)'; }, 300);
      }

      // button morph to owned
      buyBtn.className = 'shop-modal-buy-btn owned';
      buyBtn.innerHTML = '✓ OWNED';
      buyBtn.style.background = 'var(--green)';
      buyBtn.style.color = '#000';
      buyBtn.disabled = true;
      buyBtn.onclick = null;

      // balance bounce
      var balEl = document.getElementById('balance-value');
      if (balEl) {
        balEl.textContent = ShopCore.state.balance.toLocaleString();
        balEl.style.transition = 'transform 0.15s';
        balEl.style.transform = 'scale(0.85)';
        setTimeout(function () { balEl.style.transform = 'scale(1.1)'; }, 150);
        setTimeout(function () { balEl.style.transform = 'scale(1)'; }, 300);
      }

      _buying = false;
    }).catch(function (e) {
      // failure
      if (typeof Sounds !== 'undefined' && Sounds.play) {
        try { Sounds.play('error'); } catch (_) {}
      }
      buyBtn.disabled = false;
      buyBtn.innerHTML = 'GET';
      buyBtn.classList.add('shake');
      setTimeout(function () { buyBtn.classList.remove('shake'); }, 400);
      errorEl.textContent = e.message || 'Purchase failed';
      _buying = false;
    });
  }

  // ── particle burst ────────────────────────────────────────

  function _burstParticles(item) {
    var previewEl = _el.querySelector('.shop-modal-preview');
    if (!previewEl) return;
    var color = ShopCore.RARITY_COLORS[ShopCore.getRarity(item)] || '#9ca3af';
    var count = 14;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'shop-modal-particle';
      var angle = (Math.PI * 2 * i) / count;
      var dist = 60 + Math.random() * 60;
      var dx = Math.cos(angle) * dist;
      var dy = Math.sin(angle) * dist;
      var size = 4 + Math.random() * 6;
      p.style.cssText =
        'width:' + size + 'px;height:' + size + 'px;' +
        'background:' + color + ';' +
        '--dx:' + dx + 'px;--dy:' + dy + 'px;';
      previewEl.appendChild(p);
      (function (el) {
        setTimeout(function () { el.remove(); }, 700);
      })(p);
    }
  }

  // ── styles ────────────────────────────────────────────────

  function _getStyles() {
    return [
      '.shop-modal{display:none;position:fixed;inset:0;z-index:1000;align-items:center;justify-content:center;padding:20px;}',
      '.shop-modal.open{display:flex;}',
      '.shop-modal.open .shop-modal-backdrop{animation:smFadeIn .25s ease-out forwards;}',
      '.shop-modal.open .shop-modal-content{animation:smSlideUp .3s ease-out forwards;}',
      '.shop-modal.closing .shop-modal-backdrop{animation:smFadeOut .2s ease-in forwards;}',
      '.shop-modal.closing .shop-modal-content{animation:smSlideDown .2s ease-in forwards;}',

      '.shop-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);}',

      '.shop-modal-content{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;z-index:1;}',

      '.shop-modal-close{position:absolute;top:12px;right:12px;z-index:5;width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:var(--bg);color:var(--muted);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;line-height:1;}',
      '.shop-modal-close:hover{border-color:var(--pink);color:var(--pink);}',

      '.shop-modal-preview{height:220px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border-radius:16px 16px 0 0;}',
      '.shop-modal-preview::after{content:"";position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(to top,var(--panel),transparent);pointer-events:none;}',
      '.shop-modal-preview-aura{position:absolute;inset:0;background:radial-gradient(circle at 50% 60%,var(--rarity-color) 0%,transparent 60%);opacity:0.3;animation:aura-pulse 3s ease-in-out infinite;}',
      '.shop-modal-preview-icon{z-index:1;filter:drop-shadow(0 4px 24px rgba(0,0,0,0.5));transition:transform .3s;}',

      '.shop-modal-info{padding:0 24px 24px;}',

      '.shop-modal-rarity{display:inline-block;font-family:"Exo 2",sans-serif;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.15em;padding:4px 12px;border-radius:4px;margin-bottom:8px;}',

      '.shop-modal-name{font-family:"Exo 2",sans-serif;font-size:22px;font-weight:900;text-transform:uppercase;color:var(--text);margin-bottom:4px;line-height:1.2;}',

      '.shop-modal-type{font-size:12px;text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:16px;}',

      '.shop-modal-desc{color:var(--text);font-size:14px;line-height:1.6;margin-bottom:16px;padding:14px 16px;background:var(--bg-2);border-radius:var(--radius-sm);border-left:3px solid var(--cyan);}',

      '.shop-modal-preview-demo-wrap{margin-bottom:16px;padding:16px;background:var(--bg-2);border-radius:var(--radius);}',
      '.shop-modal-preview-label{font-family:"Exo 2",sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:10px;}',
      '.shop-modal-preview-demo{display:flex;align-items:center;justify-content:center;min-height:50px;}',

      '.shop-modal-actions{border-top:1px solid var(--line);padding-top:16px;margin-top:8px;}',

      '.shop-modal-price{display:flex;align-items:center;gap:8px;margin-bottom:12px;}',
      '.shop-modal-price .price-coin{width:24px;height:24px;border-radius:50%;background:url("https://dbgsbuilds.com/wp-content/themes/dbgsquad-lite/asset/badge/36195_00000000E3116FFB.png") center/contain no-repeat;filter:drop-shadow(0 0 4px rgba(255,215,0,0.4));}',
      '.shop-modal-price .price-value{font-family:"Exo 2",sans-serif;font-weight:800;font-size:22px;color:var(--gold);}',
      '.shop-modal-price .price-value.free{color:var(--green);}',

      '.shop-modal-btn-row{display:flex;gap:8px;}',

      '.shop-modal-buy-btn{flex:1;background:var(--cyan);color:#000;border:none;padding:12px 32px;border-radius:8px;font-family:"Exo 2",sans-serif;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:.08em;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;}',
      '.shop-modal-buy-btn:hover:not(:disabled){background:#fff;box-shadow:0 0 20px rgba(0,229,255,0.4);transform:scale(1.03);}',
      '.shop-modal-buy-btn:disabled{background:var(--line);color:var(--muted);cursor:not-allowed;}',
      '.shop-modal-buy-btn.owned{background:var(--green);color:#000;cursor:default;}',

      '.shop-modal-gift-btn{background:none;border:1px solid var(--line);color:var(--muted);padding:12px 16px;border-radius:8px;font-family:"Exo 2",sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap;}',
      '.shop-modal-gift-btn:hover{border-color:var(--gold);color:var(--gold);}',

      '.shop-modal-owned-indicator{display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(46,213,115,0.1);border:1px solid rgba(46,213,115,0.3);border-radius:8px;color:var(--green);font-family:"Exo 2",sans-serif;font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;}',

      '.shop-modal-error{color:var(--pink);font-size:12px;margin-top:8px;min-height:16px;}',

      '.shop-modal-spinner{display:inline-block;width:18px;height:18px;border:2px solid rgba(0,0,0,0.2);border-top-color:#000;border-radius:50%;animation:smSpin .6s linear infinite;}',

      '.shop-modal-particle{position:absolute;top:50%;left:50%;border-radius:50%;pointer-events:none;animation:smBurst .6s ease-out forwards;z-index:2;}',

      '@keyframes smBurst{0%{transform:translate(-50%,-50%) translate(0,0);opacity:1;}100%{transform:translate(-50%,-50%) translate(var(--dx),var(--dy));opacity:0;}}',
      '@keyframes smFadeIn{from{opacity:0;}to{opacity:1;}}',
      '@keyframes smFadeOut{from{opacity:1;}to{opacity:0;}}',
      '@keyframes smSlideUp{from{transform:translateY(30px) scale(0.9);opacity:0;}to{transform:translateY(0) scale(1);opacity:1;}}',
      '@keyframes smSlideDown{from{transform:translateY(0) scale(1);opacity:1;}to{transform:translateY(30px) scale(0.9);opacity:0;}}',
      '@keyframes smSpin{to{transform:rotate(360deg);}}',

      '.shop-modal-buy-btn.shake{animation:smShake .4s ease-in-out;}',
      '@keyframes smShake{0%,100%{transform:translateX(0);}20%{transform:translateX(-6px);}40%{transform:translateX(6px);}60%{transform:translateX(-4px);}80%{transform:translateX(4px);}}'
    ].join('\n');
  }

  // ── public API ────────────────────────────────────────────

  return { init: init, open: open, close: close };
})();

window.ShopModal = ShopModal;
