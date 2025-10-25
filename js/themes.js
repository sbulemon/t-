/**
 * Система тем и настроек
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'red';
    this.effectEnabled = false;
    this.effectType = 'snow'; // Новый: 'snow' или 'halloween'
    this.effectInterval = null;
    this.effectIntervalTime = 100; // ms
    this.effectSize = 'medium';
    this.init();
  }

  init() {
    this.loadSettings();
    this.applyTheme(this.currentTheme);
    this.createSettingsPanel();
    this.setupEventListeners();
    this.checkAutoHalloween(); // Новый: авто-включение Хэллоуина
  }

  checkAutoHalloween() {
    const now = new Date();
    if (now.getMonth() === 9) { // Октябрь (месяц 9 в JS)
      this.effectEnabled = true;
      this.effectType = 'halloween';
      this.currentTheme = 'halloween'; // Авто-тема
      this.applyTheme(this.currentTheme);
      this.saveSettings();
      this.toggleEffect(true);
    }
  }

  loadSettings() {
    const savedTheme = localStorage.getItem('famelist_theme');
    const savedEffect = localStorage.getItem('famelist_effect');
    const savedEffectType = localStorage.getItem('famelist_effect_type') || 'snow';
    
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    
    if (savedEffect === 'true') {
      this.effectEnabled = true;
    }

    this.effectType = savedEffectType;
  }

  saveSettings() {
    localStorage.setItem('famelist_theme', this.currentTheme);
    localStorage.setItem('famelist_effect', this.effectEnabled.toString());
    localStorage.setItem('famelist_effect_type', this.effectType);
  }

  applyTheme(theme) {
    const themes = {
      red: {
        primary: '#ff073a',
        glow: 'rgba(255,7,58,0.3)',
        bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        card: '#151515'
      },
      gray: {
        primary: '#808080',
        glow: 'rgba(128,128,128,0.3)',
        bg: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        card: '#252525'
      },
      blue: {
        primary: '#0066ff',
        glow: 'rgba(0,102,255,0.3)',
        bg: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2a 100%)',
        card: '#151525'
      },
      purple: {
        primary: '#8b5cf6',
        glow: 'rgba(139,92,246,0.3)',
        bg: 'linear-gradient(135deg, #1a0a1a 0%, #2a1a2a 100%)',
        card: '#251525'
      },
      green: {
        primary: '#00ff00',
        glow: 'rgba(0,255,0,0.3)',
        bg: 'linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 100%)',
        card: '#152515'
      },
      orange: {
        primary: '#ff6600',
        glow: 'rgba(255,102,0,0.3)',
        bg: 'linear-gradient(135deg, #1a0a0a 0%, #2a1a0a 100%)',
        card: '#251515'
      },
      cyan: {
        primary: '#00ffff',
        glow: 'rgba(0,255,255,0.3)',
        bg: 'linear-gradient(135deg, #0a1a1a 0%, #1a2a2a 100%)',
        card: '#152525'
      },
      halloween: {  // Новая тема для Хэллоуина
        primary: '#ff7518',  // Тыквенный оранжевый
        glow: 'rgba(255,117,24,0.5)',  // Оранжевый glow с фиолетовым оттенком
        bg: 'linear-gradient(135deg, #0a0a0a 0%, #331100 100%)',  // Чёрно-оранжевый градиент
        card: '#1a0d00'  // Тёмно-оранжевый для карточек
      }
    };

    const themeColors = themes[theme];
    if (!themeColors) return;

    // Добавляем класс для анимации перехода
    document.body.classList.add('theme-transitioning');

    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeColors.primary);
    root.style.setProperty('--primary-glow', themeColors.glow);
    root.style.setProperty('--bg-gradient', themeColors.bg);
    root.style.setProperty('--card-bg', themeColors.card);

    // Удаляем класс после завершения анимации
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 500); // Соответствует длительности transition в CSS

    // Перезапускаем эффект если включен
    if (this.effectEnabled) {
      this.stopEffect();
      this.startEffect();
    }

    this.currentTheme = theme;
    this.saveSettings();
  }

  createSettingsPanel() {
    const panel = document.createElement('div');
    panel.id = 'settingsPanel';
    panel.className = 'settings-panel';
    panel.innerHTML = `
      <div class="settings-content">
        <div class="settings-header">
          <h3>Настройки сайта</h3>
          <button id="closeSettings" class="close-settings">✕</button>
        </div>
        
        <div class="settings-section">
          <h4>Темы</h4>
          <div class="theme-options">
            <button class="theme-btn red ${this.currentTheme === 'red' ? 'active' : ''}" data-theme="red">
              <div class="theme-preview red"></div>
              Красная
            </button>
            <button class="theme-btn gray ${this.currentTheme === 'gray' ? 'active' : ''}" data-theme="gray">
              <div class="theme-preview gray"></div>
              Серая
            </button>
            <button class="theme-btn blue ${this.currentTheme === 'blue' ? 'active' : ''}" data-theme="blue">
              <div class="theme-preview blue"></div>
              Синяя
            </button>
            <button class="theme-btn purple ${this.currentTheme === 'purple' ? 'active' : ''}" data-theme="purple">
              <div class="theme-preview purple"></div>
              Фиолетовая
            </button>
            <button class="theme-btn green ${this.currentTheme === 'green' ? 'active' : ''}" data-theme="green">
              <div class="theme-preview green"></div>
              Зелёная
            </button>
            <button class="theme-btn orange ${this.currentTheme === 'orange' ? 'active' : ''}" data-theme="orange">
              <div class="theme-preview orange"></div>
              Оранжевая
            </button>
            <button class="theme-btn cyan ${this.currentTheme === 'cyan' ? 'active' : ''}" data-theme="cyan">
              <div class="theme-preview cyan"></div>
              Циановая
            </button>
            <button class="theme-btn halloween ${this.currentTheme === 'halloween' ? 'active' : ''}" data-theme="halloween">  <!-- Новая кнопка -->
              <div class="theme-preview halloween"></div>
              Хэллоуин 🎃
            </button>
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Эффекты</h4>
          <div class="setting-item">
            <label class="switch">
              <input type="checkbox" id="effectToggle" ${this.effectEnabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            <span>Эффект ✨</span>
          </div>
          <div class="setting-item effect-type" style="display: ${this.effectEnabled ? 'flex' : 'none'};">
            <label>Тип эффекта:</label>
            <select id="effectType">
              <option value="snow" ${this.effectType === 'snow' ? 'selected' : ''}>Снег ❄️</option>
              <option value="halloween" ${this.effectType === 'halloween' ? 'selected' : ''}>Хэллоуин 🎃</option>
            </select>
          </div>
          <div class="setting-item effect-intensity" style="display: ${this.effectEnabled ? 'flex' : 'none'};">
            <label>Интенсивность:</label>
            <input type="range" id="effectIntensity" min="50" max="500" value="${this.effectIntervalTime || 100}" step="50">
            <span id="effectValue">Средняя</span>
          </div>
          <div class="setting-item effect-size" style="display: ${this.effectEnabled ? 'flex' : 'none'};">
            <label>Размер:</label>
            <select id="effectSize">
              <option value="small">Маленькие</option>
              <option value="medium" selected>Средние</option>
              <option value="large">Большие</option>
            </select>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.setupSettingsEvents();
  }

  setupSettingsEvents() {
    // Закрытие панели
    document.getElementById('closeSettings').addEventListener('click', () => {
      this.hideSettings();
    });

    // Переключение тем
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.switchTheme(theme);
      });
    });

    // Переключение эффекта
    document.getElementById('effectToggle').addEventListener('change', (e) => {
      this.toggleEffect(e.target.checked);
    });

    // Тип эффекта
    document.getElementById('effectType').addEventListener('change', (e) => {
      this.effectType = e.target.value;
      this.saveSettings();
      if (this.effectEnabled) {
        this.stopEffect();
        this.startEffect();
      }
    });

    // Интенсивность эффекта
    document.getElementById('effectIntensity').addEventListener('input', (e) => {
      this.effectIntervalTime = e.target.value;
      clearInterval(this.effectInterval);
      this.startEffect();
      document.getElementById('effectValue').textContent = e.target.value < 150 ? 'Высокая' : e.target.value > 350 ? 'Низкая' : 'Средняя';
    });

    // Размер эффекта
    document.getElementById('effectSize').addEventListener('change', (e) => {
      this.effectSize = e.target.value;
    });
  }

  switchTheme(theme) {
    this.applyTheme(theme);
    
    // Обновляем активную кнопку
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
  }

  toggleEffect(enabled) {
    this.effectEnabled = enabled;
    this.saveSettings();
    
    document.querySelector('.effect-type').style.display = enabled ? 'flex' : 'none';
    document.querySelector('.effect-intensity').style.display = enabled ? 'flex' : 'none';
    document.querySelector('.effect-size').style.display = enabled ? 'flex' : 'none';

    if (enabled) {
      this.startEffect();
    } else {
      this.stopEffect();
    }
  }

  startEffect() {
    if (this.effectInterval) clearInterval(this.effectInterval);
    
    const effectContainer = document.getElementById('effectContainer') || document.createElement('div');
    effectContainer.id = 'effectContainer';
    effectContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    if (!document.getElementById('effectContainer')) document.body.appendChild(effectContainer);

    this.effectInterval = setInterval(() => {
      this.createEffectElement(effectContainer);
    }, this.effectIntervalTime);
  }

  stopEffect() {
    if (this.effectInterval) {
      clearInterval(this.effectInterval);
      this.effectInterval = null;
    }
    
    const effectContainer = document.getElementById('effectContainer');
    if (effectContainer) {
      effectContainer.remove();
    }
  }

  createEffectElement(container) {
    const sizes = { small: Math.random() * 5 + 5, medium: Math.random() * 10 + 10, large: Math.random() * 15 + 15 };
    const element = document.createElement('div');
    
    let symbols, color;
    if (this.effectType === 'halloween') {
      symbols = ['🎃', '🕷️', '👻', '🦇'];  // Тыквы, пауки, приведения, летучие мыши
      color = Math.random() > 0.5 ? '#ff7518' : '#8b5cf6';  // Оранжевый или фиолетовый
      element.style.animation = `fall ${Math.random() * 3 + 2}s linear infinite, spooky 1s infinite alternate`;  // Добавил spooky анимацию
    } else {  // Snow
      symbols = ['❄', '❅', '❆'];
      color = 'white';
      element.style.animation = `fall ${Math.random() * 3 + 2}s linear infinite`;
    }

    element.style.cssText = `
      position: absolute;
      color: ${color};
      font-size: ${sizes[this.effectSize]}px;
      top: -20px;
      left: ${Math.random() * 100}%;
      opacity: ${Math.random() * 0.5 + 0.5};
    `;
    element.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    
    container.appendChild(element);
    
    setTimeout(() => element.remove(), 5000);
  }

  showSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
      panel.classList.add('show');
    }
  }

  hideSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
      panel.classList.remove('show');
    }
  }

  setupEventListeners() {
    const settingsButton = document.createElement('button');
    settingsButton.id = 'settingsButton';
    settingsButton.className = 'settings-button';
    settingsButton.innerHTML = '⚙️';
    settingsButton.title = 'Настройки';
    
    settingsButton.addEventListener('click', () => {
      this.showSettings();
    });
    
    document.body.appendChild(settingsButton);

    if (this.effectEnabled) {
      this.startEffect();
    }
  }
}

window.themeManager = new ThemeManager();

const effectCSS = document.createElement('style');
effectCSS.textContent = `
  @keyframes fall {
    to {
      transform: translateY(100vh) rotate(360deg);
    }
  }
  @keyframes spooky {  // Новая анимация для Хэллоуина (лёгкое дрожание)
    0% { transform: scale(1); }
    50% { transform: scale(1.1) rotate(5deg); }
    100% { transform: scale(1) rotate(-5deg); }
  }
`;
document.head.appendChild(effectCSS);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
