import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

old_nav = """        // Mostrar seccion correspondiente
        const targetId = link.getAttribute('data-target');
        pageSections.forEach(sec => sec.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
    });
});"""

new_nav = """        // Mostrar seccion correspondiente
        const targetId = link.getAttribute('data-target');
        pageSections.forEach(sec => sec.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
        
        if(targetId === 'section-estadisticas') {
            if(typeof cargarEstadisticas === 'function') cargarEstadisticas();
        }
    });
});"""

stats_logic = """
// -------------------------------------------------------------------
// 9. ESTADÍSTICAS
// -------------------------------------------------------------------
let chartVentasInstance = null;

async function cargarEstadisticas() {
    try {
        const statHoy = document.getElementById('stat-ventas-hoy');
        const statMes = document.getElementById('stat-ventas-mes');
        const statClientes = document.getElementById('stat-clientes');
        const statProductos = document.getElementById('stat-productos');
        const tablaVentas = document.getElementById('tabla-ultimas-ventas');
        
        statHoy.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        statMes.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        statClientes.textContent = posClientesMemoria.length;
        statProductos.textContent = posProductosMemoria.length;

        // Fechas
        const ahora = new Date();
        const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        
        const hace7Dias = new Date(ahora);
        hace7Dias.setDate(hace7Dias.getDate() - 6);
        hace7Dias.setHours(0,0,0,0);

        const snapshotVentas = await db.collection('ventas')
            .where('fecha_creacion', '>=', hace7Dias)
            .orderBy('fecha_creacion', 'desc')
            .get();

        let ingresosHoy = 0;
        let ingresosMes = 0;
        const ventas7Dias = {};
        const ultimas5 = [];

        // Inicializar array de 7 días (formato dd/mm)
        for(let i=6; i>=0; i--) {
            const d = new Date(ahora);
            d.setDate(d.getDate() - i);
            ventas7Dias[d.toLocaleDateString('es-VE', {day: '2-digit', month: '2-digit'})] = 0;
        }

        snapshotVentas.forEach(doc => {
            const v = doc.data();
            const totalUsd = v.totales?.total_usd || 0;
            const fecha = v.fecha_creacion ? v.fecha_creacion.toDate() : new Date();
            
            if(fecha >= inicioHoy) ingresosHoy += totalUsd;
            if(fecha >= inicioMes) ingresosMes += totalUsd;
            
            const dayKey = fecha.toLocaleDateString('es-VE', {day: '2-digit', month: '2-digit'});
            if(ventas7Dias[dayKey] !== undefined) {
                ventas7Dias[dayKey] += totalUsd;
            }

            if(ultimas5.length < 5) {
                ultimas5.push(`
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-3 font-medium text-gray-700">${fecha.toLocaleDateString('es-VE')}</td>
                        <td class="py-3 text-gray-600 truncate max-w-[150px]">${v.cliente?.nombre || 'Desconocido'}</td>
                        <td class="py-3 text-right font-black text-brand">$${totalUsd.toFixed(2)}</td>
                    </tr>
                `);
            }
        });

        statHoy.textContent = `$${ingresosHoy.toFixed(2)}`;
        statMes.textContent = `$${ingresosMes.toFixed(2)}`;

        tablaVentas.innerHTML = ultimas5.length > 0 ? ultimas5.join('') : '<tr><td colspan="3" class="py-4 text-center text-gray-500">No hay ventas recientes</td></tr>';

        // Renderizar Gráfico
        const ctx = document.getElementById('chartVentas');
        if(ctx) {
            if(chartVentasInstance) chartVentasInstance.destroy();
            chartVentasInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(ventas7Dias),
                    datasets: [{
                        label: 'Ingresos USD',
                        data: Object.values(ventas7Dias),
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

    } catch (e) {
        console.error("Error al cargar estadísticas:", e);
    }
}

const btnRefreshStats = document.getElementById('btn-refresh-stats');
if(btnRefreshStats) {
    btnRefreshStats.addEventListener('click', () => {
        const btn = btnRefreshStats;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Actualizando...';
        cargarEstadisticas().then(() => {
            btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Actualizar';
        });
    });
}
"""

if "9. ESTADÍSTICAS" not in content:
    content = content.replace(old_nav, new_nav)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content + "\n" + stats_logic)
    print("NAV PATCHED AND STATS LOGIC ADDED")
else:
    print("ALREADY PATCHED")
