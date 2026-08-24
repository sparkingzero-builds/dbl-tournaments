/* ============================================================
   shop-assets.js  --  Asset mapping & visual generation for the shop
   ============================================================ */
const ShopAssets = (function () {
  'use strict';

  // ── Base URL ──────────────────────────────────────────────
  const DBGS = 'https://dbgsbuilds.com/wp-content/themes/dbgsquad-lite/asset';
  const DEFAULT_IMG = DBGS + '/profile-icon/2980_0001BA30757A1501.png';

  // ── Escaping ──────────────────────────────────────────────
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Item name -> image URL ────────────────────────────────
  var ITEM_IMAGE_MAP = {
    "It's Over 9000":                   DBGS + '/sticker/36083_0000000066154205.png',
    "You're Nothing":                   DBGS + '/profile-icon/2990_0001BA30437017BA.png',
    "This Isn't Even My Final Form":    DBGS + '/profile-icon/2641_0001BA30FB81F542.png',
    "Owari Da":                         DBGS + '/profile-icon/2994_0001BA304E226081.png',
    "Fusion Above All":                 DBGS + '/profile-icon/2980_0001BA30757A1501.png',
    "Final Flash!":                     DBGS + '/profile-icon/35606_00000000ADCA5E55.png',
    "Lucky Mascot":                     DBGS + '/profile-icon/2646_0001BA3075AAE877.png',
    "Super Saiyan 3":                   DBGS + '/profile-icon/35593_00000000D0710DF5.png',
    "God of Destruction":               DBGS + '/sticker/44581_00000000B4FA1339.png',
    "Frieza Force Commander":           DBGS + '/profile-icon/2643_0001BA308C86C5D4.png',
    "Elite Saiyan":                     DBGS + '/profile-icon/2992_0001BA30F5F387C4.png',
    "Super Saiyan":                     DBGS + '/sticker/2735_0001BA3019FCD3D7.png',
    "Z Fighter":                        DBGS + '/profile-icon/2996_0001BA306E23FB5C.png',
    "Namekian Elder":                   DBGS + '/sticker/44626_00000000094EE5E1.png',
    "Saiyan Warrior":                   DBGS + '/profile-icon/2642_0001BA300242223F.png',
    "Earthling":                        DBGS + '/profile-icon/35597_0000000053203DD4.png',
    "Saiyan Pride Aura":                DBGS + '/sticker/44617_00000000DC3402D3.png',
    "Golden SSJ Aura":                  DBGS + '/sticker/44599_000000007BCB5D18.png',
    "Legendary Aura":                   DBGS + '/profile-icon/2985_0001BA30D9760283.png',
    "Blue Ki Aura":                     DBGS + '/profile-icon/2984_0001BA3000526D71.png',
    "Dragon Fist Border":               DBGS + '/sticker/35954_000000008C257CA7.png',
    "Ranger Border":                    DBGS + '/sticker/36111_00000000DFDBBCA4.png',
    "Android 18 Border":                DBGS + '/sticker/44566_000000002BCE1AB5.png',
    "Perfect Border":                   DBGS + '/profile-icon/35632_000000009261B84E.png',
    "Training Grounds":                 DBGS + '/sticker/44584_00000000CA2DD0A3.png',
    "Shadow Realm":                     DBGS + '/profile-icon/35608_000000001EF6F819.png',
    "Tournament Arena":                 DBGS + '/sticker/36103_000000002C97FF8E.png',
    "Scouter":                          DBGS + '/helper-icon/17319_000000001E4B6C74.png',
    "Ban Immunity":                     DBGS + '/helper-icon/17450_00000000FF1582B1.png',
    "Hype Bomb":                        DBGS + '/helper-icon/12235_00000000FDB12817.png',
    "Double Down":                      DBGS + '/helper-icon/17527_00000000D0B69B37.png',
    "Vegeta's Pride":                   DBGS + '/sticker/36083_0000000066154205.png',
    "Golden Name":                      DBGS + '/badge/2745_0001BA3038396091.png',
    "Elder's Wisdom":                   DBGS + '/profile-icon/35640_00000000361FD067.png',
    "Dragon Ball Collector":            DBGS + '/sticker/2712_0001BA30D7AD84D0.png',
    "First Blood Badge":                DBGS + '/badge/2748_0001BA3067C1A908.png',
    "Tournament of Power Survivor":     DBGS + '/badge/2747_0001BA30D63701BD.png',
    "The Ultimate Fusion":              DBGS + '/badge/36369_00000000C9D9D8EA.png',
    "Warrior through Time":             DBGS + '/badge/36372_000000004D83D0AD.png',
    "Unrelenting Evil":                 DBGS + '/badge/36439_000000009B5AE8D6.png'
  };

  // Case-insensitive lookup
  var ITEM_IMAGE_MAP_LOWER = {};
  Object.keys(ITEM_IMAGE_MAP).forEach(function (k) {
    ITEM_IMAGE_MAP_LOWER[k.toLowerCase()] = ITEM_IMAGE_MAP[k];
  });

  // ── Border assets (real DB themed badges) ─────────────────
  var BORDER_ASSETS = {
    'flair-fire':     DBGS + '/badge/2748_0001BA3067C1A908.png',      // fiery Saiyan-themed
    'flair-ice':      DBGS + '/profile-icon/2643_0001BA308C86C5D4.png', // Frieza-themed
    'flair-royal':    DBGS + '/profile-icon/2992_0001BA30F5F387C4.png', // Vegeta royal
    'flair-shadow':   DBGS + '/badge/36439_000000009B5AE8D6.png',      // dark villain
    'flair-champion': DBGS + '/badge/36369_00000000C9D9D8EA.png',      // champion/trophy
    'flair-legend':   DBGS + '/badge/2747_0001BA30D63701BD.png'        // legendary survivor
  };

  // Fallback gradients for tinting the border frame
  var BORDER_TINTS = {
    'flair-fire':     'conic-gradient(from 0deg, #ff4500, #ff8c00, #ffd700, #ff4500)',
    'flair-ice':      'conic-gradient(from 0deg, #00bfff, #e0f7ff, #00bfff, #4dd0e1)',
    'flair-royal':    'conic-gradient(from 0deg, #9b59b6, #ffd700, #9b59b6, #e74c3c)',
    'flair-shadow':   'conic-gradient(from 0deg, #1a1a2e, #6c3483, #1a1a2e, #2c3e50)',
    'flair-champion': 'conic-gradient(from 0deg, #ffd700, #ff6b00, #ff0080, #8b00ff, #00d4ff, #ffd700)',
    'flair-legend':   'conic-gradient(from 0deg, #f59e0b, #ffd700, #f59e0b)'
  };

  // ── Background assets (profile icons as themed bg/frames) ─
  var BACKGROUND_ASSETS = {
    'void':       DBGS + '/profile-icon/35608_000000001EF6F819.png',
    'chamber':    DBGS + '/profile-icon/35640_00000000361FD067.png',
    'arena':      DBGS + '/profile-icon/2996_0001BA306E23FB5C.png',
    'saiyan':     DBGS + '/profile-icon/2642_0001BA300242223F.png',
    'namek':      DBGS + '/profile-icon/35597_0000000053203DD4.png',
    'destruction': DBGS + '/profile-icon/2994_0001BA304E226081.png'
  };

  // ── getImage ──────────────────────────────────────────────
  function getImage(item) {
    if (!item) return DEFAULT_IMG;
    var name = item.name || '';
    return ITEM_IMAGE_MAP[name]
        || ITEM_IMAGE_MAP_LOWER[name.toLowerCase()]
        || item.image_url
        || DEFAULT_IMG;
  }

  // ── makeVisual ────────────────────────────────────────────
  var SIZE_MAP = { small: 48, medium: 80, large: 120 };

  function makeVisual(item, size) {
    var src = getImage(item);
    var s = (typeof size === 'number') ? size : (SIZE_MAP[size] || SIZE_MAP.medium);
    return '<img src="' + esc(src) + '" alt="' + esc(item.name || '') + '" '
         + 'style="width:' + s + 'px;height:' + s + 'px;object-fit:cover;border-radius:8px;'
         + 'filter:drop-shadow(0 4px 16px rgba(0,0,0,0.6));" '
         + 'loading="lazy" '
         + 'onerror="this.src=\'' + esc(DEFAULT_IMG) + '\'" />';
  }

  // ── getPreviewHTML ────────────────────────────────────────
  function getPreviewHTML(item) {
    var meta = item.metadata || {};
    switch (item.type) {

      case 'flair_border': {
        var effect = meta.effect || '';
        var asset = BORDER_ASSETS[effect] || DEFAULT_IMG;
        var tint  = BORDER_TINTS[effect] || 'var(--line)';
        return '<div style="text-align:center;">'
          + '<div style="position:relative;display:inline-block;width:88px;height:88px;">'
            // tinted glow behind
            + '<div style="position:absolute;inset:-4px;border-radius:16px;background:' + tint + ';opacity:0.5;filter:blur(6px);"></div>'
            // badge asset as frame
            + '<img src="' + esc(asset) + '" alt="' + esc(effect) + ' border" '
              + 'style="position:absolute;inset:0;width:88px;height:88px;object-fit:cover;border-radius:14px;opacity:0.35;" '
              + 'loading="lazy" onerror="this.style.display=\'none\'" />'
            // mock profile card
            + '<div style="position:relative;width:80px;height:80px;margin:4px;border-radius:11px;background:var(--bg-2);'
              + 'display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted);z-index:1;">'
              + 'Your<br>Profile</div>'
          + '</div>'
          + '<div style="font-size:10px;color:var(--muted);margin-top:8px;">' + esc(effect.replace('flair-', '').replace(/^\w/, function (c) { return c.toUpperCase(); })) + ' border</div>'
        + '</div>';
      }

      case 'aura':
        return '<div style="padding:8px 20px;font-weight:700;color:var(--text);position:relative;font-family:\'Exo 2\',sans-serif;">'
          + 'YourName'
          + '<div style="position:absolute;inset:-8px;border-radius:8px;background:radial-gradient(ellipse,var(--gold) 0%,transparent 70%);opacity:0.4;z-index:-1;"></div>'
        + '</div>';

      case 'flair_title':
        return '<div style="padding:6px 16px;background:linear-gradient(135deg,var(--cyan),var(--pink));border-radius:999px;'
          + 'font-size:12px;font-weight:700;color:#000;font-family:\'Exo 2\',sans-serif;">'
          + esc(meta.title || item.name) + '</div>';

      case 'victory_quote':
        return '<div style="font-style:italic;color:var(--gold);font-size:13px;text-shadow:0 0 6px rgba(255,215,0,0.3);'
          + 'padding:0 10px;text-align:center;">&ldquo;' + esc(meta.quote || item.name) + '&rdquo;</div>';

      case 'golden_name':
        return '<div style="font-weight:900;font-size:18px;background:linear-gradient(90deg,#ffd700,#fff4b0,#ff8c00);'
          + '-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:none;font-family:\'Exo 2\',sans-serif;">YourName</div>';

      case 'hype_bomb':
        return '<div style="font-size:11px;color:var(--text);text-align:center;line-height:1.6;">'
          + '<span style="font-size:24px;">&#x1F4A5;</span><br>Everyone sees an animated<br>explosion in the feed!</div>';

      case 'profile_bg': {
        var bgKey = (item.name || '').toLowerCase();
        var bgAsset = null;
        Object.keys(BACKGROUND_ASSETS).forEach(function (k) {
          if (bgKey.indexOf(k) !== -1) bgAsset = BACKGROUND_ASSETS[k];
        });
        if (bgAsset) {
          return '<div style="position:relative;width:120px;height:60px;border-radius:8px;overflow:hidden;border:1px solid var(--line);">'
            + '<img src="' + esc(bgAsset) + '" alt="' + esc(item.name) + '" '
              + 'style="width:100%;height:100%;object-fit:cover;opacity:0.6;" '
              + 'loading="lazy" onerror="this.style.display=\'none\'" />'
            + '<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.6));"></div>'
          + '</div>';
        }
        // Fallback: gradient approach
        var grad = bgKey.indexOf('void') !== -1
          ? 'radial-gradient(ellipse,rgba(30,0,50,0.95),#000)'
          : bgKey.indexOf('chamber') !== -1
            ? 'linear-gradient(180deg,rgba(255,255,255,0.15),rgba(20,20,40,0.95))'
            : 'linear-gradient(135deg,rgba(20,20,40,0.95),rgba(40,20,60,0.95))';
        return '<div style="width:120px;height:60px;border-radius:8px;background:' + grad + ';border:1px solid var(--line);"></div>';
      }

      case 'kings_commentary':
        return '<div style="padding:8px 12px;background:rgba(255,215,0,0.08);border-left:3px solid var(--gold);border-radius:4px;'
          + 'font-size:11px;color:var(--text);max-width:200px;">'
          + '<span style="color:var(--gold);font-weight:700;">&#x1F451; You:</span> Your message here</div>';

      case 'double_down':
        return '<div style="text-align:center;font-size:12px;color:var(--text);line-height:1.6;">'
          + '<span style="font-size:18px;color:var(--cyan);font-weight:900;font-family:\'Exo 2\',sans-serif;">100&#x2192;200</span> pts<br>'
          + '<span style="font-size:10px;color:var(--muted);">Win points doubled next tournament</span></div>';

      case 'ban_immunity':
        return '<div style="text-align:center;font-size:12px;color:var(--text);line-height:1.6;">'
          + '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(34,197,94,0.1);'
          + 'border:1px solid rgba(34,197,94,0.3);border-radius:6px;">'
          + '<span style="color:#22c55e;font-weight:700;">PROTECTED</span></div><br>'
          + '<span style="font-size:10px;color:var(--muted);">One character can\'t be banned</span></div>';

      case 'scouter':
        return '<div style="text-align:center;font-size:12px;color:var(--text);line-height:1.6;font-family:monospace;">'
          + '<div style="padding:4px 10px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:4px;'
          + 'font-size:10px;color:#22c55e;">SCANNING OPPONENT...<br>Team: ??? | W/L: ???</div></div>';

      case 'vegetas_pride':
        return '<div style="text-align:center;font-size:12px;color:var(--text);line-height:1.6;">'
          + '<span style="font-size:18px;color:var(--pink);font-weight:900;font-family:\'Exo 2\',sans-serif;">25&#x2192;75</span> pts<br>'
          + '<span style="font-size:10px;color:var(--muted);">Loss points tripled for one tournament</span></div>';

      case 'badge':
        return '<div style="text-align:center;">'
          + '<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(255,215,0,0.08);'
          + 'border:1px solid rgba(255,215,0,0.2);border-radius:8px;">'
          + makeVisual(item, 32)
          + '<span style="color:var(--gold);font-weight:700;font-family:\'Exo 2\',sans-serif;font-size:12px;">' + esc(item.name) + '</span>'
          + '</div><div style="font-size:10px;color:var(--muted);margin-top:6px;">Displayed on your profile badge wall</div></div>';

      default:
        return '<div style="color:var(--muted);font-size:12px;">Preview not available</div>';
    }
  }

  // ── Accessors for asset maps ──────────────────────────────
  function getBorderAssets()     { return Object.assign({}, BORDER_ASSETS); }
  function getBackgroundAssets() { return Object.assign({}, BACKGROUND_ASSETS); }

  // ── Public API ────────────────────────────────────────────
  return {
    getImage:             getImage,
    makeVisual:           makeVisual,
    getPreviewHTML:       getPreviewHTML,
    getBorderAssets:      getBorderAssets,
    getBackgroundAssets:  getBackgroundAssets,
    esc:                  esc
  };
})();
