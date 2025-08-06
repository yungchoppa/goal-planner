// Точка входа приложения. Инициализация, загрузка данных, связывание модулей
// Подключите D3.js в index.html:
// <script src="https://d3js.org/d3.v7.min.js"></script>
import { openModal, closeModal, resetAddGoalForm, setupModalHandlers } from './modal.js';
import { setupAutocomplete } from './autocomplete.js';
import { renderGraph } from './graph.js';

let graphContainer = null; // Глобально для всех функций

/**
 * Загрузка целей с сервера и инициализация графа и автокомплита
 */
function loadGoals() {
  fetch('/api/goals')
    .then(response => response.json())
    .then(data => {
      renderGraph(data.goals, graphContainer);
      // --- Autocomplete for Add Goal form ---
      if (document.getElementById('parent-autocomplete') && document.getElementById('child-autocomplete')) {
        let parentAuto, childAuto;
        parentAuto = setupAutocomplete(data.goals, 'parent-autocomplete', 'parent-dropdown', 'parent-selected', () => childAuto ? childAuto.getSelected() : []);
        childAuto = setupAutocomplete(data.goals, 'child-autocomplete', 'child-dropdown', 'child-selected', () => parentAuto ? parentAuto.getSelected() : []);
        window.parentAuto = parentAuto;
        window.childAuto = childAuto;
      }
    })
    .catch(() => console.error('Ошибка при загрузке целей'));
}

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', function() {
  // Модальное окно
  setupModalHandlers();
  const addCardBtn = document.getElementById('add-card-btn');
  if (addCardBtn) {
    addCardBtn.addEventListener('click', openModal);
  }
  // Контейнер для графа
  graphContainer = document.getElementById('goals-graph');
  if (!graphContainer) {
    graphContainer = document.createElement('div');
    graphContainer.id = 'goals-graph';
    graphContainer.className = 'relative w-full h-[80vh]';
    document.body.appendChild(graphContainer);
  }
  // --- Add Goal form submit logic ---
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'save-btn') {
      const name = document.getElementById('goal-title').value.trim();
      const parentIDs = window.parentAuto ? window.parentAuto.getSelected().map(String) : [];
      const childIDs = window.childAuto ? window.childAuto.getSelected().map(String) : [];
      if (!name) return;
      
      // Задаём координаты для новой цели в центре экрана
      const centerX = (graphContainer.offsetWidth || window.innerWidth) / 2;
      const centerY = (graphContainer.offsetHeight || 600) / 2;
      
      fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          parentIDs, 
          childIDs,
          x: centerX,
          y: centerY
        })
      })
        .then(res => {
          if (!res.ok) throw new Error('Server error');
          return res.json();
        })
        .then(() => {
          closeModal();
          resetAddGoalForm();
          loadGoals();
        })
        .catch(() => alert('Ошибка при добавлении цели'));
    }
    if (e.target && e.target.id === 'cancel-add-goal') {
      closeModal();
      resetAddGoalForm();
    }
  });
  // Загрузка и отрисовка целей
  loadGoals();
});
