document.addEventListener('DOMContentLoaded', () => {
    const config = {
        ordenTareas: ["Flejar+Paquete", "Paquete", "Bobina", "Cuna"],
        abrev: {"Flejar+Paquete": "F+P", "Paquete": "P", "Bobina": "B", "Cuna": "C"},
        tiempos: {"Flejar+Paquete": 6, "Paquete": 3, "Bobina": 8, "Cuna": 5},
        coloresTareas: {"Flejar+Paquete": 'rgba(25, 135, 84, 0.8)', "Paquete": 'rgba(13, 110, 253, 0.8)', "Bobina": 'rgba(255, 193, 7, 0.8)', "Cuna": 'rgba(220, 53, 69, 0.8)'},
        JORNADA_MINUTOS: 465
    };

    let state = {
        puestos: JSON.parse(localStorage.getItem('puestos') || '[]'),
        log: JSON.parse(localStorage.getItem('registroTareas') || '[]'),
        chartInstance: null
    };

    const savePuestos = () => localStorage.setItem('puestos', JSON.stringify(state.puestos));
    const saveLog = () => localStorage.setItem('registroTareas', JSON.stringify(state.log));
    const getHoy = () => new Date().toDateString();

    function renderAll() {
        renderPuestos();
        renderDashboard();
        renderLog();
    }

    function renderPuestos() {
        document.getElementById('puestos-container').innerHTML = state.puestos.map(p => `
            <div class="puesto">
                <div class="puesto-header"><span>Puesto ${p}</span><button class="quitar-puesto-btn" data-puesto="${p}">X</button></div>
                <div class="tarea-buttons">${config.ordenTareas.map(t => `<button class="add-tarea-btn ${config.abrev[t].replace('+','-')}" data-puesto="${p}" data-tarea="${t}">${config.abrev[t]}</button>`).join('')}</div>
            </div>
        `).join('');
    }

    function renderDashboard() {
        const logHoy = state.log.filter(l => l.fecha === getHoy());
        const contador = logHoy.reduce((acc, l) => {
            acc[l.puesto] = acc[l.puesto] || { total: 0, ...config.ordenTareas.reduce((a, t) => ({...a, [t]: 0}), {})};
            acc[l.puesto][l.tarea]++;
            acc[l.puesto].total++;
            return acc;
        }, {});
        const puestosOrdenados = Object.keys(contador).sort((a,b) => contador[b].total - contador[a].total);
        if (puestosOrdenados.length === 0) {
            document.getElementById('dashboard-container').innerHTML = '<p>No hay registros para hoy.</p>';
            return;
        }
        let table = '<table class="tabla-resumen"><thead><tr><th>Puesto</th>' + config.ordenTareas.map(t => `<th>${config.abrev[t]}</th>`).join('') + '<th>Total</th></tr></thead><tbody>';
        puestosOrdenados.forEach(p => {
            table += `<tr><td>Puesto ${p}</td>` + config.ordenTareas.map(t => `<td>${contador[p][t]}</td>`).join('') + `<td>${contador[p].total}</td></tr>`;
        });
        document.getElementById('dashboard-container').innerHTML = table + '</tbody></table>';
    }

    function renderLog() {
        document.getElementById('log-container').innerHTML = state.log.filter(l => l.fecha === getHoy()).slice(0, 50).map(l => `
            <div class="log-entry">
                <span><strong>Puesto ${l.puesto}</strong> | ${l.hora} | ${config.abrev[l.tarea]}</span>
                <button class="eliminar-log-btn" data-id="${l.id}">X</button>
            </div>
        `).join('');
    }
    
    // ... Implementaciones de renderHistorial, renderHoras, renderGraficas aquí

    function setupListeners() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark-mode' : '');
        });

        document.querySelector('.modo-toggle').addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                const vista = e.target.dataset.vista;
                document.querySelectorAll('.vista-container').forEach(v => v.classList.remove('active'));
                document.getElementById(`vista-${vista}`).classList.add('active');
                document.querySelectorAll('.modo-toggle button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        document.getElementById('add-puesto-btn').addEventListener('click', () => {
            const input = document.getElementById('nuevo-puesto-input');
            const num = input.value.trim();
            if (num && !state.puestos.includes(num)) {
                state.puestos.push(num);
                state.puestos.sort((a, b) => parseInt(a) - parseInt(b));
                savePuestos();
                renderPuestos();
            }
            input.value = '';
        });

        document.body.addEventListener('click', e => {
            if (e.target.classList.contains('add-tarea-btn')) {
                const { puesto, tarea } = e.target.dataset;
                const now = new Date();
                state.log.unshift({ id: Date.now(), puesto, tarea, fecha: now.toDateString(), hora: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) });
                saveLog();
                renderAll();
            }
            // Agrega aquí la lógica para quitar puesto y eliminar log
        });
    }

    function init() {
        if (localStorage.getItem('theme') === 'dark-mode') {
            document.body.classList.add('dark-mode');
            document.getElementById('theme-toggle').textContent = '☀️';
        }
        setupListeners();
        renderAll();
    }

    init();
});
