document.addEventListener('DOMContentLoaded', () => {
  // CONFIGURACION Y CONSTANTES
  const config = {
    ordenTareas: ['Flejar+Paquete', 'Paquete', 'Bobina', 'Cuna', 'Tacos'],
    abrev: { 'Flejar+Paquete': 'F-P', Paquete: 'P', Bobina: 'B', Cuna: 'C', Tacos: 'T' },
    tiempos: { 'Flejar+Paquete': 2, Paquete: 1, Bobina: 3, Cuna: 1, Tacos: 2 },
    coloresTareas: {
      'Flejar+Paquete': 'rgba(25, 135, 84, 0.8)', // verde para F+P
      'Paquete': 'rgba(255, 165, 0, 0.8)', // naranja para P
      'Bobina': 'rgba(128, 128, 128, 0.8)', // gris para B
      'Cuna': 'rgba(165, 42, 42, 0.8)', // marrón para C
      'Tacos': '#a2785b',
    },
    coloresFijosPuestos: {
      '23': '#FF4D4D',      // rojo
      '24': '#4DB3FF',      // azul
      '11': '#FFF04D',      // amarillo
      '15': '#6CFF6C',      // verde
    },
    paletaSecundaria: [
      '#FFA500',   // naranja
      '#FF69B4',   // rosa
      '#FFFFFF',   // blanco (modo noche) / negro (modo día)
      '#9370DB',   // lila
      '#87CEEB',   // azul celeste
      '#7FFFD4',   // verde celeste (aquamarine)
      '#FFB366',   // naranja celeste
    ],
    JORNADA_MINUTOS: parseInt(localStorage.getItem('jornadaMinutos') || '465'),
  };

  // Estado general
  let state = {
    puestos: JSON.parse(localStorage.getItem('puestos') || '[]'),
    log: JSON.parse(localStorage.getItem('registroTareas') || '[]'),
    colorPuestos: JSON.parse(localStorage.getItem('colorPuestos') || '{}'),
    chartInstance: null,
    jornadaActual: localStorage.getItem('jornadaActual') || new Date().toISOString().split('T')[0],
  };

  // Funciones de guardado
  const savePuestos = () => {
    try {
      localStorage.setItem('puestos', JSON.stringify(state.puestos));
    } catch (e) {
      console.error('Error saving puestos to localStorage', e);
      showPopup('Error al guardar los puestos. El almacenamiento puede estar lleno.');
    }
  };
  const saveLog = () => {
    try {
      localStorage.setItem('registroTareas', JSON.stringify(state.log));
    } catch (e) {
      console.error('Error saving log to localStorage', e);
      showPopup('Error al guardar el registro. El almacenamiento puede estar lleno.');
    }
  };
  const saveColorPuestos = () => {
    try {
      localStorage.setItem('colorPuestos', JSON.stringify(state.colorPuestos));
    } catch (e) {
      console.error('Error saving colorPuestos to localStorage', e);
      showPopup('Error al guardar los colores de los puestos. El almacenamiento puede estar lleno.');
    }
  };
  const saveJornada = () => {
    try {
      localStorage.setItem('jornadaActual', state.jornadaActual);
    } catch (e) {
      console.error('Error saving jornada to localStorage', e);
      showPopup('Error al guardar la jornada. El almacenamiento puede estar lleno.');
    }
  };
  const getHoy = () => state.jornadaActual;

  // Funciones auxiliares para fechas
  function yyyyMmDd(dateObj) {
    const d = new Date(dateObj);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function saveResumen(fechaISO, resumenData) {
    try {
      localStorage.setItem(`resumen:${fechaISO}`, JSON.stringify(resumenData));
    } catch (e) {
      console.error('Error saving resumen to localStorage', e);
      showPopup('Error al guardar el resumen. El almacenamiento puede estar lleno.');
    }
  }
  function loadResumen(fechaISO) {
    try {
      const raw = localStorage.getItem(`resumen:${fechaISO}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Error loading resumen from localStorage', e);
      showPopup('Error al cargar el resumen.');
      return null;
    }
  }
  function saveHoras(fechaISO, horasData) {
    try {
      localStorage.setItem(`horas:${fechaISO}`, JSON.stringify(horasData));
    } catch (e) {
      console.error('Error saving horas to localStorage', e);
      showPopup('Error al guardar las horas. El almacenamiento puede estar lleno.');
    }
  }
  function loadHoras(fechaISO) {
    try {
      const raw = localStorage.getItem(`horas:${fechaISO}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Error loading horas from localStorage', e);
      showPopup('Error al cargar las horas.');
      return null;
    }
  }

  // Función para obtener colores para puestos
  function getColorPuesto(puesto) {
    if (state.colorPuestos[puesto]) return state.colorPuestos[puesto];
    
    // Colores fijos para puestos específicos
    if (config.coloresFijosPuestos[puesto]) {
      state.colorPuestos[puesto] = config.coloresFijosPuestos[puesto];
      saveColorPuestos();
      return state.colorPuestos[puesto];
    }
    
    // Para otros puestos, usar paleta secundaria cíclicamente
    const puestosNoFijos = state.puestos.filter(p => !config.coloresFijosPuestos[p]);
    const index = puestosNoFijos.indexOf(puesto);
    
    if (index >= 0) {
      let color = config.paletaSecundaria[index % config.paletaSecundaria.length];
      
      // Ajustar blanco/negro según modo oscuro
      if (color === '#FFFFFF' && !document.body.classList.contains('dark-mode')) {
        color = '#000000';
      }
      
      state.colorPuestos[puesto] = color;
      saveColorPuestos();
      return color;
    }
    
    // Fallback
    state.colorPuestos[puesto] = '#CCCCCC';
    saveColorPuestos();
    return state.colorPuestos[puesto];
  }

  // Función para mostrar pop-up
  function showPopup(message) {
    const popup = document.getElementById('popup');
    popup.textContent = message;
    popup.classList.add('show');
    setTimeout(() => {
      popup.classList.remove('show');
    }, 2000);
  }
  
  function roundToNearestTenth(num) {
    return Math.round(num * 10) / 10;
  }

  function minutosAHorasMinutos(minutos) {
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);
    return `${h}h ${m}m`;
  }

  function updateHorasDisplay() {
    const display = document.getElementById('jornada-horas-display');
    if (display) {
      display.textContent = `(${minutosAHorasMinutos(config.JORNADA_MINUTOS)})`;
    }
  }

  // Renderizado de TODA la UI principal
  function renderAll() {
    renderPuestos();
    renderDashboard();
    renderLog();
  }

  // Renderizado de puestos
  function renderPuestos() {
    const container = document.getElementById('puestos-container');
    container.innerHTML = state.puestos
      .map(
        (p) => `
      <div class="puesto" style="border-left: 5px solid ${getColorPuesto(p)}">
        <div class="puesto-header">
          <span>Puesto ${p}</span>
          <button class="quitar-puesto-btn" data-puesto="${p}" aria-label="Quitar puesto ${p}">X</button>
        </div>
        <div class="tarea-buttons">${config.ordenTareas
          .map(
            (t) => `<button class="add-tarea-btn ${config.abrev[t]}" data-puesto="${p}" data-tarea="${t}" aria-label="Añadir tarea ${config.abrev[t]} al puesto ${p}">${config.abrev[t]}</button>`
          )
          .join('')}</div>
      </div>`
      )
      .join('');
  }

  // Renderizar resumen diario
  function renderDashboard() {
    const hoyISO = state.jornadaActual;
    const logHoy = state.log.filter((l) => l.fecha === state.jornadaActual);
    const contador = logHoy.reduce((acc, l) => {
      acc[l.puesto] = acc[l.puesto] || { total: 0, ...config.ordenTareas.reduce((a, t) => ({ ...a, [t]: 0 }), {}) };
      acc[l.puesto][l.tarea]++;
      acc[l.puesto].total++;
      return acc;
    }, {});

    const puestosOrdenados = Object.keys(contador).sort((a, b) => contador[b].total - contador[a].total);
    if (puestosOrdenados.length === 0) {
      document.getElementById('dashboard-container').innerHTML = '<p>No hay registros para hoy.</p>';
      return;
    }
    let table =
      '<table class="tabla-resumen"><thead><tr><th>Puesto</th>' +
      config.ordenTareas.map((t) => `<th>${config.abrev[t]}</th>`).join('') +
      '<th>Total</th></tr></thead><tbody>';
    puestosOrdenados.forEach((p) => {
      table +=
        `<tr><td><span style="color:${getColorPuesto(p)}; font-weight:bold;">Puesto ${p}</span></td>` +
        config.ordenTareas.map((t) => `<td>${contador[p][t] || 0}</td>`).join('') +
        `<td>${contador[p].total}</td></tr>`;
    });
    document.getElementById('dashboard-container').innerHTML = table + '</tbody></table>';
  }

  // Renderizar log
  function renderLog() {
    document.getElementById('log-container').innerHTML = state.log
      .filter((l) => l.fecha === state.jornadaActual)
      .slice(0, 50)
      .map(
        (l) => `
      <div class="log-entry">
        <span><strong style="color:${getColorPuesto(l.puesto)};">Puesto ${l.puesto}</strong> | ${l.hora} | ${config.abrev[l.tarea]}</span>
        <button class="eliminar-log-btn" data-id="${l.id}" aria-label="Eliminar registro"></button>
      </div>`
      )
      .join('');
  }

  // Renderizar solo el log
  function renderLogOnly() {
    renderLog();
  }

  // Render Historial Completo
  function renderHistorialCompleto() {
    const cont = document.getElementById('hist-completo');
    const historialCompleto = JSON.parse(localStorage.getItem('historialCompleto') || '[]');
    const logAgrupado = historialCompleto.reduce((acc, l) => {
      if (!acc[l.fecha]) acc[l.fecha] = [];
      acc[l.fecha].push(l);
      return acc;
    }, {});
    const fechas = Object.keys(logAgrupado).sort((a, b) => new Date(b) - new Date(a));
    if (fechas.length === 0) {
      cont.innerHTML = '<p>No hay historial de registros.</p>';
      return;
    }
    cont.innerHTML = fechas
      .map((f) => {
        const fechaDate = new Date(f + 'T00:00:00');
        const fechaFormateada = fechaDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const fechaISO = f;
        return (
          '<div class="puesto"><div class="puesto-header"><h4 style="margin:0;">' +
          fechaFormateada +
          '</h4><button class="eliminar-dia-completo-btn" data-fecha="' + fechaISO + '" aria-label="Eliminar día">🗑️</button></div>' +
          logAgrupado[f]
            .map((l) => `<div class="log-entry"><span><strong style="color:${getColorPuesto(l.puesto)};">Puesto ${l.puesto}</strong> - ${l.hora} - ${config.abrev[l.tarea]}</span><button class="eliminar-log-historial-btn" data-id="${l.id}" aria-label="Eliminar registro">🗑️</button></div>`)
            .join('') +
          '</div>'
        );
      })
      .join('');
  }

  // Función para eliminar un registro individual del historial
  function handleEliminarLogHistorial(target) {
    const id = parseInt(target.dataset.id);
    if (!confirm('¿Seguro que quieres eliminar este registro del historial?')) {
      return;
    }

    let historialCompleto = JSON.parse(localStorage.getItem('historialCompleto') || '[]');
    const itemToDelete = historialCompleto.find(l => l.id === id);
    
    if (itemToDelete) {
      historialCompleto = historialCompleto.filter((l) => l.id !== id);
      localStorage.setItem('historialCompleto', JSON.stringify(historialCompleto));
      
      // Invalidate summary for the affected date so it gets recalculated
      localStorage.removeItem(`resumen:${itemToDelete.fecha}`);
      localStorage.removeItem(`horas:${itemToDelete.fecha}`);

      renderHistorialCompleto();
      // If compact view is active, re-render it too
      if (document.getElementById('hist-compact').style.display !== 'none') {
        renderHistorialCompact();
      }
      showPopup('Registro eliminado del historial');
    }
  }

  // Función para eliminar un día completo del historial
  function eliminarDiaHistorial(fechaISO) {
    if (!confirm(`¿Seguro que quieres eliminar todos los registros del día ${new Date(fechaISO).toLocaleDateString('es-ES')}?`)) {
      return;
    }

    // Eliminar del historial completo
    let historialCompleto = JSON.parse(localStorage.getItem('historialCompleto') || '[]');
    historialCompleto = historialCompleto.filter(l => l.fecha !== fechaISO);
    localStorage.setItem('historialCompleto', JSON.stringify(historialCompleto));

    // Eliminar resumen guardado
    localStorage.removeItem(`resumen:${fechaISO}`);

    // Eliminar horas guardadas
    localStorage.removeItem(`horas:${fechaISO}`);

    // Re-renderizar vista
    renderHistorialCompact();
    showPopup('Día eliminado del historial');
  }

  // Render Historial Compacto
  function renderHistorialCompact() {
    const cont = document.getElementById('hist-compact');
    const historialCompleto = JSON.parse(localStorage.getItem('historialCompleto') || '[]');
    const fechasSet = new Set(historialCompleto.map((l) => l.fecha));
    const fechas = Array.from(fechasSet).sort((a, b) => new Date(b) - new Date(a));

    if (fechas.length === 0) {
      cont.innerHTML = '<p>No hay datos para mostrar.</p>';
      return;
    }

    cont.innerHTML = fechas
      .map((fechaISO) => {
        // Cargar resumen de tareas
        let resumen = loadResumen(fechaISO);
        if (!resumen) {
          const delDia = historialCompleto.filter((l) => l.fecha === fechaISO);
          const contador = delDia.reduce((acc, l) => {
            acc[l.puesto] = acc[l.puesto] || { total: 0, ...config.ordenTareas.reduce((a, t) => ({ ...a, [t]: 0 }), {}) };
            acc[l.puesto][l.tarea]++;
            acc[l.puesto].total++;
            return acc;
          }, {});
          resumen = { fecha: fechaISO, data: contador };
          saveResumen(fechaISO, resumen);
        }

        // Cargar datos de horas
        const horas = loadHoras(fechaISO);

        const fechaDate = new Date(fechaISO + 'T00:00:00');
        const titulo = fechaDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const puestosOrdenados = Object.keys(resumen.data).sort((a, b) => resumen.data[b].total - resumen.data[a].total);

        // Tabla de Resumen de Tareas
        let tablaResumen =
          '<table class="tabla-resumen"><thead><tr><th>Puesto</th>' +
          config.ordenTareas.map((t) => `<th>${config.abrev[t]}</th>`).join('') +
          '<th>Total</th></tr></thead><tbody>';
        puestosOrdenados.forEach((p) => {
          tablaResumen += `<tr><td><span style="color:${getColorPuesto(p)}; font-weight:bold;">Puesto ${p}</span></td>`;
          config.ordenTareas.forEach((t) => (tablaResumen += `<td>${resumen.data[p][t] || 0}</td>`));
          tablaResumen += `<td>${resumen.data[p].total || 0}</td></tr>`;
        });
        tablaResumen += '</tbody></table>';

        // Tabla de Distribución de Horas
        let tablaHoras = '';
        if (horas && horas.asignacion) {
          tablaHoras = '<h5 class="mt-3">Distribución de Horas</h5><table class="tabla-resumen"><thead><tr><th>Puesto</th><th>Tiempo Asignado</th><th>Decimal</th></tr></thead><tbody>';
          Object.keys(horas.asignacion)
            .sort((a, b) => horas.asignacion[b].minutos - horas.asignacion[a].minutos)
            .forEach(p => {
              const { minutos, horasDecimal } = horas.asignacion[p];
              tablaHoras += `<tr><td><strong style="color:${getColorPuesto(p)};">P${p}</strong></td><td>${Math.floor(minutos / 60)}h ${Math.round(minutos % 60)}min</td><td>${horasDecimal.toFixed(2)}</td></tr>`;
            });
          tablaHoras += '</tbody></table>';
        }

        return `<div class="puesto"><div class="puesto-header"><h4 style="margin:0;">${titulo}</h4><button class="eliminar-dia-btn" data-fecha="${fechaISO}" aria-label="Eliminar día">🗑️</button></div>${tablaResumen}${tablaHoras}</div>`;
      })
      .join('');
  }

  // Calculo fechas para filtros Horas
  function fechasDeRango(rango) {
    const hoy = new Date();
    const start = new Date(hoy);
    const end = new Date(hoy);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (rango === 'ayer') {
      start.setDate(hoy.getDate() - 1);
      end.setDate(hoy.getDate() - 1);
    } else if (rango === '7dias') {
      start.setDate(hoy.getDate() - 6);
    } else if (rango === 'mes') {
      start.setDate(1);
    }
    return { start, end };
  }

  // Render Horas con persistencia y filtro por rango
  function renderDistribucionHoras(rango = 'hoy') {
    const cont = document.getElementById('horas-container');

    const { start, end } = fechasDeRango(rango);
    const startStr = yyyyMmDd(start);
    const endStr = yyyyMmDd(end);

    const historialCompleto = JSON.parse(localStorage.getItem('historialCompleto') || '[]');
    const logCompleto = [...historialCompleto, ...state.log];

    const logFiltrado = logCompleto.filter(l => l.fecha >= startStr && l.fecha <= endStr);

    if (logFiltrado.length === 0) {
        cont.innerHTML = '<p>No hay datos para el rango seleccionado.</p>';
        return;
    }

    const esfuerzo = logFiltrado.reduce((acc, l) => {
        acc[l.puesto] = (acc[l.puesto] || 0) + (config.tiempos[l.tarea] || 0);
        return acc;
    }, {});

    const totalEsfuerzo = Object.values(esfuerzo).reduce((s, v) => s + v, 0);

    if (totalEsfuerzo === 0) {
        cont.innerHTML = '<p>No hay tareas con tiempo asignado para el rango seleccionado.</p>';
        return;
    }

    const asignacion = {};
    let minutosTotalesAsignados = 0;
    const puestos = Object.keys(esfuerzo);

    puestos.forEach(p => {
        const minutosExactos = (esfuerzo[p] / totalEsfuerzo) * config.JORNADA_MINUTOS;
        const horasExactas = minutosExactos / 60;
        
        // Redondeo a 0.05 o 0.10
        let horasRedondeadas = Math.round(horasExactas * 20) / 20; // Redondeo al 0.05 más cercano
        if (Math.abs(horasRedondeadas - horasExactas) > 0.025) { // Si está más cerca de un múltiplo de 0.1
            horasRedondeadas = Math.round(horasExactas * 10) / 10;
        }

        const minutosRedondeados = horasRedondeadas * 60;
        asignacion[p] = { minutos: minutosRedondeados, horasDecimal: horasRedondeadas };
        minutosTotalesAsignados += minutosRedondeados;
    });

    // Ajuste para que la suma sea exacta
    let diferencia = config.JORNADA_MINUTOS - minutosTotalesAsignados;
    const puestosOrdenadosPorError = puestos.sort((a, b) => {
        const errorA = Math.abs(asignacion[a].minutos - (esfuerzo[a] / totalEsfuerzo) * config.JORNADA_MINUTOS);
        const errorB = Math.abs(asignacion[b].minutos - (esfuerzo[b] / totalEsfuerzo) * config.JORNADA_MINUTOS);
        return errorB - errorA;
    });

    while (Math.abs(diferencia) > 0.1) {
        const ajuste = diferencia > 0 ? 1 : -1;
        let ajustado = false;
        for (const p of puestosOrdenadosPorError) {
            if ((diferencia > 0 && asignacion[p].minutos < (esfuerzo[p] / totalEsfuerzo) * config.JORNADA_MINUTOS) ||
                (diferencia < 0 && asignacion[p].minutos > (esfuerzo[p] / totalEsfuerzo) * config.JORNADA_MINUTOS)) {
                asignacion[p].minutos += ajuste;
                asignacion[p].horasDecimal = asignacion[p].minutos / 60;
                diferencia -= ajuste;
                ajustado = true;
                break;
            }
        }
        if (!ajustado) { // Si no se pudo ajustar, hacerlo en el que tenga más minutos
            const p = puestosOrdenadosPorError[0];
            asignacion[p].minutos += ajuste;
            asignacion[p].horasDecimal = asignacion[p].minutos / 60;
            diferencia -= ajuste;
        }
    }

    const hoyISO = yyyyMmDd(new Date()); // Esto debería ser la fecha actual para guardar, no la del rango
    const horasData = { fecha: hoyISO, asignacion };
    // Solo guardar si el rango es 'hoy' para evitar sobrescribir datos de días pasados
    if (rango === 'hoy') {
      saveHoras(hoyISO, horasData);
    }

    let tabla = '<table class="tabla-resumen"><thead><tr><th>Puesto</th><th>Tiempo Asignado</th><th>Decimal</th></tr></thead><tbody>';
    Object.keys(asignacion)
        .sort((a, b) => asignacion[b].minutos - asignacion[a].minutos)
        .forEach(p => {
            const { minutos, horasDecimal } = asignacion[p];
            tabla += `<tr><td><strong style="color:${getColorPuesto(p)};">P${p}</strong></td><td>${Math.floor(minutos / 60)}h ${Math.round(minutos % 60)}min</td><td>${horasDecimal.toFixed(2)}</td></tr>`;
        });
    tabla += '</tbody></table>';

    cont.innerHTML = `<div class="puesto"><h4>Distribución para ${rango === 'hoy' ? 'Hoy' : rango === 'ayer' ? 'Ayer' : rango === '7dias' ? 'Últimos 7 días' : 'Mes actual'}</h4>${tabla}</div>`;
}

  // MANEJO DE LA JORNADA
  function finalizarJornada() {
    if (!confirm('¿Finalizar jornada actual y empezar una nueva?')) {
      return;
    }

    const hoyISO = state.jornadaActual;
    const logHoy = state.log.filter((l) => l.fecha === state.jornadaActual);

    if (logHoy.length === 0) {
      alert('No hay registros en la jornada actual.');
      return;
    }

    // 1. Guardar Resumen del Día
    const contador = logHoy.reduce((acc, l) => {
      acc[l.puesto] = acc[l.puesto] || { total: 0, ...config.ordenTareas.reduce((a, t) => ({ ...a, [t]: 0 }), {}) };
      acc[l.puesto][l.tarea]++;
      acc[l.puesto].total++;
      return acc;
    }, {});
    saveResumen(hoyISO, { fecha: hoyISO, data: contador });

    // 2. Calcular y Guardar Horas
    const esfuerzo = logHoy.reduce((acc, l) => {
      acc[l.puesto] = (acc[l.puesto] || 0) + (config.tiempos[l.tarea] || 0);
      return acc;
    }, {});
    const totalEsfuerzo = Object.values(esfuerzo).reduce((s, v) => s + v, 0);
    if (totalEsfuerzo > 0) {
      const asignacion = {};
      Object.keys(esfuerzo).forEach(p => {
        const minutos = (esfuerzo[p] / totalEsfuerzo) * config.JORNADA_MINUTOS;
        asignacion[p] = { minutos, horasDecimal: roundToNearestTenth(minutos / 60) };
      });
      saveHoras(hoyISO, { fecha: hoyISO, asignacion });
    }

    // 3. (Opcional pero recomendado) Mover registros de la jornada a un historial general
    // y limpiar el log principal. Esto evita que el `state.log` crezca indefinidamente.
    let historialCompleto = JSON.parse(localStorage.getItem('historialCompleto') || '[]');
    historialCompleto.push(...logHoy);
    try {
      localStorage.setItem('historialCompleto', JSON.stringify(historialCompleto));
    } catch (e) {
      console.error('Error saving historialCompleto to localStorage', e);
      showPopup('Error al guardar el historial completo. El almacenamiento puede estar lleno.');
    }

    // Limpiar los registros de la jornada actual del log principal
    state.log = state.log.filter((l) => l.fecha !== state.jornadaActual);
    saveLog();


    // 4. Iniciar Nueva Jornada
    const fechaJornadaFinalizada = state.jornadaActual;
    state.jornadaActual = new Date().toISOString().split('T')[0];
    saveJornada();

    // 5. Actualizar UI y notificar
    renderAll();
    alert(`Jornada ${fechaJornadaFinalizada} finalizada y guardada en el historial. Nueva jornada ${state.jornadaActual} iniciada.`);
  }


  // Render Grafico
  function renderGraficas(periodo) {
    if (state.chartInstance) state.chartInstance.destroy();

    let fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'weekly':
        fechaInicio.setDate(fechaInicio.getDate() - 6);
        break;
      case 'biweekly':
        fechaInicio.setDate(fechaInicio.getDate() - 14);
        break;
      case 'monthly':
        fechaInicio.setDate(fechaInicio.getDate() - 29);
        break;
    }

    const fechaInicioStr = yyyyMmDd(fechaInicio);
    const hoyStr = yyyyMmDd(new Date());

    const historialCompleto = JSON.parse(localStorage.getItem('historialCompleto') || '[]');
    const logCompleto = [...historialCompleto, ...state.log];

    const logParaGraficar = (periodo === 'daily')
      ? state.log.filter((l) => l.fecha === getHoy())
      : logCompleto.filter((l) => l.fecha >= fechaInicioStr && l.fecha <= hoyStr);

    const contador = logParaGraficar.reduce((acc, l) => {
      acc[l.puesto] = acc[l.puesto] || { ...config.ordenTareas.reduce((a, t) => ({ ...a, [t]: 0 }), {}), total: 0 };
      acc[l.puesto][l.tarea]++;
      acc[l.puesto].total++;
      return acc;
    }, {});

    const puestosOrdenados = Object.keys(contador).sort((a, b) => contador[b].total - contador[a].total);

    const datasets = config.ordenTareas.map((t) => ({
      label: config.abrev[t],
      data: puestosOrdenados.map((p) => contador[p][t]),
      backgroundColor: config.coloresTareas[t],
    }));

    const ctx = document.getElementById('grafico-puestos').getContext('2d');
    state.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: puestosOrdenados.map((p) => `Puesto ${p}`), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      },
    });
  }

  function handleResetColorsClick() {
    if (confirm('¿Resetear todos los colores de puestos?')) {
      state.colorPuestos = {};
      saveColorPuestos();
      renderAll();
    }
  }

  function handleClearTodayClick() {
    if (confirm('¿Seguro que quieres borrar todos los registros de la jornada actual (sin guardar)?')) {
      state.log = state.log.filter((l) => l.fecha !== state.jornadaActual);
      saveLog();
      renderAll();
    }
  }

  function handleNuevoPuestoKeypress(e) {
    if (e.key === 'Enter') {
      document.getElementById('add-puesto-btn').click();
    }
  }

  function handleJornadaMinutosChange(e) {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      config.JORNADA_MINUTOS = value;
      localStorage.setItem('jornadaMinutos', value);
      renderDistribucionHoras('hoy');
    } else {
      e.target.value = config.JORNADA_MINUTOS;
    }
  }

  function handleFiltrosGraficasClick(e) {
    if (e.target.tagName === 'BUTTON') {
      document.querySelectorAll('.filtros-graficas button').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      renderGraficas(e.target.dataset.periodo);
    }
  }

  function handleHorasFiltrosClick(e) {
    if (e.target.tagName === 'BUTTON') {
      document.querySelectorAll('.horas-filtros button').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      renderDistribucionHoras(e.target.dataset.rango);
    }
  }

  function handleHistTabsClick(e) {
    if (e.target.tagName === 'BUTTON') {
      document.querySelectorAll('.hist-tabs button').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      const sub = e.target.dataset.sub;
      document.getElementById('hist-completo').style.display = sub === 'completo' ? 'block' : 'none';
      document.getElementById('hist-compact').style.display = sub === 'compact' ? 'block' : 'none';

      if (sub === 'completo') renderHistorialCompleto();
      if (sub === 'compact') renderHistorialCompact();
    }
  }

  function handleModoToggle(e) {
    if (e.target.tagName === 'BUTTON') {
      const vista = e.target.dataset.vista;
      document.querySelectorAll('.vista-container').forEach((el) => el.classList.remove('active'));
      document.querySelectorAll('.modo-toggle button').forEach((el) => el.classList.remove('active'));
      document.getElementById(`vista-${vista}`).classList.add('active');
      e.target.classList.add('active');

      if (vista === 'historial') {
        renderHistorialCompleto();
      } else if (vista === 'horas') {
        renderDistribucionHoras('hoy');
      } else if (vista === 'graficas') {
        renderGraficas('daily');
      } else if (vista === 'actual') {
        renderAll();
      }
    }
  }

  function handleThemeToggle() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark-mode' : '');
    if (document.getElementById('vista-graficas').classList.contains('active'))
      renderGraficas(document.querySelector('.filtros-graficas button.active').dataset.periodo);
  }

  function handleEliminarLog(target) {
    state.log = state.log.filter((l) => l.id !== parseInt(target.dataset.id));
    saveLog();
    renderDashboard();
    renderLog();
  }

  function handleQuitarPuesto(target) {
    if (confirm(`¿Seguro que quieres quitar el puesto ${target.dataset.puesto}?`)) {
      state.puestos = state.puestos.filter((p) => p !== target.dataset.puesto);
      savePuestos();
      renderPuestos();
      renderDashboard();
    }
  }

  function handleAddTarea(target) {
    const { puesto, tarea } = target.dataset;
    const now = new Date();
    state.log.unshift({ id: Date.now(), puesto, tarea, fecha: state.jornadaActual, hora: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) });
    saveLog();
    renderDashboard();
    renderLog();
    showPopup('Registro añadido con éxito');
  }

  function handleAddPuesto() {
    const input = document.getElementById('nuevo-puesto-input');
    const num = input.value.trim();
    if (num && !state.puestos.map(Number).includes(parseInt(num))) {
      state.puestos.push(num);
      state.puestos.sort((a, b) => parseInt(a) - parseInt(b));
      savePuestos();
      renderAll();
    }
    input.value = '';
  }

  // EVENTOS
  function setupListeners() {
    document.getElementById('theme-toggle').addEventListener('click', handleThemeToggle);

    document.querySelector('.modo-toggle').addEventListener('click', handleModoToggle);

    document.querySelector('.hist-tabs').addEventListener('click', handleHistTabsClick);

    document.querySelector('.horas-filtros').addEventListener('click', handleHorasFiltrosClick);

    document.querySelector('.filtros-graficas').addEventListener('click', handleFiltrosGraficasClick);

    document.getElementById('jornada-minutos-input').addEventListener('change', handleJornadaMinutosChange);

    document.getElementById('add-puesto-btn').addEventListener('click', handleAddPuesto);

    document.getElementById('nuevo-puesto-input').addEventListener('keypress', handleNuevoPuestoKeypress);

    document.getElementById('clear-today-btn').addEventListener('click', handleClearTodayClick);

        document.getElementById('finalizar-jornada-btn').addEventListener('click', finalizarJornada);

    document.getElementById('reset-colors-btn').addEventListener('click', handleResetColorsClick);

    document.body.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('add-tarea-btn')) {
        handleAddTarea(target);
      }
      if (target.classList.contains('quitar-puesto-btn')) {
        handleQuitarPuesto(target);
      }
      if (target.classList.contains('eliminar-log-btn')) {
        handleEliminarLog(target);
      }
      if (target.classList.contains('eliminar-log-historial-btn')) {
        handleEliminarLogHistorial(target);
      }
      if (target.classList.contains('eliminar-dia-btn')) {
        eliminarDiaHistorial(target.dataset.fecha);
      }
      if (target.classList.contains('eliminar-dia-completo-btn')) {
        eliminarDiaHistorial(target.dataset.fecha);
        // Actualizar también historial completo si está visible
        if (document.getElementById('hist-completo').style.display !== 'none') {
          renderHistorialCompleto();
        }
      }
    });
  }

  // INICIALIZACION
  function init() {
    if (localStorage.getItem('theme') === 'dark-mode') {
      document.body.classList.add('dark-mode');
      document.getElementById('theme-toggle').textContent = '☀️';
    }
    const jornadaMinutosInput = document.getElementById('jornada-minutos-input');
    if (jornadaMinutosInput) {
      jornadaMinutosInput.value = config.JORNADA_MINUTOS;
      updateHorasDisplay();
      jornadaMinutosInput.addEventListener('input', updateHorasDisplay);
    } else {
      console.error('Error: Element with ID "jornada-minutos-input" not found in init().');
    }
    setupListeners();
    renderAll();
  }
  init();
});
