import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

split_str = '// 6. MOTOR DE VENTAS (POS) - CARRITO Y MATEMÁTICA'
parts = content.split(split_str)
if len(parts) == 2:
    new_js = """// -------------------------------------------------------------------
// 6. MOTOR DE VENTAS (POS) - CARRITO Y MATEMÁTICA
// -------------------------------------------------------------------
let posClientesMemoria = [];
let posProductosMemoria = [];
let posClienteSeleccionado = null;
let posProductoSeleccionadoTemporal = null;
let posCarrito = [];

const inputPosCliente = document.getElementById("pos-buscar-cliente");
const dropdownClientes = document.getElementById("pos-clientes-dropdown");
const labelPosClienteTipo = document.getElementById("pos-cliente-tipo");

const inputPosProducto = document.getElementById("pos-buscar-producto");
const dropdownProductos = document.getElementById("pos-productos-dropdown");
const inputPosCant = document.getElementById("pos-prod-cant");
const btnAddProd = document.getElementById("btn-pos-add-prod");
const tbodyCarrito = document.getElementById("pos-carrito-body");

const inputTasaBcv = document.getElementById("pos-tasa-bcv");
const txtSubtotal = document.getElementById("pos-subtotal");
const txtDescuento = document.getElementById("pos-descuento");
const txtTotalUsd = document.getElementById("pos-total-usd");
const txtTotalBs = document.getElementById("pos-total-bs");
const selectMetodoPago = document.getElementById("pos-metodo-pago");

function inicializarPOS() {
    db.collection("clientes").onSnapshot(snap => {
        posClientesMemoria = [];
        snap.forEach(doc => {
            const c = doc.data();
            c.id = doc.id;
            c.searchText = `${c.identidad?.documento || ''} ${c.identidad?.nombre_razon || ''}`.toUpperCase();
            posClientesMemoria.push(c);
        });
    });

    db.collection("productos").where("cantidad_stock", ">", 0).onSnapshot(snap => {
        posProductosMemoria = [];
        snap.forEach(doc => {
            const p = doc.data();
            p.id = doc.id;
            p.searchText = `${p.categoria || ''} ${p.nombre || ''}`.toUpperCase();
            posProductosMemoria.push(p);
        });
    });
}

function configurarDropdown(input, dropdown, memoria, onSelectRender, onSelectCallback) {
    input.addEventListener("input", (e) => {
        const query = e.target.value.trim().toUpperCase();
        dropdown.innerHTML = "";
        
        if (query.length < 2) {
            dropdown.classList.add("hidden");
            return;
        }

        const resultados = memoria.filter(item => item.searchText.includes(query)).slice(0, 15);
        
        if (resultados.length === 0) {
            dropdown.innerHTML = `<div class="p-3 text-sm text-gray-500">No se encontraron resultados</div>`;
            dropdown.classList.remove("hidden");
            return;
        }

        resultados.forEach(item => {
            const div = document.createElement("div");
            div.className = "p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-sm font-bold text-gray-700";
            div.innerHTML = onSelectRender(item);
            
            div.addEventListener("click", () => {
                input.value = onSelectRender(item).replace(/<[^>]*>?/gm, '');
                dropdown.classList.add("hidden");
                onSelectCallback(item);
            });
            dropdown.appendChild(div);
        });
        
        dropdown.classList.remove("hidden");
    });

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });
}

configurarDropdown(
    inputPosCliente, 
    dropdownClientes, 
    posClientesMemoria, 
    (c) => `${c.identidad.documento} - ${c.identidad.nombre_razon}`,
    (c) => {
        posClienteSeleccionado = c;
        const esMayorista = c.segmentacion?.es_mayorista;
        labelPosClienteTipo.textContent = esMayorista ? "MAYORISTA" : "NORMAL";
        labelPosClienteTipo.className = esMayorista ? "text-sm font-black text-purple-600" : "text-sm font-black text-gray-600";
        actualizarTotales();
    }
);

inputPosCliente.addEventListener('input', (e) => {
    if(e.target.value.trim() === '') {
        posClienteSeleccionado = null;
        labelPosClienteTipo.textContent = "NORMAL";
        labelPosClienteTipo.className = "text-sm font-black text-gray-600";
        actualizarTotales();
    }
});

configurarDropdown(
    inputPosProducto, 
    dropdownProductos, 
    posProductosMemoria, 
    (p) => `${p.nombre} <span class="text-xs text-gray-400 font-normal block">Disp: ${p.cantidad_stock} | $${p.precio_usd.toFixed(2)}</span>`,
    (p) => {
        posProductoSeleccionadoTemporal = p;
    }
);

inputPosProducto.addEventListener('input', (e) => {
    if(e.target.value.trim() === '') posProductoSeleccionadoTemporal = null;
});

btnAddProd.addEventListener("click", () => {
    if (!posProductoSeleccionadoTemporal) return alert("Por favor, busca y selecciona un producto válido de la lista.");
    
    const cant = parseInt(inputPosCant.value) || 1;
    const producto = posProductoSeleccionadoTemporal;

    if (cant > producto.cantidad_stock) return alert(`Solo hay ${producto.cantidad_stock} en inventario.`);

    const existente = posCarrito.find(i => i.id === producto.id);
    if (existente) {
        if (existente.cant + cant > producto.cantidad_stock) return alert("Superas el stock disponible.");
        existente.cant += cant;
    } else {
        posCarrito.push({ ...producto, cant: cant });
    }

    inputPosProducto.value = "";
    posProductoSeleccionadoTemporal = null;
    inputPosCant.value = 1;
    renderizarCarrito();
});

function renderizarCarrito() {
    tbodyCarrito.innerHTML = "";
    if (posCarrito.length === 0) {
        tbodyCarrito.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400 text-sm font-medium">El carrito está vacío</td></tr>`;
        actualizarTotales(); return;
    }

    posCarrito.forEach((item, index) => {
        const esMayorista = posClienteSeleccionado?.segmentacion?.es_mayorista;
        const precioUnit = esMayorista ? item.precio_mayor_usd : item.precio_usd;
        const total = precioUnit * item.cant;

        const row = document.createElement("tr")
        row.innerHTML = `
            <td class="px-4 py-3 text-sm font-bold text-gray-800">${item.nombre}</td>
            <td class="px-4 py-3 text-sm text-center font-bold">${item.cant}</td>
            <td class="px-4 py-3 text-sm text-right text-gray-500">$${precioUnit.toFixed(2)}</td>
            <td class="px-4 py-3 text-sm font-black text-brand text-right">$${total.toFixed(2)}</td>
            <td class="px-4 py-3 text-right">
                <button onclick="removerDelCarrito(${index})" class="text-red-500 hover:text-red-700"><i class="fas fa-times"></i></button>
            </td>
        `
        tbodyCarrito.appendChild(row);
    });
    actualizarTotales();
}

window.removerDelCarrito = (i) => { posCarrito.splice(i, 1); renderizarCarrito(); };

function actualizarTotales() {
    let subtotal = 0; let totalReal = 0;
    const esMayorista = posClienteSeleccionado?.segmentacion?.es_mayorista;

    posCarrito.forEach(item => {
        subtotal += item.precio_usd * item.cant;
        totalReal += (esMayorista ? item.precio_mayor_usd : item.precio_usd) * item.cant;
    });

    txtSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    txtDescuento.textContent = `-$${(subtotal - totalReal).toFixed(2)}`;
    txtTotalUsd.textContent = `$${totalReal.toFixed(2)}`;

    const tasa = parseFloat(inputTasaBcv.value) || 0;
    const totalBs = totalReal * tasa;
    
    txtTotalBs.textContent = `Bs ${totalBs.toFixed(4)}`;
}

inputTasaBcv.addEventListener("input", actualizarTotales);
selectMetodoPago.addEventListener("change", actualizarTotales);

auth.onAuthStateChanged(user => { if (user) inicializarPOS(); });
"""
    final_content = parts[0] + split_str + "\n" + new_js
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(final_content)
    print('SUCCESS')
else:
    print('COULD NOT FIND SPLIT STRING')
