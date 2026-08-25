import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Fix btnSeedTest
content = content.replace('await b.commit();', 'b.commit().catch(e => console.error(e));')

# Fix btnProcesar
old_procesar = """        // Ejecutar Transacción Firestore
        await batch.commit();

        // 4. Sincronizar con Realtime Database (Seguimiento Público)
        const rtRef = firebase.database().ref('pedidos/' + idVenta);
        await rtRef.set({"""

new_procesar = """        // Ejecutar Transacción Firestore (Fire and forget para máxima rapidez)
        batch.commit().catch(e => console.error(e));

        // 4. Sincronizar con Realtime Database (Seguimiento Público)
        const rtRef = firebase.database().ref('pedidos/' + idVenta);
        rtRef.set({"""

if old_procesar in content:
    content = content.replace(old_procesar, new_procesar)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print('REMOVED AWAIT')
else:
    print('NOT FOUND')
