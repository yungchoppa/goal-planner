// Вычисляет цвет прогресс-бара по проценту (от красного к зеленому)
function getProgressColor(percent) {
  // Плавный переход от красного (0%) к зеленому (100%) через HSL
  // 0% = 0deg (red), 100% = 120deg (green)
  const hue = Math.round((percent / 100) * 120);
  return `hsl(${hue}, 100%, 45%)`;
}
// Рекурсивно обновляет прогресс и статус 'Done' у родителей
function updateParentGoals(goalId) {
  if (!window.allGoals) return;
  const goal = window.allGoals.find(g => g.id === goalId);
  if (!goal || !Array.isArray(goal.parentIDs)) return;
  goal.parentIDs.forEach(pid => {
    const parent = window.allGoals.find(g => g.id === pid);
    if (parent && Array.isArray(parent.childIDs) && parent.childIDs.length > 0) {
      const childs = parent.childIDs.map(cid => window.allGoals.find(g => g.id === cid)).filter(Boolean);
      // Новый расчет: среднее арифметическое прогресса всех детей
      const sumProgress = childs.reduce((acc, c) => acc + (typeof c.progress === 'number' ? c.progress : (c.done ? 100 : 0)), 0);
      const progress = childs.length > 0 ? Math.round(sumProgress / childs.length) : 0;
      parent.progress = progress;
      parent.done = progress === 100;
      // Визуальное обновление (если есть функция рендера)
      if (window.updateGoalVisual) window.updateGoalVisual(parent.id);
      // Рекурсивно обновить родителей выше
      updateParentGoals(parent.id);
    }
  });
}
/**
 * Открыть модальное окно для редактирования цели
 * goalDTO: { id, name, parentIDs, childIDs, x, y }
 */
export function openModalEdit(goalDTO) {
  // Вычисляем прогресс для текущей цели
  let progress = 0;
  const doneInput = document.getElementById('goal-done');
  if (goalDTO && Array.isArray(goalDTO.childIDs) && goalDTO.childIDs.length > 0 && window.allGoals) {
    const childs = goalDTO.childIDs.map(cid => window.allGoals.find(g => g.id === cid)).filter(Boolean);
    // Новый расчет: среднее арифметическое прогресса всех детей
    const sumProgress = childs.reduce((acc, c) => acc + (typeof c.progress === 'number' ? c.progress : (c.done ? 100 : 0)), 0);
    progress = childs.length > 0 ? Math.round(sumProgress / childs.length) : 0;
    // Если прогресс 100%, отмечаем чекбокс Done
    if (doneInput) doneInput.checked = progress === 100;
  } else {
    // Нет детей: прогресс зависит только от чекбокса
    progress = goalDTO.done ? 100 : 0;
    if (doneInput) doneInput.checked = !!goalDTO.done;
  }
  const progressBar = document.getElementById('goal-progress-bar');
  const progressLabel = document.getElementById('goal-progress-label');
  if (progressBar) {
    progressBar.style.width = progress + '%';
    progressBar.style.backgroundColor = getProgressColor(progress);
  }
  if (progressLabel) progressLabel.textContent = progress + '%';
  const modal = document.getElementById('modal');
  const goalTitleInput = document.getElementById('goal-title');
  const header = modal.querySelector('h2');
  if (header) header.textContent = 'Изменить цель';
  modal.classList.remove('hidden');
  goalTitleInput.value = goalDTO.name || '';
  goalTitleInput.focus();
  const descInput = document.getElementById('goal-description');
  if (descInput) descInput.value = goalDTO.description || '';
  // Автокомплиты
  let parentIDs = goalDTO.parentIDs ? goalDTO.parentIDs.map(String) : [];
  let childIDs = goalDTO.childIDs ? goalDTO.childIDs.map(String) : [];
  if (window.allGoals && parentIDs.length === 0) {
    parentIDs = window.allGoals.filter(g => g.childIDs && g.childIDs.includes(goalDTO.id)).map(g => String(g.id));
  }
  if (window.allGoals && childIDs.length === 0) {
    childIDs = window.allGoals.filter(g => g.parentIDs && g.parentIDs.includes(goalDTO.id)).map(g => String(g.id));
  }
  if (window.parentAuto) window.parentAuto.setSelected(parentIDs);
  if (window.childAuto) window.childAuto.setSelected(childIDs);
  
  // Обновляем автокомплиты, исключая текущую цель из списка доступных опций
  if (window.allGoals && goalDTO.id) {
    const filteredGoals = window.allGoals.filter(g => g.id != goalDTO.id);
    if (window.parentAuto) {
      window.parentAuto.updateGoals(filteredGoals);
    }
    if (window.childAuto) {
      window.childAuto.updateGoals(filteredGoals);
    }
  }
  
  // Сохраняем id редактируемой цели
  window.editGoalId = goalDTO.id;
}
/**
 * Модуль управления модальным окном добавления цели
 * Экспортирует функции openModal(), closeModal(), resetAddGoalForm(), setupModalHandlers()
 */

/**
 * Открыть модальное окно и сфокусировать поле ввода
 */
export function openModal() {
  // Сбросить прогресс
  const progressBar = document.getElementById('goal-progress-bar');
  const progressLabel = document.getElementById('goal-progress-label');
  if (progressBar) {
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = getProgressColor(0);
  }
  if (progressLabel) progressLabel.textContent = '0%';
  const doneInput = document.getElementById('goal-done');
  if (doneInput) doneInput.checked = false;
  const modal = document.getElementById('modal');
  const goalTitleInput = document.getElementById('goal-title');
  const header = modal.querySelector('h2');
  if (header) header.textContent = 'Новая цель';
  modal.classList.remove('hidden');
  goalTitleInput.value = '';
  goalTitleInput.focus();
  window.editGoalId = null;
  // Сбросить выбранные parents/childs
  if (window.parentAuto) window.parentAuto.setSelected([]);
  if (window.childAuto) window.childAuto.setSelected([]);
  
  // Восстанавливаем полный список целей для автокомплита
  if (window.allGoals) {
    if (window.parentAuto) window.parentAuto.updateGoals(window.allGoals);
    if (window.childAuto) window.childAuto.updateGoals(window.allGoals);
  }
  
  const descInput = document.getElementById('goal-description');
  if (descInput) descInput.value = '';
}

/**
 * Закрыть модальное окно
 */
export function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Сбросить форму добавления цели
 */
export function resetAddGoalForm() {
  const title = document.getElementById('goal-title');
  if (title) title.value = '';
  if (window.parentAuto) window.parentAuto.setSelected([]);
  if (window.childAuto) window.childAuto.setSelected([]);
}

/**
 * Инициализировать обработчики для закрытия модального окна по клику вне окна и по Esc
 */
export function setupModalHandlers() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('hidden') && e.key === 'Escape') {
      closeModal();
    }
  });

  // Обработчик для чекбокса Done: всегда мгновенно обновляет прогресс-бар
  const doneInput = document.getElementById('goal-done');
  if (doneInput) {
    doneInput.addEventListener('change', function() {
      const progressBar = document.getElementById('goal-progress-bar');
      const progressLabel = document.getElementById('goal-progress-label');
      const progress = doneInput.checked ? 100 : 0;
      if (progressBar) {
        progressBar.style.width = progress + '%';
        progressBar.style.backgroundColor = getProgressColor(progress);
      }
      if (progressLabel) progressLabel.textContent = progress + '%';

      // Обновляем статус и прогресс текущей цели в window.allGoals
      if (window.editGoalId && window.allGoals) {
        const goal = window.allGoals.find(g => g.id === window.editGoalId);
        if (goal) {
          goal.done = doneInput.checked;
          goal.progress = progress;
      // Визуальное обновление графа (стрелки, ✅)
      if (window.updateGoalVisual) window.updateGoalVisual();
      // Обновить родителей рекурсивно
      updateParentGoals(goal.id);
        }
      }
    });
  }
}
