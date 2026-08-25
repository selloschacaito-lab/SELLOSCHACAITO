import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace('padding: 10px; color: #000; }', 'padding: 0; color: #000; }\n                .receipt-container { width: 50%; margin: 0 auto; padding: 20px; box-sizing: border-box; }\n                @media print { .receipt-container { width: 50%; margin: 0 auto; padding: 10px; } }')

# Add opening div
content = content.replace('<body>\n            <div class="center title bold">SELLOS CHACAITO</div>', '<body>\n            <div class="receipt-container">\n            <div class="center title bold">SELLOS CHACAITO</div>')

# Add closing div
content = content.replace('Revise el estado de su pedido en nuestra web.\n            </div>\n        </body>', 'Revise el estado de su pedido en nuestra web.\n            </div>\n            </div>\n        </body>')

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print('FIXED RECIBO LAYOUT V2')
