import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

target = "document.getElementById('btn-cancelar-cliente').addEventListener('click', cerrarModal);"

magic_logic = """
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
        document.getElementById('cli-telefono').value = '';
        document.getElementById('cli-correo').value = '';
        document.getElementById('cli-direccion').value = '';

        let lines = raw.split(/[\\n\\t,]+/).map(l => l.trim()).filter(l => l.length > 0);

        let nombre = "";
        let tipoDoc = "V-";
        let numDoc = "";
        let telefono = "";
        let correo = "";
        let direccion = "";

        const regexDoc = /([VJGEPCvjgepc])[-.\\s]?(\\d{6,10})/i;
        const regexSoloNum = /^\\d{6,10}$/;
        const regexTel = /(\\+?58)?(0?4\\d{2}|0?2\\d{2})[-.\\s]?(\\d{7})/i;
        const regexCorreo = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/;

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
        if(telefono) document.getElementById('cli-telefono').value = telefono.replace(/\\D/g, '');
        if(correo) document.getElementById('cli-correo').value = correo.toLowerCase();
        if(direccion) document.getElementById('cli-direccion').value = direccion.toUpperCase();

        btnMagic.innerHTML = '<i class="fas fa-check"></i> ¡LISTO!';
        setTimeout(() => {
            btnMagic.innerHTML = '✨ AUTOCOMPLETAR DATOS';
            txtMagic.value = '';
        }, 1500);
    });
}
"""

if "PEGADO MÁGICO (WHATSAPP)" not in content:
    content = content.replace(target, target + "\n" + magic_logic)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print("SUCCESS MAGIC")
else:
    print("ALREADY EXISTS")
