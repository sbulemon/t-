/**
 * Система тем и настроек
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'red';
    this.snowEnabled = false;
    this.snowInterval = null;
    this.snowIntervalTime = 100; // ms
    this.snowSize = 'medium';
    this.init();
  }

  init() {
    this.loadSettings();
    this.applyTheme(this.currentTheme);
    this.createSettingsPanel();
    this.setupEventListeners();
  }

  loadSettings() {
    const savedTheme = localStorage.getItem('famelist_theme');
    const savedSnow = localStorage.getItem('famelist_snow');
    
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    
    if (savedSnow === 'true') {
      this.snowEnabled = true;
    }
  }

  saveSettings() {
    localStorage.setItem('famelist_theme', this.currentTheme);
    localStorage.setItem('famelist_snow', this.snowEnabled.toString());
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

    // Перезапускаем снег если включен
    if (this.snowEnabled) {
      this.stopSnow();
      this.startSnow();
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
          </div>
        </div>
        
        <div class="settings-section">
          <h4>Эффекты</h4>
          <div class="setting-item">
            <label class="switch">
              <input type="checkbox" id="snowToggle" ${this.snowEnabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            <span>Снег ❄️</span>
          </div>
          <div class="setting-item snow-intensity" style="display: ${this.snowEnabled ? 'flex' : 'none'};">
            <label>Интенсивность снега:</label>
            <input type="range" id="snowIntensity" min="50" max="500" value="${this.snowIntervalTime || 100}" step="50">
            <span id="snowValue">Средняя</span>
          </div>
          <div class="setting-item snow-size" style="display: ${this.snowEnabled ? 'flex' : 'none'};">
            <label>Размер снежинок:</label>
            <select id="snowSize">
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

    // Переключение снега
    document.getElementById('snowToggle').addEventListener('change', (e) => {
      this.toggleSnow(e.target.checked);
    });

    // Интенсивность снега
    document.getElementById('snowIntensity').addEventListener('input', (e) => {
      this.snowIntervalTime = e.target.value;
      clearInterval(this.snowInterval);
      this.startSnow();
      document.getElementById('snowValue').textContent = e.target.value < 150 ? 'Высокая' : e.target.value > 350 ? 'Низкая' : 'Средняя';
    });

    // Размер снежинок
    document.getElementById('snowSize').addEventListener('change', (e) => {
      this.snowSize = e.target.value;
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

  toggleSnow(enabled) {
    this.snowEnabled = enabled;
    this.saveSettings();
    
    document.querySelector('.snow-intensity').style.display = enabled ? 'flex' : 'none';
    document.querySelector('.snow-size').style.display = enabled ? 'flex' : 'none';

    if (enabled) {
      this.startSnow();
    } else {
      this.stopSnow();
    }
  }

  startSnow() {
    if (this.snowInterval) clearInterval(this.snowInterval);
    
    const snowContainer = document.getElementById('snowContainer') || document.createElement('div');
    snowContainer.id = 'snowContainer';
    snowContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    if (!document.getElementById('snowContainer')) document.body.appendChild(snowContainer);

    this.snowInterval = setInterval(() => {
      this.createSnowflake(snowContainer);
    }, this.snowIntervalTime);
  }

  stopSnow() {
    if (this.snowInterval) {
      clearInterval(this.snowInterval);
      this.snowInterval = null;
    }
    
    const snowContainer = document.getElementById('snowContainer');
    if (snowContainer) {
      snowContainer.remove();
    }
  }

  createSnowflake(container) {
    const sizes = { small: Math.random() * 5 + 5, medium: Math.random() * 10 + 10, large: Math.random() * 15 + 15 };
    const snowflake = document.createElement('div');
    snowflake.style.cssText = `
      position: absolute;
      color: white;
      font-size: ${sizes[this.snowSize]}px;
      top: -20px;
      left: ${Math.random() * 100}%;
      animation: fall ${Math.random() * 3 + 2}s linear infinite;
      opacity: ${Math.random() * 0.5 + 0.5};
    `;
    snowflake.textContent = ['❄', '❅', '❆'][Math.floor(Math.random() * 3)];
    
    container.appendChild(snowflake);
    
    setTimeout(() => snowflake.remove(), 5000);
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

    if (this.snowEnabled) {
      this.startSnow();
    }
  }
}

window.themeManager = new ThemeManager();

const snowCSS = document.createElement('style');
snowCSS.textContent = `
  @keyframes fall {
    to {
      transform: translateY(100vh) rotate(360deg);
    }
  }
`;
document.head.appendChild(snowCSS);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
