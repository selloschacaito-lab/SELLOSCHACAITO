import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace("document.getElementById('cli-telefono').value", "document.getElementById('cli-whatsapp').value")
content = content.replace("document.getElementById('cli-correo').value = '';", "")
content = content.replace("if(correo) document.getElementById('cli-correo').value = correo.toLowerCase();", "")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("FIXED")
