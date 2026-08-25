import codecs
import re

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

bad_idx = content.find('"""')
if bad_idx != -1:
    fixed_content = content[:bad_idx].strip()
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(fixed_content)
    print('FIXED')
else:
    print('NOT FOUND')
