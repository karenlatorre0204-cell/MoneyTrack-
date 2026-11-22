/**
 * MONEYTRACK · Theme, Accessibility & Sound Engine
 * 12 Temas · 4 Modos · Daltonismo (Protanopía, Deuteranopía, Tritanopía)
 * Escalado Dinámico de Fuente (A- / A+) · Sintetizador Web Audio API Háptico
 * Persistencia en localStorage
 */

const SoundEngine = {
  ctx: null,

  getAudioContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  },

  isEnabled() {
    const prefs = ThemeEngine.getPreferences();
    return prefs.soundEnabled !== false;
  },

  // Sonido de moneda brillante al registrar ingresos o abonos
  playCoin() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

      osc2.frequency.setValueAtTime(1318.51, now);
      osc2.frequency.exponentialRampToValueAtTime(1975.53, now + 0.12); // B6

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.33);
      osc2.stop(now + 0.33);
    } catch (e) {
      // Audio fallback silencioso
    }
  },

  // Sonido de confirmación suave para gastos o acciones
  playClick() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  },

  // Arpegio de logro o meta cumplida
  playSuccess() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (idx * 0.07));

        gain.gain.setValueAtTime(0.18, now + (idx * 0.07));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.07) + 0.24);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + (idx * 0.07));
        osc.stop(now + (idx * 0.07) + 0.25);
      });
    } catch (e) {}
  }
};

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
  FONT_SCALES: [85, 100, 115, 130],

  init() {
    this.loadPreferences();
    this.bindEvents();
  },

  getPreferences() {
    const defaultPrefs = {
      theme: 0,
      mode: 'dark',
      colorblind: 'none',
      fontScale: 100,
      soundEnabled: true,
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
    this.applyFontScale(prefs.fontScale, false);
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

  applyFontScale(scale, save = true) {
    const validScale = [85, 100, 115, 130].includes(Number(scale)) ? Number(scale) : 100;
    document.documentElement.style.setProperty('--ui-font-scale', (validScale / 100).toString());
    document.documentElement.setAttribute('data-font-scale', validScale.toString());

    // Actualizar indicador visual en el drawer si existe
    const indicator = document.getElementById('a11y-font-scale-label');
    if (indicator) {
      indicator.textContent = `${validScale}%`;
    }

    if (save) {
      const prefs = this.getPreferences();
      prefs.fontScale = validScale;
      this.savePreferences(prefs);
    }
  },

  changeFontScale(delta) {
    const prefs = this.getPreferences();
    const current = prefs.fontScale || 100;
    let nextIndex = this.FONT_SCALES.indexOf(current) + delta;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= this.FONT_SCALES.length) nextIndex = this.FONT_SCALES.length - 1;
    this.applyFontScale(this.FONT_SCALES[nextIndex], true);
  },

  toggleSound(enable = null) {
    const prefs = this.getPreferences();
    const nextState = enable !== null ? enable : !prefs.soundEnabled;
    prefs.soundEnabled = nextState;
    this.savePreferences(prefs);

    const checkbox = document.getElementById('a11y-sound-toggle');
    if (checkbox) checkbox.checked = nextState;

    if (nextState) {
      SoundEngine.playCoin();
    }
    return nextState;
  },

  applyA11yFlags(prefs) {
    document.body.classList.toggle('a11y-reduce-motion', !!prefs.reduceMotion);
    document.body.classList.toggle('a11y-focus', !!prefs.highFocus);
    document.body.classList.toggle('a11y-underline', !!prefs.underlineLinks);

    const soundCb = document.getElementById('a11y-sound-toggle');
    if (soundCb) soundCb.checked = prefs.soundEnabled !== false;

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
