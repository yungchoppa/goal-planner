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
  modal.classList.remove('hidden');
  goalTitleInput.value = '';
  goalTitleInput.focus();
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
