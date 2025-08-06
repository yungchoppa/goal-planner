/**
 * Модуль визуализации графа целей
 * Экспортирует функцию renderGraph(goals, graphContainer)
 * Использует D3.js для force layout, HTML для карточек, drag&drop
 */
export function renderGraph(goals, graphContainer) {
  graphContainer.innerHTML = '';
  // SVG для связей
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  let width = graphContainer.offsetWidth || window.innerWidth;
  let height = graphContainer.offsetHeight || 600;
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.zIndex = '0';
  graphContainer.appendChild(svg);

  // D3 force layout
  // Используем координаты из API, если есть
  const nodes = goals.map(g => ({
    id: g.id,
    name: g.name,
    x: typeof g.x === 'number' ? g.x : undefined,
    y: typeof g.y === 'number' ? g.y : undefined,
    parentIDs: g.parentIDs,
    childIDs: g.childIDs
  }));
  const links = [];
  goals.forEach(g => {
    if (g.childIDs) {
      g.childIDs.forEach(childId => {
        links.push({ source: childId, target: g.id });
      });
    }
  });

  // Всегда запускаем симуляцию, используем координаты как стартовые и фиксируем их
  nodes.forEach(n => {
    if (typeof n.x === 'number' && typeof n.y === 'number') {
      n.fx = n.x;
      n.fy = n.y;
      n._fixed = true; // пометка, что узел уже сохранён
    } else {
      n._fixed = false;
    }
  });
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(180))
    .force('charge', d3.forceManyBody().strength(-600))
    .force('center', d3.forceCenter(width / 2, height / 2));

  // HTML карточки
  const cardLayer = document.createElement('div');
  cardLayer.className = 'absolute top-0 left-0 w-full h-full';
  graphContainer.appendChild(cardLayer);

  /**
   * Обновляет визуализацию графа (линии, карточки)
   */
  function update() {
    width = graphContainer.offsetWidth || window.innerWidth;
    height = graphContainer.offsetHeight || 600;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.innerHTML = '';
    // Добавляем marker-стрелку (один раз на svg)
    if (!svg.querySelector('marker#arrowhead')) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '8');
      marker.setAttribute('markerHeight', '8');
      marker.setAttribute('refX', '6');
      marker.setAttribute('refY', '4');
      marker.setAttribute('orient', 'auto');
      marker.setAttribute('markerUnits', 'strokeWidth');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0 1 L 6 4 L 0 7 Z');
      path.setAttribute('fill', '#94a3b8');
      marker.appendChild(path);
      defs.appendChild(marker);
      svg.appendChild(defs);
    }
    const cardWidth = 220;
    const cardHeight = 80;
    // Пересоздаём массив links по актуальным связям
    const currentLinks = [];
    goals.forEach(g => {
      if (g.childIDs) {
        g.childIDs.forEach(childId => {
          currentLinks.push({ source: childId, target: g.id });
        });
      }
    });
    currentLinks.forEach(link => {
      let source = link.source;
      let target = link.target;
      if (typeof source === 'string' || typeof source === 'number') {
        source = nodes.find(n => n.id == source);
      }
      if (typeof target === 'string' || typeof target === 'number') {
        target = nodes.find(n => n.id == target);
      }
      if (!source || !target) return;
      if (
        source.x === undefined || source.y === undefined ||
        target.x === undefined || target.y === undefined
      ) return;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const tx = target.x - (dx/dist) * (cardWidth/2 + 8);
      const ty = target.y - (dy/dist) * (cardHeight/2 + 8);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', source.x);
      line.setAttribute('y1', source.y);
      line.setAttribute('x2', tx);
      line.setAttribute('y2', ty);
      // Зеленый цвет для стрелки, если source (ребенок) Done
      const isDone = goals.find(g => g.id == source.id)?.done;
      line.setAttribute('stroke', isDone ? '#22c55e' : '#94a3b8');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('marker-end', 'url(#arrowhead)');
      svg.appendChild(line);
    });
    cardLayer.innerHTML = '';
    nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return;
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg min-w-[200px] absolute select-none transition duration-200 flex';
      card.style.width = cardWidth + 'px';
      card.style.height = cardHeight + 'px';
      card.style.left = (node.x - cardWidth / 2) + 'px';
      card.style.top = (node.y - cardHeight / 2) + 'px';
      card.style.zIndex = 2;

      // Левая часть — основная зона (80%)
      const mainZone = document.createElement('div');
      mainZone.className = 'flex-1 p-4 cursor-move';
      // Добавляем ✅ к названию, если Done
      const goalObj = goals.find(g => g.id == node.id);
      const isDone = goalObj?.done;
      mainZone.innerHTML = `<div class="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">${node.name}${isDone ? ' ✅' : ''}</div>`;

      // Правая часть — зона редактирования (20%)
      const editZone = document.createElement('div');
      editZone.className = 'flex items-center justify-center w-[44px] h-full bg-slate-100 dark:bg-slate-800 rounded-r-lg shadow-md cursor-pointer transition hover:bg-slate-200 dark:hover:bg-slate-700';
      editZone.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      editZone.innerHTML = '<span class="text-lg">✏️</span>';

      // Открытие модального окна по клику на editZone
      editZone.onclick = function(e) {
        e.stopPropagation();
        if (window.openModalEdit) {
          const goal = goals.find(g => g.id == node.id);
          if (goal) {
            window.lastEditGoalObj = goal;
            window.openModalEdit(goal);
          }
        }
      };

      // Drag & drop только на основной зоне
      mainZone.onmousedown = function(e) {
        e.preventDefault();
        card.style.zIndex = 10;
        nodes.forEach(n => { if (n !== node) { n.fx = n.x; n.fy = n.y; } });
        node.fx = node.x;
        node.fy = node.y;
        const offsetX = e.clientX - node.x;
        const offsetY = e.clientY - node.y;
        function onMouseMove(ev) {
          node.fx = ev.clientX - offsetX;
          node.fy = Math.max(ev.clientY - offsetY, 48);
          node.x = node.fx;
          node.y = node.fy;
          update();
        }
        function onMouseUp() {
          card.style.zIndex = 2;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          node.x = node.fx;
          node.y = node.fy;
          node._fixed = true;
          if (typeof node.x === 'number' && typeof node.y === 'number') {
            const goal = goals.find(g => g.id == node.id);
            if (goal) {
              goal.x = node.x;
              goal.y = node.y;
              fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goal)
              }).catch(() => {});
            }
          }
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };

      card.appendChild(mainZone);
      card.appendChild(editZone);
      cardLayer.appendChild(card);
      // Drag & drop
      card.onmousedown = function(e) {
        e.preventDefault();
        card.style.zIndex = 10;
        nodes.forEach(n => { if (n !== node) { n.fx = n.x; n.fy = n.y; } });
        node.fx = node.x;
        node.fy = node.y;
        const offsetX = e.clientX - node.x;
        const offsetY = e.clientY - node.y;
        function onMouseMove(ev) {
          node.fx = ev.clientX - offsetX;
          node.fy = Math.max(ev.clientY - offsetY, 48);
          node.x = node.fx;
          node.y = node.fy;
          update();
        }
        function onMouseUp() {
          card.style.zIndex = 2;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          // Фиксируем новые координаты узла
          node.x = node.fx;
          node.y = node.fy;
          // Для перемещённых узлов всегда оставляем фиксацию
          node._fixed = true;
          // Сохраняем позицию только перемещённого узла
          if (typeof node.x === 'number' && typeof node.y === 'number') {
            const goal = goals.find(g => g.id === node.id);
            if (goal) {
              goal.x = node.x;
              goal.y = node.y;
              fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goal)
              }).catch(() => {});
            }
          }
        }
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };
    });
  }
    let tickCount = 0;
    let bulkSaved = false;
    simulation.on('tick', function() {
      update();
      tickCount++;
      // После стабилизации bulk-save новых узлов только один раз
      if (!bulkSaved && tickCount > 200) {
        nodes.forEach(n => {
          const goal = goals.find(g => g.id === n.id);
          // Сохраняем только новые узлы (без x/y)
          if (!n._fixed && goal && (typeof goal.x !== 'number' || typeof goal.y !== 'number') && typeof n.x === 'number' && typeof n.y === 'number') {
            goal.x = n.x;
            goal.y = n.y;
            fetch('/api/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(goal)
            }).catch(() => {});
            // После сохранения фиксируем их
            n.fx = n.x;
            n.fy = n.y;
            n._fixed = true;
          }
        });
        // После bulk-save снимаем фиксацию только с новых узлов, а сохранённые остаются фиксированными
        setTimeout(() => {
          nodes.forEach(n => {
            if (!n._fixed) {
              n.fx = null;
              n.fy = null;
            }
          });
        }, 100);
        bulkSaved = true;
      }
    });
    update();
    // Экспортируем функцию для внешнего вызова
    window.updateGoalVisual = function() {
      update();
    };
}
