/**
 * MONEYTRACK · Theme & Accessibility Engine
 * 12 Temas · 4 Modos · Daltonismo (Protanopía, Deuteranopía, Tritanopía)
 * Persistencia en localStorage
 */

const ThemeEngine = {
  THEMES: [
    { id: 0, name: 'Firma', accent: '#6C5CE7', sub: '#00D2FF' },
    { id: 1, name: 'Solar', accent: '#F59E0B', sub: '#F97316' },
    { id: 2, name: 'Cítrico', accent: '#84CC16', sub: '#10B981' },
    { id: 3, name: 'Bosque', accent: '#10B981', sub: '#06B6D4' },
    { id: 4, name: 'Menta', accent: '#14B8A6', sub: '#38BDF8' },
    { id: 5, name: 'Cielo', accent: '#0284C7', sub: '#38BDF8' },
    { id: 6, name: 'Océano', accent: '#2563EB', sub: '#60A5FA' },
    { id: 7, name: 'Índigo', accent: '#4F46E5', sub: '#818CF8' },
    { id: 8, name: 'Violeta', accent: '#7C3AED', sub: '#C084FC' },
    { id: 9, name: 'Magenta', accent: '#D946EF', sub: '#F472B6' },
    { id: 10, name: 'Rubí', accent: '#E11D48', sub: '#FB7185' },
    { id: 11, name: 'Cobre', accent: '#EA580C', sub: '#FBBF24' }
  ],

  MODES: ['dark', 'light', 'contrast', 'auto'],

  init() {
    this.loadPreferences();
    this.bindEvents();
  },

  getPreferences() {
    const defaultPrefs = {
      theme: 0,
      mode: 'dark',
      colorblind: 'none',
      reduceMotion: false,
      highFocus: false,
      underlineLinks: false,
      sidebarPinned: true
    };

    try {
      const stored = localStorage.getItem('mt_preferences');
      return stored ? { ...defaultPrefs, ...JSON.parse(stored) } : defaultPrefs;
    } catch (e) {
      return defaultPrefs;
    }
  },

  savePreferences(prefs) {
    localStorage.setItem('mt_preferences', JSON.stringify(prefs));
  },

  loadPreferences() {
    const prefs = this.getPreferences();
    this.applyTheme(prefs.theme, false);
    this.applyMode(prefs.mode, false);
    this.applyColorblind(prefs.colorblind, false);
    this.applyA11yFlags(prefs);
  },

  applyTheme(themeIndex, save = true) {
    document.body.setAttribute('data-app-theme', themeIndex);
    if (save) {
      const prefs = this.getPreferences();
      prefs.theme = themeIndex;
      this.savePreferences(prefs);
    }
  },

  applyMode(mode, save = true) {
    if (mode === 'auto') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.setAttribute('data-app-mode', isSystemDark ? 'dark' : 'light');
    } else {
      document.body.setAttribute('data-app-mode', mode);
    }

    if (save) {
      const prefs = this.getPreferences();
      prefs.mode = mode;
      this.savePreferences(prefs);
    }
  },

  applyColorblind(filterType, save = true) {
    document.body.classList.remove('a11y-cb-protanopia', 'a11y-cb-deuteranopia', 'a11y-cb-tritanopia');
    if (filterType !== 'none') {
      document.body.classList.add(`a11y-cb-${filterType}`);
    }

    if (save) {
      const prefs = this.getPreferences();
      prefs.colorblind = filterType;
      this.savePreferences(prefs);
    }
  },

  applyA11yFlags(prefs) {
    document.body.classList.toggle('a11y-reduce-motion', !!prefs.reduceMotion);
    document.body.classList.toggle('a11y-focus', !!prefs.highFocus);
    document.body.classList.toggle('a11y-underline', !!prefs.underlineLinks);

    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('is-collapsed', !prefs.sidebarPinned);
    }
  },

  bindEvents() {
    // Escuchar cambios de color-scheme del sistema si está en modo auto
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const prefs = this.getPreferences();
        if (prefs.mode === 'auto') {
          document.body.setAttribute('data-app-mode', e.matches ? 'dark' : 'light');
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ThemeEngine.init();
});
