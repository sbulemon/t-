/**
 * Система синхронизации данных между файлами проекта
 * Обеспечивает автоматическое обновление и валидацию данных
 */

class DataSync {
  constructor() {
    this.data = null;
    this.lastUpdate = null;
    this.cache = new Map();
    this.listeners = new Set();
    this.syncInterval = null;
    this.isOnline = navigator.onLine;
    
    this.init();
  }

  /**
   * Инициализация системы синхронизации
   */
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.startAutoSync();
    this.setupOfflineHandling();
  }

  /**
   * Загрузка данных с кэшированием
   */
  async loadData(forceReload = false) {
    const cacheKey = 'personalities_data';
    const cacheTime = localStorage.getItem('data_cache_time');
    const now = Date.now();
    
    // Проверяем кэш (действителен 5 минут)
    if (!forceReload && cacheTime && (now - parseInt(cacheTime)) < 300000) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          this.data = JSON.parse(cachedData);
          this.lastUpdate = parseInt(cacheTime);
          this.notifyListeners('dataLoaded', this.data);
          return this.data;
        } catch (e) {
          console.warn('Ошибка при загрузке кэшированных данных:', e);
        }
      }
    }

    // Проверяем, находимся ли мы в локальной среде (file://)
    const isLocalFile = window.location.protocol === 'file:';
    
    if (isLocalFile) {
      console.log('Локальная среда обнаружена, используем кэшированные данные или демо-данные');
      
      // Пытаемся загрузить из кэша
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          this.data = JSON.parse(cachedData);
          this.lastUpdate = parseInt(cacheTime) || now;
          this.notifyListeners('dataLoadedFromCache', this.data);
          return this.data;
        } catch (e) {
          console.warn('Ошибка при загрузке кэшированных данных:', e);
        }
      }
      
      // Если нет кэша, создаем демо-данные
      console.log('Создаем демо-данные для локальной среды');
      const demoData = this.createDemoData();
      this.data = demoData;
      this.lastUpdate = now;
      
      // Сохраняем демо-данные в кэш
      localStorage.setItem(cacheKey, JSON.stringify(demoData));
      localStorage.setItem('data_cache_time', now.toString());
      
      this.notifyListeners('dataLoaded', demoData);
      return demoData;
    }

    try {
      const response = await fetch('data/personalities.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.data = data;
      this.lastUpdate = now;
      
      // Сохраняем в кэш
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem('data_cache_time', now.toString());
      
      this.notifyListeners('dataLoaded', data);
      return data;
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      this.notifyListeners('dataError', error);
      
      // Пытаемся загрузить из кэша как fallback
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          this.data = JSON.parse(cachedData);
          this.notifyListeners('dataLoadedFromCache', this.data);
          return this.data;
        } catch (e) {
          console.error('Ошибка загрузки из кэша:', e);
        }
      }
      
      // Если ничего не работает, создаем демо-данные
      console.log('Создаем демо-данные как последний fallback');
      const demoData = this.createDemoData();
      this.data = demoData;
      this.lastUpdate = now;
      
      localStorage.setItem(cacheKey, JSON.stringify(demoData));
      localStorage.setItem('data_cache_time', now.toString());
      
      this.notifyListeners('dataLoaded', demoData);
      return demoData;
    }
  }

  /**
   * Валидация структуры данных
   */
  validateData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Данные должны быть массивом');
    }

    const requiredFields = ['id', 'name', 'category'];
    const validCategories = ['media', 'fame', 'mid', 'small', 'bomg', 'product', 'admin', 'coder', 'other'];
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Проверяем обязательные поля
      for (const field of requiredFields) {
        if (!(field in item)) {
          throw new Error(`Отсутствует обязательное поле "${field}" в элементе ${i}`);
        }
      }
      
      // Проверяем валидность категории
      if (!validCategories.includes(item.category)) {
        console.warn(`Неизвестная категория "${item.category}" для элемента ${item.name}`);
      }
      
      // Проверяем уникальность ID
      const duplicateIds = data.filter((d, index) => d.id === item.id && index !== i);
      if (duplicateIds.length > 0) {
        throw new Error(`Дублирующийся ID ${item.id} для элемента ${item.name}`);
      }
    }
    
    return true;
  }

  /**
   * Синхронизация данных с сервером
   */
  async syncData() {
    if (!this.isOnline) {
      console.log('Офлайн режим - синхронизация отложена');
      return;
    }

    try {
      const data = await this.loadData(true);
      this.validateData(data);
      this.notifyListeners('dataSynced', data);
      console.log('Данные успешно синхронизированы');
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      this.notifyListeners('syncError', error);
    }
  }

  /**
   * Получение данных с автоматической синхронизацией
   */
  async getData() {
    if (!this.data) {
      await this.loadData();
    }
    return this.data;
  }

  /**
   * Поиск по данным
   */
  searchData(query, category = 'all') {
    if (!this.data) return [];
    
    let results = this.data;
    
    if (category !== 'all') {
      results = results.filter(item => item.category === category);
    }
    
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        (item.info && item.info.toLowerCase().includes(searchTerm))
      );
    }
    
    return results;
  }

  /**
   * Получение статистики данных
   */
  getStats() {
    if (!this.data) return null;
    
    const stats = {
      total: this.data.length,
      categories: {},
      lastUpdate: this.lastUpdate
    };
    
    this.data.forEach(item => {
      stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Настройка слушателей событий
   */
  setupEventListeners() {
    // Слушаем изменения онлайн статуса
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Слушаем изменения в localStorage (для синхронизации между вкладками)
    window.addEventListener('storage', (e) => {
      if (e.key === 'personalities_data') {
        this.loadData(true);
      }
    });
  }

  /**
   * Запуск автоматической синхронизации
   */
  startAutoSync(interval = 300000) { // 5 минут по умолчанию
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.syncData();
    }, interval);
  }

  /**
   * Остановка автоматической синхронизации
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Настройка офлайн обработки
   */
  setupOfflineHandling() {
    // Service Worker для кэширования (если поддерживается)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('Service Worker не поддерживается:', err);
      });
    }
  }

  /**
   * Подписка на события синхронизации
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Уведомление слушателей
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Ошибка в слушателе событий:', error);
      }
    });
  }

  /**
   * Экспорт данных
   */
  exportData(format = 'json') {
    if (!this.data) return null;
    
    switch (format) {
      case 'json':
        return JSON.stringify(this.data, null, 2);
      case 'csv':
        return this.convertToCSV(this.data);
      default:
        throw new Error(`Неподдерживаемый формат: ${format}`);
    }
  }

  /**
   * Конвертация в CSV
   */
  convertToCSV(data) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Очистка кэша
   */
  clearCache() {
    localStorage.removeItem('personalities_data');
    localStorage.removeItem('data_cache_time');
    this.cache.clear();
  }

  /**
   * Получение информации о кэше
   */
  getCacheInfo() {
    const cacheTime = localStorage.getItem('data_cache_time');
    const cacheSize = localStorage.getItem('personalities_data')?.length || 0;
    
    return {
      lastUpdate: cacheTime ? new Date(parseInt(cacheTime)) : null,
      size: cacheSize,
      isExpired: cacheTime ? (Date.now() - parseInt(cacheTime)) > 300000 : true
    };
  }

  /**
   * Создание демо-данных для локальной среды
   */
  createDemoData() {
    return [
      {
        "id": 1,
        "name": "Демо пользователь 1",
        "info": "Это демо-данные для локальной разработки. В реальной среде данные будут загружаться из JSON файла.",
        "channel": "https://t.me/demo",
        "dm": "https://t.me/demo",
        "category": "media",
        "badge": "badge-top",
        "badgeText": "Демо Медийка",
        "img": "https://via.placeholder.com/300x200/ff073a/ffffff?text=Demo+1"
      },
      {
        "id": 2,
        "name": "Демо пользователь 2",
        "info": "Система синхронизации работает в локальном режиме. Все функции доступны, но данные загружаются из кэша или создаются автоматически.",
        "channel": "https://t.me/demo2",
        "dm": "https://t.me/demo2",
        "category": "fame",
        "badge": "badge-top",
        "badgeText": "Демо Фейм",
        "img": "https://via.placeholder.com/300x200/ff073a/ffffff?text=Demo+2"
      },
      {
        "id": 3,
        "name": "Демо пользователь 3",
        "info": "Для полноценной работы с реальными данными запустите проект через HTTP сервер (например, Live Server в VS Code).",
        "channel": "https://t.me/demo3",
        "dm": "https://t.me/demo3",
        "category": "mid",
        "badge": "badge-mid",
        "badgeText": "Средний фейм",
        "img": "https://via.placeholder.com/300x200/ff073a/ffffff?text=Demo+3"
      },
      {
        "id": 4,
        "name": "Демо пользователь 4",
        "info": "Все функции системы синхронизации работают: кэширование, резервное копирование, панель администратора.",
        "channel": "https://t.me/demo4",
        "dm": "https://t.me/demo4",
        "category": "small",
        "badge": "badge-small",
        "badgeText": "Малый фейм",
        "img": "https://via.placeholder.com/300x200/ff073a/ffffff?text=Demo+4"
      },
      {
        "id": 5,
        "name": "Демо пользователь 5",
        "info": "Попробуйте открыть панель администратора (кнопка ⚙️) для управления системой синхронизации.",
        "channel": "https://t.me/demo5",
        "dm": "https://t.me/demo5",
        "category": "product",
        "badge": "badge-product",
        "badgeText": "Товары",
        "img": "https://via.placeholder.com/300x200/ff073a/ffffff?text=Demo+5"
      }
    ];
  }
}

// Создаем глобальный экземпляр
window.dataSync = new DataSync();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataSync;
}
