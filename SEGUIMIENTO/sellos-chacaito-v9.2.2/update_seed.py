import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

seed_logic = """
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

            await b.commit();
            alert("¡Listo! Ya puedes escribir 'PRUEBA' en los buscadores.");
            btnSeedTest.style.display = "none";
        } catch (e) {
            alert("Error: " + e.message);
            btnSeedTest.disabled = false;
        }
    });
}
"""

if "BOTON: GENERAR DATOS DE PRUEBA" not in content:
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content + "\n" + seed_logic)
    print("SUCCESS SEED")
else:
    print("ALREADY SEEDED")
