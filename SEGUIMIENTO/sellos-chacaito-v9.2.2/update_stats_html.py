import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.html'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Add Chart.js to head
head_old = '</head>'
head_new = '    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n</head>'

# Replace section
old_sec = '<div id="section-estadisticas" class="page-section p-8 hidden"><h3 class="text-2xl font-bold">Estadísticas (En construcción)</h3></div>'
old_sec2 = '<div id="section-estadisticas" class="page-section p-8 hidden"><h3 class="text-2xl font-bold">Estadsticas (En construccin)</h3></div>'

new_sec = """<div id="section-estadisticas" class="page-section p-8 hidden overflow-y-auto h-[calc(100vh-100px)]">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900">Panel de Estadísticas</h3>
                        <button id="btn-refresh-stats" class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 text-sm font-bold"><i class="fas fa-sync-alt mr-2"></i> Actualizar</button>
                    </div>

                    <!-- KPIs -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center">
                            <div class="bg-green-100 text-green-600 p-4 rounded-full mr-4">
                                <i class="fas fa-dollar-sign text-xl w-6 text-center"></i>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Ventas Hoy</p>
                                <h4 id="stat-ventas-hoy" class="text-2xl font-black text-gray-800">$0.00</h4>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center">
                            <div class="bg-blue-100 text-blue-600 p-4 rounded-full mr-4">
                                <i class="fas fa-calendar-alt text-xl w-6 text-center"></i>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Ingresos Mes</p>
                                <h4 id="stat-ventas-mes" class="text-2xl font-black text-gray-800">$0.00</h4>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center">
                            <div class="bg-purple-100 text-purple-600 p-4 rounded-full mr-4">
                                <i class="fas fa-users text-xl w-6 text-center"></i>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Clientes (Top)</p>
                                <h4 id="stat-clientes" class="text-2xl font-black text-gray-800">0</h4>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center">
                            <div class="bg-orange-100 text-orange-600 p-4 rounded-full mr-4">
                                <i class="fas fa-box text-xl w-6 text-center"></i>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Productos Stock</p>
                                <h4 id="stat-productos" class="text-2xl font-black text-gray-800">0</h4>
                            </div>
                        </div>
                    </div>

                    <!-- Charts and Tables -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                        <!-- Gráfico de Ventas -->
                        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h4 class="text-lg font-bold text-gray-800 mb-4">Ventas (Últimos 7 Días)</h4>
                            <div class="relative h-64">
                                <canvas id="chartVentas"></canvas>
                            </div>
                        </div>
                        
                        <!-- Top Productos -->
                        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                            <h4 class="text-lg font-bold text-gray-800 mb-4">Últimas 5 Ventas</h4>
                            <div class="overflow-x-auto flex-1">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="text-xs text-gray-500 uppercase border-b border-gray-200">
                                            <th class="py-2">Fecha</th>
                                            <th class="py-2">Cliente</th>
                                            <th class="py-2 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-ultimas-ventas" class="text-sm">
                                        <tr><td colspan="3" class="py-4 text-center text-gray-400">Cargando...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>"""

import re
content = content.replace(head_old, head_new)

# Sub because of encoding issues with "Estadísticas (En construcción)"
content = re.sub(r'<div id="section-estadisticas" class="page-section p-8 hidden">.*?</div>', new_sec, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print('UPDATED HTML')
