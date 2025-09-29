document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const config = {
        ordenTareas: ["Flejar+Paquete", "Paquete", "Bobina", "Cuna"],
        abrev: {"Flejar+Paquete": "F+P", "Paquete": "P", "Bobina": "B", "Cuna": "C"},
        tiempos: {"Flejar+Paquete": 6, "Paquete": 3, "Bobina": 8, "Cuna": 5},
        coloresTareas: {"Flejar+Paquete": 'rgba(25, 135, 84, 0.8)', "Paquete": 'rgba(13, 110, 253, 0.8)', "Bobina": 'rgba(255, 193, 7, 0.8)', "Cuna": 'rgba(220, 53, 69, 0.8)'},
        // --- NUEVA LÍNEA DE COLORES FIJOS ---
        coloresFijosPuestos: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'], // Rojo, Azul, Verde, Amarillo
        JORNADA_MINUTOS: 465
    };

    // --- ESTADO ---
    let state = {
        puestos: JSON.parse(localStorage.getItem('puestos') || '[]'),
        log: JSON.parse(localStorage.getItem('registroTareas') || '[]'),
        chartInstance: null
    };

    // --- FUNCIONES DE GUARDADO ---
    const savePuestos = () => localStorage.setItem('puestos', JSON.stringify(state.puestos));
    const saveLog = () => localStorage.setItem('registroTareas', JSON.stringify(state.log));
    const getHoy = () => new Date().toDateString();

    // --- FUNCIÓN DE COLOR (ACTUALIZADA) ---
    function getColorPuesto(puesto) {
        const index = state.puestos.indexOf(puesto);
        if (index >= 0 && index < config.coloresFijosPuestos.length) {
            return config.coloresFijosPuestos[index];
        }
        let hash = 0;
        for (let i = 0; i < puesto.length; i++) {
            hash = puesto.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    }

    // --- RENDERIZADO DE UI ---
    function renderAll() {
        renderPuestos();
        renderDashboard();
        renderLog();
    }

    function renderPuestos() {
        document.getElementById('puestos-container').innerHTML = state.puestos.map(p => `
            <div class="puesto" style="border-left: 5px solid ${getColorPuesto(p)}">
                <div class="puesto-header"><span>Puesto ${p}</span><button class="quitar-puesto-btn" data-puesto="${p}">X</button></div>
                <div class="tarea-buttons">${config.ordenTareas.map(t => `<button class="add-tarea-btn ${config.abrev[t].replace('+','-')}" data-puesto="${p}" data-tarea="${t}">${config.abrev[t]}</button>`).join('')}</div>
            </div>
        `).join('');
    }
    
    function renderDashboard() {
        // ... (código sin cambios)
    }

    function renderLog() {
        // ... (código sin cambios)
    }

    function renderHistorial() {
        // ... (código sin cambios)
    }

    function renderDistribucionHoras() {
        // ... (código sin cambios)
    }
    
    function renderGraficas(periodo) {
        // ... (código sin cambios)
    }

    // --- LÓGICA DE ACCIONES Y EVENTOS ---
    function setupListeners() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark-mode' : '');
            if(document.getElementById('vista-graficas').classList.contains('active')) renderGraficas(document.querySelector('.filtros-graficas button.active').dataset.periodo);
        });

        document.querySelector('.modo-toggle').addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                const vista = e.target.dataset.vista;
                document.querySelectorAll('.vista-container, .modo-toggle button').forEach(el => el.classList.remove('active'));
                document.getElementById(`vista-${vista}`).classList.add('active');
                e.target.classList.add('active');
                if (vista === 'historial') renderHistorial();
                if (vista === 'horas') renderDistribucionHoras();
                if (vista === 'graficas') renderGraficas('daily');
            }
        });

        document.querySelector('.filtros-graficas').addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                document.querySelectorAll('.filtros-graficas button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                renderGraficas(e.target.dataset.periodo);
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

        document.getElementById('clear-today-btn').addEventListener('click', () => {
            if (confirm('¿Seguro que quieres borrar todos los registros de hoy?')) {
                state.log = state.log.filter(l => l.fecha !== getHoy());
                saveLog();
                renderAll();
            }
        });

        document.body.addEventListener('click', e => {
            const target = e.target;
            if (target.classList.contains('add-tarea-btn')) {
                const { puesto, tarea } = target.dataset;
                const now = new Date();
                state.log.unshift({ id: Date.now(), puesto, tarea, fecha: now.toDateString(), hora: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) });
                saveLog();
                renderAll();
            }
            if (target.classList.contains('quitar-puesto-btn')) {
                if (confirm(`¿Seguro que quieres quitar el puesto ${target.dataset.puesto}?`)) {
                    state.puestos = state.puestos.filter(p => p !== target.dataset.puesto);
                    savePuestos();
                    renderPuestos();
                }
            }
            if (target.classList.contains('eliminar-log-btn')) {
                state.log = state.log.filter(l => l.id !== parseInt(target.dataset.id));
                saveLog();
                renderAll();
            }
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
