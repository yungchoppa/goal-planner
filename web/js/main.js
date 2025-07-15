


// Подключите D3.js в index.html:
// <script src="https://d3js.org/d3.v7.min.js"></script>

document.addEventListener('DOMContentLoaded', function() {
  let graphContainer = document.getElementById('goals-graph');
  if (!graphContainer) {
    graphContainer = document.createElement('div');
    graphContainer.id = 'goals-graph';
    graphContainer.className = 'relative w-full h-[80vh]';
    document.body.appendChild(graphContainer);
  }


  function renderGraph(goals) {
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
    const nodes = goals.map(g => ({ id: g.id, name: g.name }));
    const links = [];
    goals.forEach(g => {
      if (g.childIDs) {
        g.childIDs.forEach(childId => {
          links.push({ source: childId, target: g.id });
        });
      }
    });

    // (width, height) уже определены выше

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // HTML карточки
    const cardLayer = document.createElement('div');
    cardLayer.className = 'absolute top-0 left-0 w-full h-full';
    graphContainer.appendChild(cardLayer);

    function update() {
      // Обновляем размеры SVG при каждом рендере
      width = graphContainer.offsetWidth || window.innerWidth;
      height = graphContainer.offsetHeight || 600;
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      // Debug: размер links и nodes
      console.log('update() called, links:', links.length, 'nodes:', nodes.length);
      // Связи
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
      links.forEach(link => {
        // D3 forceLink мутирует link.source/target: могут быть id или объектом
        let source = link.source;
        let target = link.target;
        if (typeof source === 'string' || typeof source === 'number') {
          source = nodes.find(n => n.id === source);
        }
        if (typeof target === 'string' || typeof target === 'number') {
          target = nodes.find(n => n.id === target);
        }
        if (!source || !target) {
          console.log('skip line: source or target not found', link, source, target);
          return;
        }
        if (
          source.x === undefined || source.y === undefined ||
          target.x === undefined || target.y === undefined
        ) {
          console.log('skip line: undefined coords', {
            link,
            source: {id: source.id, x: source.x, y: source.y},
            target: {id: target.id, x: target.x, y: target.y}
          });
          return;
        }
        // Линия от центра child к краю карточки parent
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        // Смещение только у parent (конец линии)
        const tx = target.x - (dx/dist) * (cardWidth/2 + 8);
        const ty = target.y - (dy/dist) * (cardHeight/2 + 8);
        // Debug: вывод координат узлов и связей
        console.log('draw line', {
          from: {x: source.x, y: source.y, id: source.id},
          to: {x: tx, y: ty, id: target.id}
        });
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', source.x);
        line.setAttribute('y1', source.y);
        line.setAttribute('x2', tx);
        line.setAttribute('y2', ty);
        line.setAttribute('stroke', '#94a3b8');
        line.setAttribute('stroke-width', '3');
        // Стрелка у конца линии (child → parent)
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(line);
      });

      // Карточки
      cardLayer.innerHTML = '';
      nodes.forEach(node => {
        if (node.x === undefined || node.y === undefined) return;
        const card = document.createElement('div');
        // Размер карточки (должен совпадать с тем, что используется для расчёта центра)
        const cardWidth = 220; // px
        const cardHeight = 80; // px
        card.className = 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg p-4 min-w-[200px] absolute cursor-move select-none transition duration-200';
        card.style.width = cardWidth + 'px';
        card.style.height = cardHeight + 'px';
        card.style.left = (node.x - cardWidth / 2) + 'px';
        card.style.top = (node.y - cardHeight / 2) + 'px';
        card.style.zIndex = 2;
        card.innerHTML = `<div class="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">${node.name}</div>`;
        cardLayer.appendChild(card);

        // Drag & drop с фиксацией узла
        card.onmousedown = function(e) {
          e.preventDefault();
          card.style.zIndex = 10;
          // Фиксируем все узлы кроме текущего
          nodes.forEach(n => {
            if (n !== node) {
              n.fx = n.x;
              n.fy = n.y;
            }
          });
          node.fx = node.x;
          node.fy = node.y;
          // offset между курсором и позицией узла
          const offsetX = e.clientX - node.x;
          const offsetY = e.clientY - node.y;
          function onMouseMove(ev) {
            node.fx = ev.clientX - offsetX;
            // Ограничение по вертикали: не выше 64px
            node.fy = Math.max(ev.clientY - offsetY, 48);
            simulation.alpha(0.3).restart();
            update();
          }
          function onMouseUp() {
            card.style.zIndex = 2;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            // Снимаем фиксацию со всех узлов
            setTimeout(() => {
              nodes.forEach(n => {
                n.fx = null;
                n.fy = null;
              });
            }, 100);
          }
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        };
      });
    }

    let tickCount = 0;
    simulation.on('tick', function() {
      update();
      tickCount++;
      if (tickCount > 200) {
        // Фиксируем все узлы на их координатах
        nodes.forEach(n => {
          n.fx = n.x;
          n.fy = n.y;
        });
        simulation.stop();
      }
    });
    update();
  }

  function loadGoals() {
    fetch('/api/goals')
      .then(response => response.json())
      .then(data => {
        renderGraph(data.goals);
      })
      .catch(() => console.error('Ошибка при загрузке целей'));
  }

  loadGoals();
});
