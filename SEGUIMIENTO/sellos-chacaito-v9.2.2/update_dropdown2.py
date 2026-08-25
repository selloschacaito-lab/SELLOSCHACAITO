import codecs

file_path = r'c:\Users\User\Documents\SEGUIMIENTO DE PEDIDOS SELLOS CHACAITO\sellos-chacaito-v9.2.2\admin.js'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

start_str = "function configurarDropdown(input, dropdown, memoria, onSelectRender, onSelectCallback) {"
end_str = "    });\n}"

start_idx = content.find(start_str)
if start_idx == -1:
    print("START NOT FOUND")
    exit()

end_idx = content.find(end_str, start_idx)
if end_idx == -1:
    # Try different ending
    end_str = "    });\r\n}"
    end_idx = content.find(end_str, start_idx)
    if end_idx == -1:
        print("END NOT FOUND")
        exit()

end_idx += len(end_str)

new_func = '''function configurarDropdown(input, dropdown, memoria, onSelectRender, onSelectCallback) {
    const showResults = (query) => {
        dropdown.innerHTML = "";
        
        let resultados;
        if (query.length === 0) {
            resultados = memoria.slice(0, 50); // Top 50 default
        } else {
            resultados = memoria.filter(item => item.searchText.includes(query)).slice(0, 50);
        }
        
        if (resultados.length === 0) {
            dropdown.innerHTML = `<div class="p-3 text-sm text-gray-500">No se encontraron resultados</div>`;
            dropdown.classList.remove("hidden");
            return;
        }

        resultados.forEach(item => {
            const div = document.createElement("div");
            div.className = "p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-sm font-bold text-gray-700";
            div.innerHTML = onSelectRender(item);
            
            div.addEventListener("click", () => {
                let plainText = div.innerText.split('\\n')[0];
                if(input.id === 'pos-buscar-cliente') plainText = item.identidad.nombre_razon;
                if(input.id === 'pos-buscar-producto') plainText = item.nombre;
                
                input.value = plainText;
                dropdown.classList.add("hidden");
                onSelectCallback(item);
            });
            dropdown.appendChild(div);
        });
        dropdown.classList.remove("hidden");
    };

    input.addEventListener("input", (e) => {
        const query = e.target.value.trim().toUpperCase();
        showResults(query);
    });
    
    input.addEventListener("focus", () => {
        showResults(input.value.trim().toUpperCase());
    });
    
    const btnId = input.id.replace('pos-buscar-', 'btn-drop-');
    const btn = document.getElementById(btnId);
    if(btn) {
        btn.addEventListener('click', () => {
            if (!dropdown.classList.contains('hidden') && input.value.trim().length === 0) {
                dropdown.classList.add("hidden");
            } else {
                input.focus();
                showResults(input.value.trim().toUpperCase());
            }
        });
    }

    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target) && (!btn || !btn.contains(e.target))) {
            dropdown.classList.add("hidden");
        }
    });
}'''

new_content = content[:start_idx] + new_func + content[end_idx:]

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(new_content)
print("SUCCESS DROPDOWN")
