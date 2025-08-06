/**
 * Модуль автокомплита для мульти-выбора целей
 * Экспортирует функцию setupAutocomplete(goals, inputId, dropdownId, selectedId, getOtherSelected)
 * Возвращает объект с методами getSelected и setSelected
 */
export function setupAutocomplete(goals, inputId, dropdownId, selectedId, getOtherSelected) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const selected = document.getElementById(selectedId);
  let selectedGoals = [];
  function renderDropdown(filter) {
    dropdown.innerHTML = '';
    const filterVal = filter.trim().toLowerCase();
    const otherSelected = getOtherSelected ? getOtherSelected() : [];
    const filtered = goals.filter(g =>
      !selectedGoals.includes(g.id) &&
      !otherSelected.includes(g.id) &&
      (filterVal === '' || g.name.toLowerCase().includes(filterVal))
    );
    if (filtered.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }
    filtered.forEach(g => {
      const opt = document.createElement('div');
      opt.className = 'px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700';
      opt.textContent = g.name;
      opt.onclick = () => {
        selectedGoals.push(g.id);
        renderSelected();
        dropdown.classList.add('hidden');
        input.value = '';
      };
      dropdown.appendChild(opt);
    });
    dropdown.classList.remove('hidden');
  }
  function renderSelected() {
    selected.innerHTML = '';
    selectedGoals.forEach(id => {
      const g = goals.find(goal => goal.id === id);
      if (!g) return;
      const tag = document.createElement('span');
      tag.className = 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded px-2 py-1 text-xs flex items-center gap-1';
      tag.textContent = g.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'ml-1 text-red-500 hover:text-red-700';
      remove.innerHTML = '&times;';
      remove.onclick = () => {
        selectedGoals = selectedGoals.filter(goalId => goalId !== id);
        renderSelected();
      };
      tag.appendChild(remove);
      selected.appendChild(tag);
    });
  }
  input.addEventListener('input', e => {
    renderDropdown(e.target.value);
  });
  input.addEventListener('focus', e => {
    renderDropdown(e.target.value);
  });
  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.add('hidden'), 150);
  });
  return {
    getSelected: () => selectedGoals,
    setSelected: ids => { selectedGoals = ids; renderSelected(); },
    updateGoals: newGoals => { goals = newGoals; }
  };
}
