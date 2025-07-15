document.addEventListener('DOMContentLoaded', function() {
  const wordsList = document.getElementById('words-list');
  const wordInput = document.getElementById('word-input');
  const addBtn = document.getElementById('add-btn');

  function renderWords(words) {
    wordsList.innerHTML = '';
    words.forEach(function(word) {
      const li = document.createElement('li');
      li.textContent = word;
      wordsList.appendChild(li);
    });
  }

  function loadWords() {
    fetch('/api/words')
      .then(response => response.json())
      .then(data => {
        renderWords(data.words);
      })
      .catch(() => console.error('Ошибка при загрузке слов'));
  }

  // Загружаем слова при загрузке страницы
  loadWords();

  addBtn.addEventListener('click', function() {
    const word = wordInput.value.trim();
    if (word) {
      fetch('/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word })
      })
      .then(response => response.json())
      .then(data => {
        renderWords(data.words);
        wordInput.value = '';
        wordInput.focus();
      })
      .catch(() => alert('Ошибка при добавлении слова'));
    }
  });

  wordInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });
});
