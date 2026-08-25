// ConfiguraciÃ³n de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD7YzgDdk38Ij3bNEKISra_UWDA8i7vQNQ",
    authDomain: "seguimiento-sellos-chacaito.firebaseapp.com",
    databaseURL: "https://seguimiento-sellos-chacaito-default-rtdb.firebaseio.com",
    projectId: "seguimiento-sellos-chacaito",
    storageBucket: "seguimiento-sellos-chacaito.firebasestorage.app",
    messagingSenderId: "62441533319",
    appId: "1:62441533319:web:16cdcf3ae7ab4e39676d22"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// -------------------------------------------------------------------
// 1. AUTENTICACIÃN
// -------------------------------------------------------------------
const loginScreen = document.getElementById('login-screen');
const appDashboard = document.getElementById('app-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

auth.onAuthStateChanged((user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        appDashboard.classList.remove('hidden');
        document.getElementById('user-email-display').textContent = user.email;
        cargarClientes(); // Cargar datos apenas entra
    } else {
        loginScreen.classList.remove('hidden');
        appDashboard.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(document.getElementById('email').value.trim(), document.getElementById('password').value)
        .then(() => { loginError.classList.add('hidden'); loginForm.reset(); })
        .catch((error) => {
            loginError.textContent = "Error: Correo o contraseÃ±a incorrectos.";
            loginError.classList.remove('hidden');
        });
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// -------------------------------------------------------------------
// 2. NAVEGACIÃN LATERAL
// -------------------------------------------------------------------
const navLinks = document.querySelectorAll('.nav-link');
const pageSections = document.querySelectorAll('.page-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Quitar estado activo de todos los links
        navLinks.forEach(l => {
            l.classList.remove('bg-brand-light', 'text-brand', 'border-r-4', 'border-brand');
            l.classList.add('text-gray-700');
        });
        
        // Poner estado activo al clickeado
        link.classList.add('bg-brand-light', 'text-brand', 'border-r-4', 'border-brand');
        link.classList.remove('text-gray-700');

        // Ocultar todas las secciones
        pageSections.forEach(section => section.classList.add('hidden'));

        // Mostrar la secciÃ³n correspondiente
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// -------------------------------------------------------------------
// 3. MÃDULO DE CLIENTES (CRUD BÃ¡sico)
// -------------------------------------------------------------------
const modalCliente = document.getElementById('modal-cliente');
const formCliente = document.getElementById('form-cliente');
const tablaClientesBody = document.getElementById('tabla-clientes-body');
const loadingClientes = document.getElementById('loading-clientes');

// Abrir/Cerrar Modal
document.getElementById('btn-nuevo-cliente').addEventListener('click', () => {
    formCliente.reset();
    modalCliente.classList.remove('hidden');
});
const cerrarModal = () => modalCliente.classList.add('hidden');
document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);
document.getElementById('btn-cancelar-cliente').addEventListener('click', cerrarModal);

// -----------------------------------------
// PEGADO MÁGICO (WHATSAPP)
// -----------------------------------------
const btnMagic = document.getElementById('btn-magic-paste');
const txtMagic = document.getElementById('cli-magic-paste');

if(btnMagic && txtMagic) {
    btnMagic.addEventListener('click', () => {
        const raw = txtMagic.value.trim();
        if(!raw) return;

        // Limpiamos los campos
        document.getElementById('cli-nombre').value = '';
        document.getElementById('cli-documento').value = '';
        document.getElementById('cli-whatsapp').value = '';
        
        document.getElementById('cli-direccion').value = '';

        let lines = raw.split(/[\n\t,]+/).map(l => l.trim()).filter(l => l.length > 0);

        let nombre = "";
        let tipoDoc = "V-";
        let numDoc = "";
        let telefono = "";
        let correo = "";
        let direccion = "";

        const regexDoc = /([VJGEPCvjgepc])[-.\s]?(\d{6,10})/i;
        const regexSoloNum = /^\d{6,10}$/;
        const regexTel = /(\+?58)?(0?4\d{2}|0?2\d{2})[-.\s]?(\d{7})/i;
        const regexCorreo = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

        lines.forEach((line) => {
            if(!correo && regexCorreo.test(line)) {
                correo = line.match(regexCorreo)[0];
                line = line.replace(correo, '').trim();
            }

            if(!telefono && regexTel.test(line)) {
                telefono = line.match(regexTel)[0];
                line = line.replace(telefono, '').trim();
            }

            if(!numDoc) {
                let docMatch = line.match(regexDoc);
                if(docMatch) {
                    tipoDoc = docMatch[1].toUpperCase() + "-";
                    numDoc = docMatch[2];
                    line = line.replace(docMatch[0], '').trim();
                } else if (regexSoloNum.test(line) && line.length >= 6) {
                    numDoc = line;
                    tipoDoc = "V-";
                    line = "";
                }
            }

            if (line.length > 2) {
                if (!nombre) {
                    nombre = line;
                } else {
                    direccion += (direccion ? " " : "") + line;
                }
            }
        });

        if(nombre) document.getElementById('cli-nombre').value = nombre.toUpperCase();
        if(numDoc) {
            document.getElementById('cli-documento').value = numDoc;
            document.getElementById('cli-doc-tipo').value = tipoDoc;
        }
        if(telefono) document.getElementById('cli-whatsapp').value = telefono.replace(/\D/g, '');
        
        if(direccion) document.getElementById('cli-direccion').value = direccion.toUpperCase();

        btnMagic.innerHTML = '<i class="fas fa-check"></i> ¡LISTO!';
        setTimeout(() => {
            btnMagic.innerHTML = '✨ AUTOCOMPLETAR DATOS';
            txtMagic.value = '';
        }, 1500);
    });
}


// Crear nuevo cliente
formCliente.addEventListener('submit', (e) => {
    e.preventDefault(); // Evitar recarga
    
    const docTipo = document.getElementById('cli-doc-tipo').value;
    const docNum = document.getElementById('cli-documento').value.trim().toUpperCase();
    const documentoFinal = docNum ? `${docTipo}${docNum}` : "";

    // 1. Generamos el ID de forma instantÃ¡nea y local (sin esperar a internet)
    const docRef = db.collection('clientes').doc();

    const clienteData = {
        id_cliente: docRef.id, // Lo guardamos en 1 solo paso
        identidad: {
            nombre_razon: document.getElementById('cli-nombre').value.trim().toUpperCase(),
            documento: documentoFinal
        },
        contacto: {
            whatsapp_principal: document.getElementById('cli-whatsapp').value.trim(),
            direccion: document.getElementById('cli-direccion').value.trim().toUpperCase()
        },
        segmentacion: {
            es_mayorista: document.getElementById('cli-mayorista').checked
        },
        estadisticas: {
            fecha_registro: firebase.firestore.FieldValue.serverTimestamp(),
            total_comprado_usd: 0,
            cantidad_pedidos: 0
        }
    };

    // 2. Cerramos la ventana y limpiamos el formulario de forma INMEDIATA
    formCliente.reset();
    cerrarModal();

    // 3. Enviamos los datos al servidor en segundo plano
    docRef.set(clienteData).catch((error) => {
        console.error("Error al registrar cliente:", error);
        alert(`OcurriÃ³ un error guardando al cliente en la nube: ${error.message}`);
    });
});

// Leer y mostrar clientes en tiempo real
function cargarClientes() {
    loadingClientes.classList.remove('hidden');
    tablaClientesBody.innerHTML = '';

    db.collection('clientes').orderBy('estadisticas.fecha_registro', 'desc')
      .onSnapshot((snapshot) => {
          loadingClientes.classList.add('hidden');
          tablaClientesBody.innerHTML = ''; // Limpiar tabla

          if (snapshot.empty) {
              tablaClientesBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No hay clientes registrados aÃºn.</td></tr>`;
              return;
          }

          snapshot.forEach((doc) => {
              const cliente = doc.data();
              const badgeMayorista = cliente.segmentacion?.es_mayorista 
                  ? `<span class="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">Mayorista</span>` 
                  : `<span class="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">Al detal</span>`;

              const row = document.createElement('tr');
              row.classList.add('hover:bg-gray-50', 'transition-colors');
              row.innerHTML = `
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${cliente.identidad?.nombre_razon || '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${cliente.identidad?.documento || '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${cliente.contacto?.whatsapp_principal || '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap">${badgeMayorista}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-indigo-600 hover:text-indigo-900 mr-3" title="Editar"><i class="fas fa-edit"></i></button>
                      <button class="text-red-600 hover:text-red-900" title="Eliminar" onclick="eliminarCliente('${doc.id}')"><i class="fas fa-trash"></i></button>
                  </td>
              `;
              tablaClientesBody.appendChild(row);
          });
      }, (error) => {
          console.error("Error al obtener clientes:", error);
          loadingClientes.classList.add('hidden');
          tablaClientesBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500 font-bold">Error al cargar datos. AsegÃºrate de tener permisos en Firestore.</td></tr>`;
      });
}

// FunciÃ³n global para eliminar cliente (bÃ¡sica)
window.eliminarCliente = async (id) => {
    if (confirm("Â¿EstÃ¡s seguro de que deseas eliminar este cliente? Esto no se puede deshacer.")) {
        try {
            await db.collection('clientes').doc(id).delete();
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("No tienes permisos o hubo un error al eliminar.");
        }
    }
};

// -------------------------------------------------------------------
// 4. IMPORTACIÃN MASIVA DE EXCEL
// -------------------------------------------------------------------
const btnImportarExcel = document.getElementById('btn-importar-excel');
const excelFileInput = document.getElementById('excel-file-input');

if(btnImportarExcel && excelFileInput) {
    btnImportarExcel.addEventListener('click', () => {
        excelFileInput.click();
    });

    excelFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Cambiar estado visual del botÃ³n
        const originalHtml = btnImportarExcel.innerHTML;
        btnImportarExcel.innerHTML = '<i class="fas fa-spinner fa-spin text-brand mr-2"></i> Procesando...';
        btnImportarExcel.disabled = true;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1}); 

                // Quitar encabezados (Fila 1)
                rows.shift();

                let batch = db.batch();
                let count = 0;
                let totalImportados = 0;

                for (let row of rows) {
                    const nombre = String(row[2] || '').trim();
                    if (!nombre) continue; // Si no hay nombre, saltar fila

                    // Limpiar cÃ©dula (Quitar puntos, mantener V- / J-)
                    let cedulaLimpia = String(row[3] || '').replace(/\./g, '').trim().toUpperCase();
                    
                    const docRef = db.collection('clientes').doc();
                    const clienteData = {
                        id_cliente: docRef.id,
                        identidad: {
                            nombre_razon: nombre.toUpperCase(),
                            documento: cedulaLimpia
                        },
                        contacto: {
                            whatsapp_principal: String(row[4] || '').trim(),
                            direccion: String(row[6] || '').trim().toUpperCase()
                        },
                        segmentacion: {
                            es_mayorista: false 
                        },
                        estadisticas: {
                            fecha_registro: firebase.firestore.FieldValue.serverTimestamp(),
                            cantidad_pedidos: Number(row[9]) || 0,
                            total_comprado_usd: Number(row[10]) || 0
                        }
                    };

                    batch.set(docRef, clienteData);
                    count++;
                    totalImportados++;

                    // Firestore limite por batch = 500
                    if (count === 490) {
                        await batch.commit();
                        batch = db.batch(); // Iniciar nuevo lote
                        count = 0;
                    }
                }

                // Subir el remanente
                if (count > 0) {
                    await batch.commit();
                }

                alert(`Â¡Ãxito! Se importaron ${totalImportados} clientes correctamente a tu nueva base de datos.`);
                
            } catch (error) {
                console.error("Error importando excel:", error);
                alert("Hubo un error procesando el archivo: " + error.message);
            } finally {
                // Restaurar botÃ³n
                btnImportarExcel.innerHTML = originalHtml;
                btnImportarExcel.disabled = false;
                excelFileInput.value = ""; // Resetear input
            }
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// -------------------------------------------------------------------
// 5. MÃDULO DE INVENTARIO / PRODUCTOS
// -------------------------------------------------------------------
const modalProducto = document.getElementById('modal-producto');
const formProducto = document.getElementById('form-producto');
const tablaProductosBody = document.getElementById('tabla-productos-body');
const loadingProductos = document.getElementById('loading-productos');
const categoriasList = document.getElementById('categorias-list');
const inputPrecio = document.getElementById('prod-precio');
const inputMayor = document.getElementById('prod-mayor');

// Abrir/Cerrar Modal Producto
if(document.getElementById('btn-nuevo-producto')){
    document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
        formProducto.reset();
        modalProducto.classList.remove('hidden');
    });
    
    const cerrarModalProd = () => modalProducto.classList.add('hidden');
    document.getElementById('btn-cerrar-modal-prod').addEventListener('click', cerrarModalProd);
    document.getElementById('btn-cancelar-producto').addEventListener('click', cerrarModalProd);
    
    // Calcular Precio Mayorista AutomÃ¡ticamente (-20%)
    inputPrecio.addEventListener('input', (e) => {
        const precioNormal = parseFloat(e.target.value) || 0;
        const precioMayor = precioNormal * 0.80; // 20% descuento
        inputMayor.value = precioMayor.toFixed(2);
    });

    // Guardar Producto (Optimistic UI)
    formProducto.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const docRef = db.collection('productos').doc();
        const productoData = {
            id_producto: docRef.id,
            nombre: document.getElementById('prod-nombre').value.trim().toUpperCase(),
            categoria: document.getElementById('prod-categoria').value.trim().toUpperCase(),
            costo_usd: parseFloat(document.getElementById('prod-costo').value) || 0,
            precio_usd: parseFloat(document.getElementById('prod-precio').value) || 0,
            precio_mayor_usd: parseFloat(document.getElementById('prod-mayor').value) || 0,
            cantidad_stock: parseInt(document.getElementById('prod-stock').value) || 0,
            fecha_creacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        formProducto.reset();
        cerrarModalProd();

        docRef.set(productoData).catch((error) => {
            console.error("Error guardando producto:", error);
            alert(`OcurriÃ³ un error guardando el producto: ${error.message}`);
        });
    });

    // Leer Productos en Tiempo Real
    function cargarProductos() {
        if(!loadingProductos) return;
        loadingProductos.classList.remove('hidden');
        
        db.collection('productos').orderBy('categoria').orderBy('nombre')
          .onSnapshot((snapshot) => {
              loadingProductos.classList.add('hidden');
              tablaProductosBody.innerHTML = ''; 
              
              let categoriasUnicas = new Set();
              
              if (snapshot.empty) {
                  tablaProductosBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No hay productos registrados.</td></tr>`;
              } else {
                  snapshot.forEach((doc) => {
                      const prod = doc.data();
                      categoriasUnicas.add(prod.categoria); // Guardar categorÃ­a para el datalist
                      
                      const badgeStock = prod.cantidad_stock <= 5 
                          ? `<span class="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">${prod.cantidad_stock} (Bajo)</span>` 
                          : `<span class="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">${prod.cantidad_stock}</span>`;

                      const row = document.createElement('tr');
                      row.classList.add('hover:bg-gray-50', 'transition-colors');
                      row.innerHTML = `
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${prod.nombre || '-'}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${prod.categoria || '-'}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">C: $${(prod.costo_usd||0).toFixed(2)} / V: <span class="font-bold text-gray-900">$${(prod.precio_usd||0).toFixed(2)}</span></td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">$${(prod.precio_mayor_usd||0).toFixed(2)}</td>
                          <td class="px-6 py-4 whitespace-nowrap">${badgeStock}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button class="text-indigo-600 hover:text-indigo-900 mr-3" title="Editar"><i class="fas fa-edit"></i></button>
                              <button class="text-red-600 hover:text-red-900" title="Eliminar" onclick="eliminarProducto('${doc.id}')"><i class="fas fa-trash"></i></button>
                          </td>
                      `;
                      tablaProductosBody.appendChild(row);
                  });
              }

              // Actualizar el datalist de CategorÃ­as
              categoriasList.innerHTML = '';
              categoriasUnicas.forEach(cat => {
                  const option = document.createElement('option');
                  option.value = cat;
                  categoriasList.appendChild(option);
              });

          }, (error) => {
              console.error("Error al obtener productos:", error);
              loadingProductos.classList.add('hidden');
          });
    }
    
    // Cargar productos al iniciar sesiÃ³n
    auth.onAuthStateChanged((user) => {
        if (user) cargarProductos();
    });

    window.eliminarProducto = async (id) => {
        if (confirm("Â¿Seguro que deseas eliminar este producto?")) {
            db.collection('productos').doc(id).delete().catch(e => alert("Error al eliminar"));
        }
    };
    
    // ImportaciÃ³n Masiva Excel Productos
    const btnImportarProdExcel = document.getElementById('btn-importar-productos');
    const excelProdInput = document.getElementById('excel-producto-input');
    
    btnImportarProdExcel.addEventListener('click', () => {
        alert("AsegÃºrate de que tu Excel de inventario tenga las columnas en este orden (fila 1 de tÃ­tulos):\nA: Nombre Completo\nB: CategorÃ­a\nC: Costo ($)\nD: Precio de Venta ($)\nE: Stock");
        excelProdInput.click();
    });

    excelProdInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const originalHtml = btnImportarProdExcel.innerHTML;
        btnImportarProdExcel.innerHTML = '<i class="fas fa-spinner fa-spin text-brand mr-2"></i> Procesando...';
        btnImportarProdExcel.disabled = true;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1}); 
                rows.shift(); // Quitar fila 1

                let batch = db.batch();
                let count = 0; let total = 0;

                for (let row of rows) {
                    const nombre = String(row[0] || '').trim();
                    if (!nombre) continue; 
                    
                    const precioVenta = parseFloat(row[3]) || 0;

                    const docRef = db.collection('productos').doc();
                    batch.set(docRef, {
                        id_producto: docRef.id,
                        nombre: nombre.toUpperCase(),
                        categoria: String(row[1] || 'SIN CATEGORIA').trim().toUpperCase(),
                        costo_usd: parseFloat(row[2]) || 0,
                        precio_usd: precioVenta,
                        precio_mayor_usd: precioVenta * 0.8,
                        cantidad_stock: parseInt(row[4]) || 0,
                        fecha_creacion: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    count++; total++;

                    if (count === 490) { await batch.commit(); batch = db.batch(); count = 0; }
                }
                if (count > 0) await batch.commit();
                
                alert(`Â¡Ãxito! Se importaron ${total} productos.`);
            } catch (error) {
                alert("Error: " + error.message);
            } finally {
                btnImportarProdExcel.innerHTML = originalHtml;
                btnImportarProdExcel.disabled = false;
                excelProdInput.value = "";
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// -------------------------------------------------------------------
// 6. MOTOR DE VENTAS (POS) - CARRITO Y MATEMÁTICA
// -------------------------------------------------------------------
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
const txtTotalUsd = document.getElementById("pos-total-usd");
const txtTotalBs = document.getElementById("pos-total-bs");
const selectMetodoPago = document.getElementById("pos-metodo-pago");

function inicializarPOS() {
    db.collection("clientes").onSnapshot(snap => {
        posClientesMemoria.length = 0;
        snap.forEach(doc => {
            const c = doc.data();
            c.id = doc.id;
            c.searchText = `${c.identidad?.documento || ''} ${c.identidad?.nombre_razon || ''}`.toUpperCase();
            posClientesMemoria.push(c);
        });
        posClientesMemoria.sort((a,b) => (b.fecha_creacion?.toMillis?.() || 0) - (a.fecha_creacion?.toMillis?.() || 0));
    });

    db.collection("productos").where("cantidad_stock", ">", 0).onSnapshot(snap => {
        posProductosMemoria.length = 0;
        snap.forEach(doc => {
            const p = doc.data();
            p.id = doc.id;
            p.searchText = `${p.categoria || ''} ${p.nombre || ''}`.toUpperCase();
            posProductosMemoria.push(p);
        });
        posProductosMemoria.sort((a,b) => (b.fecha_creacion?.toMillis?.() || 0) - (a.fecha_creacion?.toMillis?.() || 0));
    });
}

function configurarDropdown(input, dropdown, memoria, onSelectRender, onSelectCallback) {
    const showResults = (query) => {
        dropdown.innerHTML = "";
        
        let resultados;
        if (query.length === 0) {
            resultados = memoria.slice(0, 50); // Top 50 default
        } else {
            resultados = memoria.filter(item => item.searchText.includes(query)).slice(0, 50);
        }
        
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
                let plainText = div.innerText.split('\n')[0];
                if(input.id === 'pos-buscar-cliente') plainText = item.identidad.nombre_razon;
                if(input.id === 'pos-buscar-producto') plainText = item.nombre;
                
                input.value = plainText;
                dropdown.classList.add("hidden");
                onSelectCallback(item);
            });
            dropdown.appendChild(div);
        });
        dropdown.classList.remove("hidden");
    };

    input.addEventListener("input", (e) => {
        const query = e.target.value.trim().toUpperCase();
        showResults(query);
    });
    
    input.addEventListener("focus", () => {
        showResults(input.value.trim().toUpperCase());
    });
    
    const btnId = input.id.replace('pos-buscar-', 'btn-drop-');
    const btn = document.getElementById(btnId);
    if(btn) {
        btn.addEventListener('click', () => {
            if (!dropdown.classList.contains('hidden') && input.value.trim().length === 0) {
                dropdown.classList.add("hidden");
            } else {
                input.focus();
                showResults(input.value.trim().toUpperCase());
            }
        });
    }

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
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
    txtTotalUsd.textContent = `$${totalReal.toFixed(2)}`;

    const tasa = parseFloat(String(inputTasaBcv.value).replace(',', '.')) || 0;
    const totalBs = totalReal * tasa;
    
    txtTotalBs.textContent = `Bs ${totalBs.toFixed(4)}`;
}

inputTasaBcv.addEventListener("input", actualizarTotales);
selectMetodoPago.addEventListener("change", actualizarTotales);

auth.onAuthStateChanged(user => { if (user) inicializarPOS(); });

// -------------------------------------------------------------------
// 7. PROCESAR VENTA Y RECIBO
// -------------------------------------------------------------------
const btnProcesar = document.getElementById("btn-procesar-venta");

btnProcesar.addEventListener("click", async () => {
    if (!posClienteSeleccionado) return alert("Debes seleccionar un cliente de la lista.");
    if (posCarrito.length === 0) return alert("El carrito está vacío.");
    
    const tasa = parseFloat(String(inputTasaBcv.value).replace(',', '.')) || 0;
    const metodoPago = document.getElementById('pos-metodo-pago').value;
    
    const requiereBs = metodoPago.includes('BS') || metodoPago === 'PAGO_MOVIL';
    if (requiereBs && tasa <= 0) {
        return alert("Para pagos en Bolívares (Pago Móvil, Transferencia, Efectivo Bs), debes ingresar una Tasa BCV válida.");
    }
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
                telefono: posClienteSeleccionado.contacto?.telefono || ''
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

        // Ejecutar Transacción Firestore (Fire and forget para máxima rapidez)
        batch.commit().catch(e => console.error(e));

        // 4. Sincronizar con Realtime Database (Seguimiento Público)
        const rtRef = firebase.database().ref('pedidos/' + idVenta);
        rtRef.set({
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
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; margin: 0; padding: 0; color: #000; }
                .receipt-container { width: 50%; margin: 0 auto; padding: 20px; box-sizing: border-box; }
                @media print { .receipt-container { width: 50%; margin: 0 auto; padding: 10px; } }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .title { font-size: 16px; margin-bottom: 5px; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .totals { margin-top: 10px; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="receipt-container">
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
            
            
        </body>
        </html>
    `);
    
    ventanita.document.close();
    ventanita.focus();
    setTimeout(() => { ventanita.print(); }, 250);
    ventanita.onafterprint = function() { ventanita.close(); };
}


// -------------------------------------------------------------------
// BOTON: GENERAR DATOS DE PRUEBA
// -------------------------------------------------------------------
const btnSeedTest = document.getElementById('btn-seed-test');
if(btnSeedTest) {
    btnSeedTest.addEventListener('click', async () => {
        if(!confirm("Esto creará 3 clientes y 3 productos falsos con la palabra 'PRUEBA'. ¿Continuar?")) return;
        btnSeedTest.disabled = true;
        btnSeedTest.innerHTML = "Generando...";

        try {
            const b = db.batch();
            
            // Clientes
            const c1 = db.collection('clientes').doc('test-c1');
            b.set(c1, { identidad: {nombre_razon: "CLIENTE PRUEBA 1", documento: "V-11111111"}, segmentacion: {es_mayorista: false}, fecha_creacion: firebase.firestore.FieldValue.serverTimestamp() });
            
            const c2 = db.collection('clientes').doc('test-c2');
            b.set(c2, { identidad: {nombre_razon: "CLIENTE MAYORISTA PRUEBA 2", documento: "J-22222222"}, segmentacion: {es_mayorista: true}, fecha_creacion: firebase.firestore.FieldValue.serverTimestamp() });
            
            const c3 = db.collection('clientes').doc('test-c3');
            b.set(c3, { identidad: {nombre_razon: "CLIENTE PRUEBA 3", documento: "E-33333333"}, segmentacion: {es_mayorista: false}, fecha_creacion: firebase.firestore.FieldValue.serverTimestamp() });

            // Productos
            const p1 = db.collection('productos').doc('test-p1');
            b.set(p1, { nombre: "SELLO PRUEBA COLOP 4911", categoria: "SELLOS", costo_usd: 2, precio_usd: 5, precio_mayor_usd: 4, cantidad_stock: 100, fecha_creacion: firebase.firestore.FieldValue.serverTimestamp() });
            
            const p2 = db.collection('productos').doc('test-p2');
            b.set(p2, { nombre: "SELLO PRUEBA TRODAT 4912", categoria: "SELLOS", costo_usd: 3, precio_usd: 7, precio_mayor_usd: 5, cantidad_stock: 100, fecha_creacion: firebase.firestore.FieldValue.serverTimestamp() });
            
            const p3 = db.collection('productos').doc('test-p3');
            b.set(p3, { nombre: "ALMOHADILLA DE PRUEBA", categoria: "ACCESORIOS", costo_usd: 1, precio_usd: 3, precio_mayor_usd: 2, cantidad_stock: 50, fecha_creacion: firebase.firestore.FieldValue.serverTimestamp() });

            b.commit().catch(e => console.error(e));
            alert("¡Listo! Ya puedes escribir 'PRUEBA' en los buscadores.");
            btnSeedTest.style.display = "none";
        } catch (e) {
            alert("Error: " + e.message);
            btnSeedTest.disabled = false;
        }
    });
}


// -------------------------------------------------------------------
// AUTO-FETCH TASA BCV
// -------------------------------------------------------------------
async function obtenerTasaBCV() {
    try {
        const inputTasa = document.getElementById("pos-tasa-bcv");
        if(inputTasa) {
            inputTasa.placeholder = "Cargando...";
            const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
            const data = await res.json();
            if(data && data.promedio) {
                inputTasa.value = parseFloat(data.promedio).toFixed(4);
                if(typeof actualizarTotales === 'function') actualizarTotales();
            }
        }
    } catch (e) {
        console.error("No se pudo obtener la tasa BCV automática:", e);
        const inputTasa = document.getElementById("pos-tasa-bcv");
        if(inputTasa) inputTasa.placeholder = "Ej: 779.9522";
    }
}
document.addEventListener("DOMContentLoaded", () => {
    obtenerTasaBCV();
});

obtenerTasaBCV();


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
