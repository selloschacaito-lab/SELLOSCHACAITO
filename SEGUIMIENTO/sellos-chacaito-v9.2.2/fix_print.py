import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

old_logic = """Revise el estado de su pedido en nuestra web.
            </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                }
                window.onafterprint = function() {
                    window.close();
                }
            </script>
        </body>
        </html>
    `);
    
    ventanita.document.close();
}"""

new_logic = """Revise el estado de su pedido en nuestra web.
            </div>
            </div>
        </body>
        </html>
    `);
    
    ventanita.document.close();
    ventanita.focus();
    setTimeout(() => {
        ventanita.print();
    }, 250);
    
    ventanita.onafterprint = function() {
        ventanita.close();
    };
}"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print('FIXED PRINT LOGIC 2')
else:
    # Try just regex replace of the script tag
    import re
    content = re.sub(r'<script>[\s\S]*?</script>', '', content)
    content = content.replace('ventanita.document.close();\n}', 'ventanita.document.close();\n    ventanita.focus();\n    setTimeout(() => { ventanita.print(); }, 250);\n    ventanita.onafterprint = function() { ventanita.close(); };\n}')
    with codecs.open(file_path, 'w', 'utf-8') as f:
        f.write(content)
    print('FIXED WITH REGEX')
