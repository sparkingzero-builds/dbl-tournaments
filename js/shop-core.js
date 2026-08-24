/**
 * ShopCore — State management and data layer for the shop page.
 * Exposes window.ShopCore as an IIFE module.
 */
const ShopCore = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────

  const TYPE_LABELS = {
    flair_border: 'Flair Border', flair_title: 'Title', aura: 'Aura Effect',
    victory_quote: 'Victory Quote', kings_commentary: 'Social Perk',
    golden_name: 'Social Perk', hype_bomb: 'Social Perk',
    profile_bg: 'Profile Background', badge: 'Badge', alt_art: 'Alt Art',
    double_down: 'Power-Up', vegetas_pride: 'Power-Up',
    ban_immunity: 'Power-Up', scouter: 'Power-Up'
  };

  const CATEGORY_MAP = {
    flair_title: 'cosmetics', flair_border: 'cosmetics', aura: 'effects',
    profile_bg: 'cosmetics', victory_quote: 'social', kings_commentary: 'social',
    golden_name: 'social', hype_bomb: 'effects', badge: 'cosmetics', alt_art: 'cosmetics',
    double_down: 'effects', vegetas_pride: 'effects', ban_immunity: 'effects', scouter: 'effects'
  };

  const CATEGORY_LABELS = {
    all: '\u{1F525} All Items', cosmetics: '\u{1F3A8} Cosmetics',
    effects: '⚡ Effects', social: '\u{1F4AC} Social'
  };

  const ITEM_DESCRIPTIONS = {
    flair_border: 'Adds a custom animated border around your profile card on the Rankings and Profile pages. Other players will see this border whenever they view your stats.',
    flair_title: 'A special title displayed below your username on your profile page and in tournament brackets. Show off your rank and style.',
    aura: 'An animated glow effect that surrounds your name in the rankings table and profile card. Different colours for different vibes.',
    victory_quote: 'A custom quote that appears on your profile and shows up in the Live Feed when you win a match. Talk your trash.',
    kings_commentary: "Post a pinned commentary message in the Live Feed that appears with a gold crown icon. Your words, broadcast to the whole tournament.",
    golden_name: 'Your username gets rendered in gold with a glowing effect across the entire site — rankings, brackets, profiles, feed. Everyone will know.',
    hype_bomb: 'Drop an animated hype explosion in the Live Feed that everyone sees. A burst of energy particles and screen shake when you trigger it.',
    profile_bg: 'Changes the background theme of your profile page. Each background has unique colours and atmospheric effects.',
    badge: "A collectible badge displayed on your profile's badge wall. Some are earned, some are bought — all are bragging rights.",
    double_down: 'Doubles the points you earn from your next tournament. Win points become 200, loss points become 50, champion bonus becomes 1000. One-time use.',
    vegetas_pride: "When you lose a match, you earn warrior's bonus points (75 instead of 25). Lasts for one full tournament. Pride in defeat.",
    ban_immunity: 'Protect one character on your team from being banned in the next tournament. Your opponent cannot ban your shielded pick. One-time use.',
    scouter: "View your next opponent's recent match history and team picks before your match starts. Knowledge is power. One-time use."
  };

  const RARITY_LABELS = {
    common: 'Common', uncommon: 'Uncommon', rare: 'Rare',
    epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic', ultimate: 'Ultimate'
  };

  const RARITY_COLORS = {
    common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6',
    epic: '#a855f7', legendary: '#f59e0b', mythic: '#ff2d78', ultimate: '#00ffcc'
  };

  // ── State ──────────────────────────────────────────────────────

  const state = {
    username: null,
    balance: 0,
    items: [],
    itemMap: new Map(),
    ownedIds: new Set(),
    inventory: [],
    activeTab: 'shop',
    activeCategory: 'all'
  };

  // ── Cache layer ────────────────────────────────────────────────

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  let _itemCache = null;
  let _itemCacheTime = 0;
  let _inventoryCache = null;
  let _inventoryCacheTime = 0;

  function _isCacheValid(cacheTime) {
    return Date.now() - cacheTime < CACHE_TTL;
  }

  function invalidateItemCache() {
    _itemCache = null;
    _itemCacheTime = 0;
  }

  function invalidateInventoryCache() {
    _inventoryCache = null;
    _inventoryCacheTime = 0;
  }

  // ── Helpers ────────────────────────────────────────────────────

  function getRarity(item) {
    const cost = item.cost || 0;
    if (item.metadata?.ultimate) return 'ultimate';
    if (item.metadata?.exclusive) return 'mythic';
    if (cost >= 500) return 'legendary';
    if (cost >= 300) return 'epic';
    if (cost >= 150) return 'rare';
    if (cost >= 50) return 'uncommon';
    return 'common';
  }

  function getItemDescription(item) {
    if (item.description) return item.description;
    return ITEM_DESCRIPTIONS[item.type] || 'A unique item from the DBL Tournament shop.';
  }

  function getBadge(item) {
    if (item.metadata?.exclusive) return '<div class="card-badge exclusive">EXCLUSIVE</div>';
    if (item.cost >= 2000) return '<div class="card-badge hot">HOT</div>';
    if (item.cost === 0) return '<div class="card-badge new">FREE</div>';
    return '';
  }

  // ── Build itemMap from items array ─────────────────────────────

  function _buildItemMap(items) {
    state.itemMap.clear();
    for (const item of items) {
      state.itemMap.set(item.id, item);
    }
  }

  // ── Data loading ───────────────────────────────────────────────

  async function refreshBalance() {
    if (!state.username) return;
    try {
      const pts = await db.getPoints(state.username);
      state.balance = pts.balance || 0;
    } catch (e) {
      console.error('Failed to load balance', e);
    }
  }

  async function loadItems(forceRefresh) {
    if (!forceRefresh && _itemCache && _isCacheValid(_itemCacheTime)) {
      state.items = _itemCache;
      _buildItemMap(state.items);
      return state.items;
    }
    try {
      const items = await db.getShopItems();
      state.items = items;
      _itemCache = items;
      _itemCacheTime = Date.now();
      _buildItemMap(state.items);
      return items;
    } catch (e) {
      console.error('Failed to load shop items', e);
      throw e;
    }
  }

  async function loadInventory(forceRefresh) {
    if (!state.username) return [];
    if (!forceRefresh && _inventoryCache && _isCacheValid(_inventoryCacheTime)) {
      state.inventory = _inventoryCache;
      state.ownedIds = new Set(_inventoryCache.map(inv => inv.item?.id).filter(Boolean));
      return _inventoryCache;
    }
    try {
      const inv = await db.getInventory(state.username);
      state.inventory = inv;
      _inventoryCache = inv;
      _inventoryCacheTime = Date.now();
      state.ownedIds = new Set(inv.map(i => i.item?.id).filter(Boolean));
      return inv;
    } catch (e) {
      console.error('Failed to load inventory', e);
      throw e;
    }
  }

  async function loadTransactions() {
    if (!state.username) return [];
    try {
      return await db.getPointTransactions(state.username);
    } catch (e) {
      console.error('Failed to load transactions', e);
      throw e;
    }
  }

  // ── Actions ────────────────────────────────────────────────────

  async function buyItem(itemId, cost, name) {
    const item = state.itemMap.get(itemId);
    if (!item) throw new Error('Item not found');
    if (state.ownedIds.has(itemId)) throw new Error('Already owned');
    if (state.balance < cost) throw new Error('Insufficient funds');

    // Optimistic update
    const prevBalance = state.balance;
    state.balance -= cost;
    state.ownedIds.add(itemId);

    // Notify renderer of single-card update (if available)
    if (typeof ShopRenderer !== 'undefined' && ShopRenderer.updateCard) {
      try { ShopRenderer.updateCard(itemId); } catch (_) { /* renderer not ready */ }
    }

    try {
      await db.purchaseItem(state.username, itemId, cost);
      // Invalidate inventory cache since we now own a new item
      invalidateInventoryCache();
      // Refresh balance from server to stay in sync
      await refreshBalance();
    } catch (e) {
      // Revert optimistic update
      state.balance = prevBalance;
      state.ownedIds.delete(itemId);
      if (typeof ShopRenderer !== 'undefined' && ShopRenderer.updateCard) {
        try { ShopRenderer.updateCard(itemId); } catch (_) { /* ignore */ }
      }
      throw e;
    }
  }

  async function buyTitle(titleId) {
    if (typeof TitleManager === 'undefined') throw new Error('TitleManager not loaded');
    const title = await TitleManager.purchaseTitle(state.username, titleId);
    await refreshBalance();
    return title;
  }

  async function toggleEquip(inventoryId, isEquipped) {
    if (!state.username) return;
    if (isEquipped) {
      await db.unequipItem(state.username, inventoryId);
    } else {
      await db.equipItem(state.username, inventoryId);
    }
    // Invalidate inventory cache so next load picks up equip state
    invalidateInventoryCache();
  }

  // ── Tab switching ──────────────────────────────────────────────

  function switchTab(tabName) {
    state.activeTab = tabName;
  }

  // ── Login / Init ───────────────────────────────────────────────

  function login(username) {
    state.username = username;
    sessionStorage.setItem('shop_username', username);
  }

  function logout() {
    state.username = null;
    state.balance = 0;
    state.items = [];
    state.itemMap.clear();
    state.ownedIds.clear();
    state.inventory = [];
    state.activeTab = 'shop';
    state.activeCategory = 'all';
    invalidateItemCache();
    invalidateInventoryCache();
    sessionStorage.removeItem('shop_username');
    if (typeof AUTH !== 'undefined') AUTH.logout();
  }

  async function init() {
    // Check AUTH module first
    if (typeof AUTH !== 'undefined' && AUTH.isLoggedIn()) {
      const discordName = AUTH.getDiscordUsername();
      if (discordName) {
        state.username = discordName;
        sessionStorage.setItem('shop_username', discordName);
      }
    }
    // Fall back to sessionStorage
    if (!state.username) {
      const stored = sessionStorage.getItem('shop_username');
      if (stored) state.username = stored;
    }
    // If logged in, load initial data
    if (state.username) {
      await Promise.all([
        refreshBalance(),
        loadItems(),
        loadInventory()
      ]);
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  return {
    init,
    state,
    login,
    logout,
    switchTab,
    getRarity,
    getItemDescription,
    getBadge,
    buyItem,
    buyTitle,
    toggleEquip,
    refreshBalance,
    loadItems,
    loadInventory,
    loadTransactions,
    invalidateItemCache,
    invalidateInventoryCache,
    TYPE_LABELS,
    CATEGORY_MAP,
    CATEGORY_LABELS,
    ITEM_DESCRIPTIONS,
    RARITY_COLORS,
    RARITY_LABELS
  };
})();

window.ShopCore = ShopCore;
