// Точка входа приложения. Инициализация, загрузка данных, связывание модулей
// Подключите D3.js в index.html:
// <script src="https://d3js.org/d3.v7.min.js"></script>
import { openModal, closeModal, resetAddGoalForm, setupModalHandlers, openModalEdit } from './modal.js';
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
      // Пересчёт progress и done для всех целей + синхронизация связей
      function recalcGoals(goals) {
        // Сначала синхронизируем связи
        goals.forEach(g => {
          if (!g.parentIDs) g.parentIDs = [];
          if (!g.childIDs) g.childIDs = [];
        });
        
        // Синхронизируем связи в обе стороны
        goals.forEach(g => {
          if (g.parentIDs) {
            g.parentIDs.forEach(pid => {
              const parent = goals.find(goal => goal.id == pid);
              if (parent) {
                if (!parent.childIDs) parent.childIDs = [];
                if (!parent.childIDs.some(cid => cid == g.id)) {
                  parent.childIDs.push(g.id);
                }
              }
            });
          }
          if (g.childIDs) {
            g.childIDs.forEach(cid => {
              const child = goals.find(goal => goal.id == cid);
              if (child) {
                if (!child.parentIDs) child.parentIDs = [];
                if (!child.parentIDs.some(pid => pid == g.id)) {
                  child.parentIDs.push(g.id);
                }
              }
            });
          }
        });
        
        // Теперь пересчитываем прогресс
        goals.forEach(g => {
          if (Array.isArray(g.childIDs) && g.childIDs.length > 0) {
            const childs = g.childIDs.map(cid => goals.find(goal => goal.id == cid)).filter(Boolean);
            // Новый расчет: среднее арифметическое прогресса всех детей
            const sumProgress = childs.reduce((acc, c) => acc + (typeof c.progress === 'number' ? c.progress : (c.done ? 100 : 0)), 0);
            g.progress = childs.length > 0 ? Math.round(sumProgress / childs.length) : 0;
            g.done = g.progress === 100;
          } else {
            g.progress = g.done ? 100 : 0;
          }
        });
      }
      recalcGoals(data.goals);
      renderGraph(data.goals, graphContainer);
      window.allGoals = data.goals;
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
  // Экспортируем openModalEdit для использования из graph.js
  window.openModalEdit = openModalEdit;
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
      const description = document.getElementById('goal-description').value;
      const done = document.getElementById('goal-done').checked;
      if (!name) return;
      // Если редактируем существующую цель
      if (window.editGoalId) {
        // Получаем текущие координаты (если есть)
        const goal = { id: window.editGoalId, name, parentIDs, childIDs, description, done };
        let x = null, y = null;
        if (window.lastEditGoalObj && typeof window.lastEditGoalObj.x === 'number' && typeof window.lastEditGoalObj.y === 'number') {
          x = window.lastEditGoalObj.x;
          y = window.lastEditGoalObj.y;
        }
        goal.x = x;
        goal.y = y;

        // Обновляем связи для всех затронутых целей
        let oldRelatedGoals = new Set();
        if (window.allGoals) {
          const originalGoal = window.allGoals.find(g => g.id == window.editGoalId);
          if (originalGoal) {
            // Собираем старые связи для последующего сохранения
            if (originalGoal.parentIDs) {
              originalGoal.parentIDs.forEach(pid => oldRelatedGoals.add(pid));
            }
            if (originalGoal.childIDs) {
              originalGoal.childIDs.forEach(cid => oldRelatedGoals.add(cid));
            }
            
            // Удаляем старые связи (используем == для сравнения строк и чисел)
            if (originalGoal.parentIDs) {
              originalGoal.parentIDs.forEach(pid => {
                const parent = window.allGoals.find(g => g.id == pid);
                if (parent && parent.childIDs) {
                  parent.childIDs = parent.childIDs.filter(cid => cid != window.editGoalId);
                }
              });
            }
            if (originalGoal.childIDs) {
              originalGoal.childIDs.forEach(cid => {
                const child = window.allGoals.find(g => g.id == cid);
                if (child && child.parentIDs) {
                  child.parentIDs = child.parentIDs.filter(pid => pid != window.editGoalId);
                }
              });
            }
            
            // Добавляем новые связи
            parentIDs.forEach(pid => {
              const parent = window.allGoals.find(g => g.id == pid);
              if (parent) {
                if (!parent.childIDs) parent.childIDs = [];
                if (!parent.childIDs.some(cid => cid == window.editGoalId)) {
                  parent.childIDs.push(window.editGoalId);
                }
              }
            });
            childIDs.forEach(cid => {
              const child = window.allGoals.find(g => g.id == cid);
              if (child) {
                if (!child.parentIDs) child.parentIDs = [];
                if (!child.parentIDs.some(pid => pid == window.editGoalId)) {
                  child.parentIDs.push(window.editGoalId);
                }
              }
            });
          }
        }

        // Собираем все затронутые цели для сохранения
        let affectedGoals = [goal];
        if (window.allGoals) {
          // Добавляем текущих родителей и детей
          [...parentIDs, ...childIDs].forEach(relatedId => {
            const related = window.allGoals.find(g => g.id == relatedId);
            if (related && !affectedGoals.some(a => a.id == related.id)) {
              affectedGoals.push({
                id: related.id,
                name: related.name,
                parentIDs: related.parentIDs,
                childIDs: related.childIDs,
                description: related.description,
                done: related.done,
                progress: related.progress,
                x: related.x,
                y: related.y
              });
            }
          });
          
          // Добавляем старые связанные цели (которые могли потерять связи)
          oldRelatedGoals.forEach(relatedId => {
            const related = window.allGoals.find(g => g.id == relatedId);
            if (related && !affectedGoals.some(a => a.id == related.id)) {
              affectedGoals.push({
                id: related.id,
                name: related.name,
                parentIDs: related.parentIDs,
                childIDs: related.childIDs,
                description: related.description,
                done: related.done,
                progress: related.progress,
                x: related.x,
                y: related.y
              });
            }
          });
          
          // Рекурсивно собираем родителей для пересчёта прогресса (используем обновлённые связи)
          function collectParents(gid, acc) {
            const g = window.allGoals.find(go => go.id == gid);
            if (g && Array.isArray(g.parentIDs)) {
              g.parentIDs.forEach(pid => {
                const parent = window.allGoals.find(go => go.id == pid);
                if (parent && !acc.some(a => a.id == parent.id)) {
                  acc.push({
                    id: parent.id,
                    name: parent.name,
                    parentIDs: parent.parentIDs,
                    childIDs: parent.childIDs,
                    description: parent.description,
                    done: parent.done,
                    progress: parent.progress,
                    x: parent.x,
                    y: parent.y
                  });
                  collectParents(parent.id, acc);
                }
              });
            }
          }
          
          // Обновляем связи в самой цели
          const currentGoal = window.allGoals.find(g => g.id == window.editGoalId);
          if (currentGoal) {
            currentGoal.parentIDs = parentIDs;
            currentGoal.childIDs = childIDs;
            currentGoal.name = name;
            currentGoal.description = description;
            currentGoal.done = done;
          }
          
          collectParents(goal.id, affectedGoals);
        }
        // Сохраняем все затронутые цели
        Promise.all(affectedGoals.map(g =>
          fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(g)
          })
        ))
        .then(() => {
          closeModal();
          resetAddGoalForm();
          loadGoals();
        })
        .catch(() => alert('Ошибка при сохранении цели'));
      } else {
        // Добавление новой цели
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
            y: centerY,
            description,
            done
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
    }
    if (e.target && e.target.id === 'cancel-add-goal') {
      closeModal();
      resetAddGoalForm();
    }
  });
  // Загрузка и отрисовка целей
  loadGoals();
});
