const ThemeManager = (() => {
  const themes = {
    cyberpunk: { name: 'Cyberpunk', icon: '\u{1F7E3}' },
    saiyan: { name: 'Saiyan Saga', icon: '\u{1F525}' },
    namek: { name: 'Namek Saga', icon: '\u{1F30D}' },
    cell: { name: 'Cell Saga', icon: '\u{1F41B}' },
    buu: { name: 'Buu Saga', icon: '\u{1F46E}' },
    gt: { name: 'GT', icon: '\u{1F680}' },
    super: { name: 'Super', icon: '\u{2B50}' }
  };

  function apply(themeName) {
    if (!themeName || themeName === 'cyberpunk') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeName);
    }
  }

  function getAll() {
    return themes;
  }

  return { apply, getAll };
})();
