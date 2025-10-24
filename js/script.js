async function loadData(){
  // Используем систему синхронизации
  return await window.dataSync.getData();
}

function getCategoryLabel(cat){
  const map = {
    'media':'Медийки 📺',
    'fame':'Фейм 🌟',
    'mid':'Сред. фейм 📈',
    'small':'Мал. фейм 📉',
    'bomg':'Бомжи/Скам 💸',
    'product':'Товары 🛒',
    'admin':'Админы 👑',
    'coder':'Кодеры 💻',
    'other':'Прочее ❓'
  };
  return map[cat] || cat;
}

function createCard(person){
  const card = document.createElement('div');
  card.className = 'person-card';
  card.innerHTML = `
    <div class="card-header">
      <img class="card-avatar" src="${person.img||'https://via.placeholder.com/300x200?text=No+Image'}" alt="avatar">
      <div class="card-badge">${person.badgeText || ''}</div>
    </div>
    <div class="card-content">
      <h3 class="card-name">${person.name}</h3>
      <div class="card-category">${getCategoryLabel(person.category)}</div>
      <p class="card-bio">${person.info.slice(0,180)}${person.info.length>180?'...':''}</p>
    </div>
    <div class="card-footer">
      <a href="#" class="card-link" data-id="${person.id}">Подробнее →</a>
    </div>
  `;
  return card;
}

function renderGrid(persons){
  const grid = document.getElementById('famelistGrid');
  grid.innerHTML='';
  persons.forEach(p=>grid.appendChild(createCard(p)));
  // attach handlers
  document.querySelectorAll('.card-link').forEach(a=>{
    a.addEventListener('click', function(e){
      e.preventDefault();
      const id = Number(this.dataset.id);
      const person = window.ALL_PERSONS.find(x=>x.id===id);
      showDetail(person);
    });
  });
}

let currentPerson = null;

function showDetail(person){
  if(!person) return;
  currentPerson = person;
  document.getElementById('detailImg').src = person.img || 'https://via.placeholder.com/400x300?text=No+Image';
  document.getElementById('detailName').textContent = person.name;
  const badge = document.getElementById('detailBadge');
  badge.textContent = person.badgeText || '';
  document.getElementById('detailInfo').textContent = person.info || '';
  const contacts = document.getElementById('detailContacts');
  contacts.innerHTML = '';
  if(person.channel){
    const a = document.createElement('a'); a.href = person.channel; a.target='_blank'; a.textContent='Открыть канал'; a.className = 'social-btn channel-btn'; contacts.appendChild(a);
  }
  if(person.dm){
    const b = document.createElement('a'); b.href = person.dm; b.target='_blank'; b.textContent='Написать в ЛС'; b.className = 'social-btn dm-btn'; contacts.appendChild(b);
  }
  const sellerEl = document.getElementById('detailSeller');
  sellerEl.innerHTML='';
  if(person.seller){
    sellerEl.innerHTML = '<strong>Продавец: </strong>'+person.seller;
  }
  const pricesEl = document.getElementById('detailPrices');
  pricesEl.innerHTML='';
  if(person.prices){
    let html=' <strong>Цены:</strong><ul>';
    for(const k in person.prices){
      html += `<li>${k.toUpperCase()}: ${person.prices[k]}</li>`;
    }
    html += '</ul>';
    pricesEl.innerHTML = html;
  }
  document.getElementById('detailModal').classList.add('show');
  document.getElementById('detailModal').setAttribute('aria-hidden','false');
}

document.addEventListener('DOMContentLoaded', async ()=>{
  try {
    // Инициализация системы синхронизации
    await window.dataSync.init();
    
    // Загружаем данные через систему синхронизации
    const data = await loadData();
    window.ALL_PERSONS = data;
    renderGrid(data);
  } catch (error) {
    console.error('Ошибка инициализации:', error);
    showNotification('Ошибка загрузки данных. Используются демо-данные.', 'warning');
    
    // Пытаемся загрузить демо-данные
    try {
      const demoData = window.dataSync.createDemoData();
      window.ALL_PERSONS = demoData;
      renderGrid(demoData);
    } catch (demoError) {
      console.error('Ошибка загрузки демо-данных:', demoError);
      showNotification('Критическая ошибка загрузки данных', 'error');
    }
  }

  // Настраиваем обработчики событий синхронизации
  window.dataSync.addListener((event, data) => {
    switch(event) {
      case 'dataLoaded':
      case 'dataSynced':
        window.ALL_PERSONS = data;
        renderGrid(data);
        updateStats();
        break;
      case 'dataError':
        console.error('Ошибка загрузки данных:', data);
        showNotification('Ошибка загрузки данных', 'error');
        break;
      case 'syncError':
        console.error('Ошибка синхронизации:', data);
        showNotification('Ошибка синхронизации', 'warning');
        break;
    }
  });

  // Улучшенный поиск с использованием системы синхронизации
  document.getElementById('searchBox').addEventListener('input', ()=>{
    performSearch();
  });

  // Category page buttons
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      performSearch();
    });
  });

  // FAQ button
  document.getElementById('faqButton').addEventListener('click', () => {
    document.getElementById('faqModal').classList.add('show');
    document.getElementById('faqModal').setAttribute('aria-hidden', 'false');
  });

  // Close FAQ
  document.getElementById('closeFaq').addEventListener('click', () => {
    document.getElementById('faqModal').classList.remove('show');
    document.getElementById('faqModal').setAttribute('aria-hidden', 'true');
  });

  document.getElementById('faqModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('faqModal')) {
      document.getElementById('faqModal').classList.remove('show');
      document.getElementById('faqModal').setAttribute('aria-hidden', 'true');
    }
  });

  // Обработчик модального окна
  document.getElementById('closeModal').addEventListener('click', ()=>{
    document.getElementById('detailModal').classList.remove('show');
    document.getElementById('detailModal').setAttribute('aria-hidden','true');
  });

  // Обработчик клика по фону модального окна
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('detailModal')) {
      document.getElementById('detailModal').classList.remove('show');
      document.getElementById('detailModal').setAttribute('aria-hidden','true');
    }
  });

  // Share button
  document.getElementById('shareProfile').addEventListener('click', () => {
    if (navigator.share && currentPerson) {
      navigator.share({
        title: currentPerson.name,
        text: currentPerson.info.slice(0, 100) + '...',
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        showNotification('Ссылка скопирована!', 'success');
      });
    }
  });

  // Показываем статистику
  updateStats();
  
  // Показываем уведомление о локальном режиме
  checkLocalMode();

  // Halloween эффекты
  spawnBats();
  spawnPumpkins();
  spawnSpiders();
  spawnGhosts();
});

/**
 * Выполнение поиска с использованием системы синхронизации
 */
function performSearch() {
  const query = document.getElementById('searchBox').value;
  const category = document.querySelector('.page-btn.active')?.dataset.category || 'all';
  
  const results = window.dataSync.searchData(query, category);
  renderGrid(results);
}

/**
 * Обновление статистики
 */
function updateStats() {
  const stats = window.dataSync.getStats();
  if (!stats) return;
  
  // Создаем или обновляем элемент статистики
  let statsEl = document.getElementById('stats');
  if (!statsEl) {
    statsEl = document.createElement('div');
    statsEl.id = 'stats';
    statsEl.className = 'stats';
    document.querySelector('.famelist-section').appendChild(statsEl);
  }
  
  const lastUpdate = stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : 'Неизвестно';
  statsEl.innerHTML = `
    <div class="stats-item">Всего: ${stats.total}</div>
    <div class="stats-item">Обновлено: ${lastUpdate}</div>
    <div class="stats-item">Категории: ${Object.keys(stats.categories).length}</div>
  `;
}

/**
 * Показ уведомлений
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Проверка локального режима
 */
function checkLocalMode() {
  if (window.location.protocol === 'file:') {
    const localModeNotification = document.createElement('div');
    localModeNotification.className = 'local-mode-notification';
    localModeNotification.innerHTML = `
      <div class="local-mode-content">
        <strong>🔧 Локальный режим</strong>
        <p>Проект запущен в локальном режиме. Для полноценной работы с реальными данными используйте HTTP сервер.</p>
        <button onclick="this.parentElement.parentElement.remove()" class="close-local-mode">✕</button>
      </div>
    `;
    
    document.body.appendChild(localModeNotification);
    
    // Автоматически скрываем через 10 секунд
    setTimeout(() => {
      if (localModeNotification.parentNode) {
        localModeNotification.remove();
      }
    }, 10000);
  }
}

/* Halloween Functions */
function spawnBats() {
  const batsContainer = document.getElementById('halloweenBats');
  setInterval(() => {
    const bat = document.createElement('div');
    bat.className = 'bat';
    bat.textContent = '🦇';
    bat.style.left = Math.random() * 100 + '%';
    bat.style.animationDelay = Math.random() * 5 + 's';
    batsContainer.appendChild(bat);
    setTimeout(() => bat.remove(), 10000);
  }, 2000);
}

function spawnPumpkins() {
  const pumpkinsContainer = document.getElementById('halloweenPumpkins');
  for (let i = 0; i < 5; i++) {
    const pumpkin = document.createElement('div');
    pumpkin.className = 'pumpkin';
    pumpkin.textContent = '🎃';
    pumpkin.style.animationDelay = Math.random() * 2 + 's';
    pumpkinsContainer.appendChild(pumpkin);
  }
}

function spawnSpiders() {
  const spidersContainer = document.getElementById('halloweenSpiders');
  setInterval(() => {
    const spider = document.createElement('div');
    spider.className = 'spider';
    spider.textContent = '🕷️';
    spider.style.left = Math.random() * 100 + '%';
    spider.style.animationDuration = (Math.random() * 2 + 2) + 's';
    spidersContainer.appendChild(spider);
    setTimeout(() => spider.remove(), 5000);
  }, Math.random() * 5000 + 3000); /* Рандомный интервал для jump scare */
}

function spawnGhosts() {
  const ghostsContainer = document.getElementById('halloweenGhosts');
  setInterval(() => {
    const ghost = document.createElement('div');
    ghost.className = 'ghost';
    ghost.textContent = '👻';
    ghost.style.left = Math.random() * 100 + '%';
    ghost.style.top = Math.random() * 100 + '%';
    ghost.style.animationDelay = Math.random() * 3 + 's';
    ghostsContainer.appendChild(ghost);
    setTimeout(() => ghost.remove(), 10000);
  }, Math.random() * 7000 + 5000); /* Рандомные появления */
}
