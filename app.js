document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const config = {
        ordenTareas: ["Flejar+Paquete", "Paquete", "Bobina", "Cuna"],
        abrev: {"Flejar+Paquete": "F+P", "Paquete": "P", "Bobina": "B", "Cuna": "C"},
        tiempos: {"Flejar+Paquete": 6, "Paquete": 3, "Bobina": 8, "Cuna": 5},
        coloresTareas: {"Flejar+Paquete": 'rgba(25, 135, 84, 0.8)', "Paquete": 'rgba(13, 110, 253, 0.8)', "Bobina": 'rgba(255, 193, 7, 0.8)', "Cuna": 'rgba(220, 53, 69, 0.8)'},
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

    // --- LÓGICA DE COLORES (ACTUALIZADA) ---
    function getColorPuesto(puesto) {
        const index = state.puestos.indexOf(puesto);

        // Si el puesto es uno de los primeros cuatro, usa los colores fijos.
        if (index >= 0 && index < config.coloresFijosPuestos.length) {
            return config.coloresFijosPuestos[index];
        }

        // Para el resto, genera un color único y consistente basado en el número del puesto.
        let hash = 0;
        for (let i = 0; i < puesto.length; i++) {
            hash = puesto.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Convertir a entero de 32 bits
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
        // (Esta función no necesita cambios, ya que llama a getColorPuesto)
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
            table += `<tr><td><span style="color:${getColorPuesto(p)}; font-weight:bold;">Puesto ${p}</span></td>` + config.ordenTareas.map(t => `<td>${contador[p][t]}</td>`).join('') + `<td>${contador[p].total}</td></tr>`;
        });
        document.getElementById('dashboard-container').innerHTML = table + '</tbody></table>';
    }

    function renderLog() {
        // (Esta función no necesita cambios)
        document.getElementById('log-container').innerHTML = state.log.filter(l => l.fecha === getHoy()).slice(0, 50).map(l => `
            <div class="log-entry">
                <span><strong style="color:${getColorPuesto(l.puesto)};">Puesto ${l.puesto}</strong> | ${l.hora} | ${config.abrev[l.tarea]}</span>
                <button class="eliminar-log-btn" data-id="${l.id}">X</button>
            </div>
        `).join('');
    }

    // --- (El resto de funciones: renderHistorial, renderHoras, renderGraficas, setupListeners, init, etc., permanecen igual que en la respuesta anterior) ---
    // ...
    // PEGA AQUÍ EL RESTO DEL CÓDIGO DE `app.js` DE LA RESPUESTA ANTERIOR
    // ...
    function renderHistorial() {
        const logAgrupado = state.log.reduce((acc, l) => {
            if (!acc[l.fecha]) acc[l.fecha] = [];
            acc[l.fecha].push(l);
            return acc;
        }, {});
        const fechas = Object.keys(logAgrupado).sort((a,b) => new Date(b) - new Date(a));
        if (fechas.length === 0) {
            document.getElementById('historial-container').innerHTML = '<p>No hay historial de registros.</p>';
            return;
        }
        document.getElementById('historial-container').innerHTML = fechas.map(f => {
            const fechaFormateada = new Date(f).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            return `<div class="puesto"><h4>${fechaFormateada}</h4>` + logAgrupado[f].map(l => `<div><strong style="color:${getColorPuesto(l.puesto)};">Puesto ${l.puesto}</strong> - ${l.hora} - ${config.abrev[l.tarea]}</div>`).join('') + `</div>`;
        }).join('');
    }

    function renderDistribucionHoras() {
        const logHoy = state.log.filter(l => l.fecha === getHoy());
        const esfuerzoPorPuesto = logHoy.reduce((acc, l) => {
            acc[l.puesto] = (acc[l.puesto] || 0) + config.tiempos[l.tarea];
            return acc;
        }, {});
        const esfuerzoTotal = Object.values(esfuerzoPorPuesto).reduce((sum, val) => sum + val, 0);
        if (esfuerzoTotal === 0) {
            document.getElementById('horas-container').innerHTML = '<p>No hay datos para calcular la distribución.</p>';
            return;
        }
        let table = '<table class="tabla-resumen"><thead><tr><th>Puesto</th><th>Tiempo Asignado</th><th>Decimal</th></tr></thead><tbody>';
        Object.keys(esfuerzoPorPuesto).forEach(p => {
            const minutosAsignados = (esfuerzoPorPuesto[p] / esfuerzoTotal) * config.JORNADA_MINUTOS;
            const horas = Math.floor(minutosAsignados / 60);
            const minutos = Math.round(minutosAsignados % 60);
            table += `<tr><td><strong style="color:${getColorPuesto(p)};">Puesto ${p}</strong></td><td>${horas}h ${minutos}min</td><td>${(minutosAsignados/60).toFixed(2)}</td></tr>`;
        });
        document.getElementById('horas-container').innerHTML = table + '</tbody></table>';
    }

    function renderGraficas(periodo) {
        if (state.chartInstance) state.chartInstance.destroy();
        
        let fechaInicio = new Date();
        fechaInicio.setHours(0,0,0,0);
        switch(periodo) {
            case 'weekly': fechaInicio.setDate(fechaInicio.getDate() - 6); break;
            case 'biweekly': fechaInicio.setDate(fechaInicio.getDate() - 14); break;
            case 'monthly': fechaInicio.setDate(fechaInicio.getDate() - 29); break;
        }

        const logFiltrado = (periodo === 'daily') ? state.log.filter(l => l.fecha === getHoy()) : state.log.filter(l => new Date(l.fecha) >= fechaInicio);

        const contador = logFiltrado.reduce((acc, l) => {
            acc[l.puesto] = acc[l.puesto] || { ...config.ordenTareas.reduce((a, t) => ({...a, [t]: 0}), {}), total: 0 };
            acc[l.puesto][l.tarea]++;
            acc[l.puesto].total++;
            return acc;
        }, {});

        const puestosOrdenados = Object.keys(contador).sort((a,b) => contador[b].total - contador[a].total);

        const datasets = config.ordenTareas.map(t => ({
            label: config.abrev[t],
            data: puestosOrdenados.map(p => contador[p][t]),
            backgroundColor: config.coloresTareas[t]
        }));

        const ctx = document.getElementById('grafico-puestos').getContext('2d');
        state.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: puestosOrdenados.map(p => `Puesto ${p}`), datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
            }
        });
    }

    function setupListeners() {
        // ... (código de setupListeners sin cambios)
    }

    function init() {
        // ... (código de init sin cambios)
    }

    setupListeners();
    init();
});
