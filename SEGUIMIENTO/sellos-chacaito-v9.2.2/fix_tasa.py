import codecs
file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace("const tasa = parseFloat(inputTasaBcv.value) || 0;", "const tasa = parseFloat(String(inputTasaBcv.value).replace(',', '.')) || 0;")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
