/**
 * Открыть модальное окно для редактирования цели
 * goalDTO: { id, name, parentIDs, childIDs, x, y }
 */
export function openModalEdit(goalDTO) {
  const modal = document.getElementById('modal');
  const goalTitleInput = document.getElementById('goal-title');
  const header = modal.querySelector('h2');
  if (header) header.textContent = 'Изменить цель';
  modal.classList.remove('hidden');
  goalTitleInput.value = goalDTO.name || '';
  goalTitleInput.focus();
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
}
