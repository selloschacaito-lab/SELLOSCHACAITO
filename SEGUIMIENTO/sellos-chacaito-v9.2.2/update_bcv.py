import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

fetch_logic = """
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
"""

if "AUTO-FETCH TASA BCV" not in content:
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content + "\n" + fetch_logic)
    print("SUCCESS FETCH")
else:
    print("ALREADY EXISTS")
