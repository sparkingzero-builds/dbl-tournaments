const ThemeManager = (() => {
  const themes = {
    cyberpunk: { name: 'Cyberpunk', icon: '??' },
    saiyan: { name: 'Saiyan Saga', icon: '??' },
    namek: { name: 'Namek Saga', icon: '??' },
    cell: { name: 'Cell Saga', icon: '??' },
    buu: { name: 'Buu Saga', icon: '??' },
    gt: { name: 'GT', icon: '??' },
    super: { name: 'Super', icon: '?' }
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
