import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

old_val = '''    const tasa = parseFloat(String(inputTasaBcv.value).replace(',', '.')) || 0;
    if (tasa <= 0) return alert("La Tasa BCV debe ser mayor a 0.");

    const metodoPago = document.getElementById('pos-metodo-pago').value;'''

new_val = '''    const tasa = parseFloat(String(inputTasaBcv.value).replace(',', '.')) || 0;
    const metodoPago = document.getElementById('pos-metodo-pago').value;
    
    const requiereBs = metodoPago.includes('BS') || metodoPago === 'PAGO_MOVIL';
    if (requiereBs && tasa <= 0) {
        return alert("Para pagos en Bolívares (Pago Móvil, Transferencia, Efectivo Bs), debes ingresar una Tasa BCV válida.");
    }'''

if old_val in content:
    content = content.replace(old_val, new_val)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print('FIXED VALIDATION')
else:
    print('NOT FOUND')
