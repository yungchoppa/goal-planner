document.addEventListener('DOMContentLoaded', function() {
  const addCardBtn = document.getElementById('add-card-btn');
  const modal = document.getElementById('modal');
  const saveBtn = document.getElementById('save-btn');
  const goalTitleInput = document.getElementById('goal-title');

  // Открыть модальное окно
  addCardBtn.addEventListener('click', function() {
    modal.classList.remove('hidden');
    goalTitleInput.value = '';
    goalTitleInput.focus();
  });

  // Закрыть модальное окно при клике вне окна или по Esc
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('hidden') && e.key === 'Escape') {
      modal.classList.add('hidden');
    }
  });

  // Сохранить цель (пока просто закрывает окно)
  saveBtn.addEventListener('click', function() {
    modal.classList.add('hidden');
    // Здесь будет логика добавления цели
  });
});
