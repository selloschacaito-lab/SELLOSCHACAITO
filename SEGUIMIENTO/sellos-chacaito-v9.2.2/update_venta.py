import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

new_logic = """
// -------------------------------------------------------------------
// 7. PROCESAR VENTA Y RECIBO
// -------------------------------------------------------------------
const btnProcesar = document.getElementById("btn-procesar-venta");

btnProcesar.addEventListener("click", async () => {
    if (!posClienteSeleccionado) return alert("Debes seleccionar un cliente de la lista.");
    if (posCarrito.length === 0) return alert("El carrito está vacío.");
    
    const tasa = parseFloat(inputTasaBcv.value) || 0;
    if (tasa <= 0) return alert("La Tasa BCV debe ser mayor a 0.");

    const metodoPago = document.getElementById('pos-metodo-pago').value;
    const envioTipo = document.getElementById('pos-envio-tipo').value;
    const envioNota = document.getElementById('pos-envio-nota').value.trim().toUpperCase();

    // UI Bloqueo
    btnProcesar.disabled = true;
    btnProcesar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> PROCESANDO...';

    try {
        const esMayorista = posClienteSeleccionado?.segmentacion?.es_mayorista;
        let subtotalUsd = 0; let totalUsd = 0;
        
        const productosParaGuardar = posCarrito.map(item => {
            const precio = esMayorista ? item.precio_mayor_usd : item.precio_usd;
            subtotalUsd += item.precio_usd * item.cant;
            totalUsd += precio * item.cant;
            return {
                id_producto: item.id,
                nombre: item.nombre,
                cantidad: item.cant,
                precio_unitario: precio,
                subtotal: precio * item.cant
            };
        });
        
        const totalBs = totalUsd * tasa;
        
        // 1. Guardar en Firestore (ventas)
        const ventaRef = db.collection('ventas').doc();
        const idVenta = ventaRef.id;
        const correlativo = Date.now().toString().slice(-6); // ID Corto

        const ventaData = {
            id_venta: idVenta,
            correlativo: correlativo,
            cliente: {
                id: posClienteSeleccionado.id,
                nombre: posClienteSeleccionado.identidad.nombre_razon,
                documento: posClienteSeleccionado.identidad.documento,
                telefono: posClienteSeleccionado.contacto.telefono || ''
            },
            productos: productosParaGuardar,
            totales: {
                subtotal_usd: subtotalUsd,
                descuento_usd: subtotalUsd - totalUsd,
                total_usd: totalUsd,
                tasa_bcv: tasa,
                total_bs: totalBs
            },
            pago: {
                metodo: metodoPago,
                estado: 'PAGADO'
            },
            envio: {
                tipo: envioTipo,
                nota: envioNota
            },
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        const batch = db.batch();
        batch.set(ventaRef, ventaData);

        // 2. Restar stock
        posCarrito.forEach(item => {
            const prodRef = db.collection('productos').doc(item.id);
            batch.update(prodRef, {
                cantidad_stock: firebase.firestore.FieldValue.increment(-item.cant)
            });
        });

        // 3. Actualizar cliente (Estadísticas)
        const clienteRef = db.collection('clientes').doc(posClienteSeleccionado.id);
        batch.update(clienteRef, {
            "estadisticas.total_comprado_usd": firebase.firestore.FieldValue.increment(totalUsd),
            "estadisticas.cantidad_pedidos": firebase.firestore.FieldValue.increment(1),
            "estadisticas.ultima_orden": firebase.firestore.FieldValue.serverTimestamp()
        });

        // Ejecutar Transacción Firestore
        await batch.commit();

        // 4. Sincronizar con Realtime Database (Seguimiento Público)
        const rtRef = firebase.database().ref('pedidos/' + idVenta);
        await rtRef.set({
            cliente: posClienteSeleccionado.identidad.nombre_razon,
            documento: posClienteSeleccionado.identidad.documento,
            correlativo: correlativo,
            estatus: "EN PROCESO", // Estado inicial para que el cliente vea que se está haciendo
            fecha: Date.now(),
            envio: envioTipo
        });

        // 5. Imprimir Recibo 1/4 Carta
        imprimirRecibo(ventaData);

        // 6. Limpiar Caja
        posCarrito = [];
        inputPosCliente.value = '';
        posClienteSeleccionado = null;
        labelPosClienteTipo.textContent = "NORMAL";
        labelPosClienteTipo.className = "text-sm font-black text-gray-600";
        document.getElementById('pos-envio-nota').value = '';
        renderizarCarrito();

    } catch (e) {
        console.error(e);
        alert("Ocurrió un error: " + e.message);
    } finally {
        btnProcesar.disabled = false;
        btnProcesar.innerHTML = '<i class="fas fa-check-circle mr-2"></i> PROCESAR VENTA';
    }
});

function imprimirRecibo(venta) {
    const ventanita = window.open('', 'PRINT', 'height=600,width=400');
    
    let htmlProductos = '';
    venta.productos.forEach(p => {
        htmlProductos += `
            <tr style="border-bottom: 1px dashed #ccc;">
                <td style="padding: 4px 0;">${p.cantidad}x ${p.nombre}</td>
                <td style="padding: 4px 0; text-align: right;">$${p.subtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    const envioHtml = venta.envio.tipo !== 'TIENDA' 
        ? `<div style="margin-top: 10px; padding: 5px; border: 1px solid #000;">
             <strong>MÉTODO DE ENTREGA:</strong> ${venta.envio.tipo}<br>
             <strong>NOTA/DIRECCIÓN:</strong> ${venta.envio.nota}
           </div>` 
        : `<div><strong>MÉTODO:</strong> RETIRO EN TIENDA</div>`;

    ventanita.document.write(`
        <html>
        <head>
            <title>Recibo de Venta - Sellos Chacaito</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; margin: 0; padding: 10px; color: #000; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .title { font-size: 16px; margin-bottom: 5px; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .totals { margin-top: 10px; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="center title bold">SELLOS CHACAITO</div>
            <div class="center">Orden #${venta.correlativo}</div>
            <div class="center">Fecha: ${new Date().toLocaleString('es-VE')}</div>
            
            <div class="divider"></div>
            <div><strong>CLIENTE:</strong> ${venta.cliente.nombre}</div>
            <div><strong>C.I/RIF:</strong> ${venta.cliente.documento}</div>
            <div><strong>TELF:</strong> ${venta.cliente.telefono || 'N/A'}</div>
            
            <div class="divider"></div>
            <table>
                ${htmlProductos}
            </table>
            
            <div class="divider"></div>
            <table class="totals bold">
                <tr><td>TOTAL USD:</td><td style="text-align: right;">$${venta.totales.total_usd.toFixed(2)}</td></tr>
                <tr><td>TASA BCV:</td><td style="text-align: right;">${venta.totales.tasa_bcv.toFixed(4)}</td></tr>
                <tr><td style="font-size: 16px; padding-top: 5px;">TOTAL Bs:</td><td style="text-align: right; font-size: 16px; padding-top: 5px;">Bs ${venta.totales.total_bs.toFixed(2)}</td></tr>
            </table>

            <div class="divider"></div>
            ${envioHtml}
            
            <div class="divider"></div>
            <div class="center" style="font-size: 10px; margin-top: 15px;">
                ¡Gracias por su compra!<br>
                Revise el estado de su pedido en nuestra web.
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function(){ window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `);
    
    ventanita.document.close();
}
"""

# Append ONLY if not already appended
if "// 7. PROCESAR VENTA Y RECIBO" not in content:
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content + "\n" + new_logic)
    print("APPENDED")
else:
    print("ALREADY APPENDED")
