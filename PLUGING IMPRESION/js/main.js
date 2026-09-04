/**
 * Sellos Chacaíto - CEP Panel Controller
 */

// Inicializar CSInterface
var csInterface = new CSInterface();

// Carga garantizada del archivo JSX en Illustrator
function ensureHostScriptLoaded(callback) {
    csInterface.evalScript('typeof processLaser === "function"', function(isLoaded) {
        if (isLoaded === "true" || isLoaded === true) {
            if (callback) callback(true);
        } else {
            var extPath = csInterface.getSystemPath(SystemPath.EXTENSION).replace(/\\/g, "/");
            var jsxFile = extPath + "/jsx/hostscript.jsx";
            var loadCmd = '$.evalFile("' + jsxFile + '");';
            csInterface.evalScript(loadCmd, function(evalRes) {
                csInterface.evalScript('typeof processLaser === "function"', function(checkAgain) {
                    if (checkAgain === "true" || checkAgain === true) {
                        if (callback) callback(true);
                    } else {
                        log("Aviso al cargar funciones: " + evalRes, "error");
                        if (callback) callback(false);
                    }
                });
            });
        }
    });
}

function evalHostScript(script, callback) {
    ensureHostScriptLoaded(function(ok) {
        if (ok) {
            csInterface.evalScript(script, callback);
        }
    });
}

// Estado de la aplicación
var state = {
    sizes: [],
    icons: [],
    iconsFolder: "",
    selectedCategory: "all",
    searchQuery: "",
    settings: {
        laserMargin: 0.0,
        laserDpi: 2400,
        photoMargin: 7.5
    }
};

// Variables para Drag and Drop
var draggedIndex = null;

// Logger en el panel
function log(message, type) {
    var consoleEl = document.getElementById("console-output");
    if (!consoleEl) return;
    
    var span = document.createElement("div");
    var now = new Date();
    var timeStr = now.toTimeString().split(" ")[0];
    
    if (type === "error") {
        span.className = "log-error";
        span.textContent = "[" + timeStr + "] ❌ " + message;
    } else if (type === "info") {
        span.className = "log-info";
        span.textContent = "[" + timeStr + "] ℹ️ " + message;
    } else {
        span.className = "log-success";
        span.textContent = "[" + timeStr + "] ✅ " + message;
    }
    
    consoleEl.appendChild(span);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Nombres que se deben eliminar automáticamente si estaban guardados
var unwantedNames = ["4911", "9511", "9512", "Cuadrado 45", "R-542 Redondo", "Bolsillo 4910", "4913", "4912"];

// Cargar y Guardar en LocalStorage
function loadState() {
    try {
        var savedSizes = localStorage.getItem("sc_custom_sizes_v2");
        if (savedSizes) {
            var parsed = JSON.parse(savedSizes);
            // Filtrar los botones eliminados por el usuario
            state.sizes = parsed.filter(function(item) {
                return unwantedNames.indexOf(item.name) === -1 && !item.isDefault;
            });
        } else {
            state.sizes = [];
        }

        var savedIcons = localStorage.getItem("sc_custom_icons_v1");
        if (savedIcons) {
            state.icons = JSON.parse(savedIcons);
        } else {
            state.icons = [];
        }

        state.iconsFolder = localStorage.getItem("sc_icons_folder") || "";

        var savedSettings = localStorage.getItem("sc_settings");
        if (savedSettings) {
            state.settings = Object.assign(state.settings, JSON.parse(savedSettings));
        }
        
        saveState(); // Guardar el estado limpio
    } catch (e) {
        state.sizes = [];
        state.icons = [];
    }
}

function saveState() {
    try {
        localStorage.setItem("sc_custom_sizes_v2", JSON.stringify(state.sizes));
        localStorage.setItem("sc_custom_icons_v1", JSON.stringify(state.icons));
        localStorage.setItem("sc_icons_folder", state.iconsFolder || "");
        localStorage.setItem("sc_settings", JSON.stringify(state.settings));
    } catch (e) {
        console.error("Error al guardar estado:", e);
    }
}

// Eventos de Drag and Drop
function handleDragStart(e) {
    draggedIndex = parseInt(this.dataset.index, 10);
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedIndex);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = "move";
    var targetIndex = parseInt(this.dataset.index, 10);
    if (targetIndex !== draggedIndex) {
        this.classList.add("drag-over");
    }
    return false;
}

function handleDragLeave(e) {
    this.classList.remove("drag-over");
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    this.classList.remove("drag-over");
    var targetIndex = parseInt(this.dataset.index, 10);
    if (draggedIndex !== null && targetIndex !== draggedIndex && !isNaN(targetIndex) && !isNaN(draggedIndex)) {
        var itemToMove = state.sizes.splice(draggedIndex, 1)[0];
        state.sizes.splice(targetIndex, 0, itemToMove);
        saveState();
        renderSizesGrid();
        log("Posición actualizada: " + itemToMove.name, "info");
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove("dragging");
    var items = document.querySelectorAll(".size-btn");
    items.forEach(function(item) {
        item.classList.remove("drag-over");
        item.classList.remove("dragging");
    });
    draggedIndex = null;
}

// Renderizar Botones de Medidas
function renderSizesGrid() {
    var container = document.getElementById("sizes-container");
    if (!container) return;
    container.innerHTML = "";

    if (state.sizes.length === 0) {
        container.innerHTML = "<div style='color: var(--text-dim); text-align:center; padding: 18px 8px; grid-column: span 2;'>No tienes botones de medidas creados.<br><br>Haz clic en <strong>+ Crear Botón</strong> arriba para agregar las medidas que necesites.</div>";
        return;
    }

    state.sizes.forEach(function(item, index) {
        var btn = document.createElement("div");
        btn.className = "size-btn";
        btn.dataset.id = item.id;
        btn.dataset.index = index;
        btn.setAttribute("draggable", "true");
        btn.title = "Arrastra para reordenar o haz clic para crear plantilla";
        
        // Listeners para Drag and Drop
        btn.addEventListener("dragstart", handleDragStart, false);
        btn.addEventListener("dragover", handleDragOver, false);
        btn.addEventListener("dragleave", handleDragLeave, false);
        btn.addEventListener("drop", handleDrop, false);
        btn.addEventListener("dragend", handleDragEnd, false);

        var nameSpan = document.createElement("span");
        nameSpan.className = "size-name";
        var shapeIcon = item.shape === "circle" ? "⚪ " : "◽ ";
        nameSpan.textContent = shapeIcon + item.name;
        
        var dimsSpan = document.createElement("span");
        dimsSpan.className = "size-dims";
        var innerW = Math.round((item.width - 1.0) * 10) / 10;
        var innerH = Math.round((item.height - 1.0) * 10) / 10;
        dimsSpan.textContent = item.width + "x" + item.height + " mm (Útil: " + innerW + "x" + innerH + ")";
        
        btn.appendChild(nameSpan);
        btn.appendChild(dimsSpan);

        // Botón de eliminar
        var delBtn = document.createElement("button");
        delBtn.className = "size-delete-btn";
        delBtn.innerHTML = "&times;";
        delBtn.title = "Eliminar botón " + item.name;
        delBtn.onclick = function(e) {
            e.stopPropagation();
            deleteSize(item.id, item.name);
        };
        btn.appendChild(delBtn);

        btn.onclick = function(e) {
            // Si estábamos arrastrando no disparar click
            if (draggedIndex !== null) return;
            applySizeTemplate(item.width, item.height, item.shape, item.name);
        };

        container.appendChild(btn);
    });
}

// Ejecutar creación de plantilla de medida
function applySizeTemplate(width, height, shape, name) {
    log("Generando recuadro para " + name + " (" + width + "x" + height + " mm)...", "info");
    
    var escapedName = (name || "").replace(/"/g, '\\"');
    var shapeVal = shape || "rectangle";
    var script = 'createStampTemplate(' + width + ', ' + height + ', "' + shapeVal + '", "' + escapedName + '");';
    
    evalHostScript(script, function(result) {
        try {
            var res = JSON.parse(result);
            if (res.success) {
                log(res.message, "success");
            } else {
                log(res.message, "error");
            }
        } catch (e) {
            log(result || "Plantilla creada.", "info");
        }
    });
}

// Eliminar medida
function deleteSize(id, name) {
    state.sizes = state.sizes.filter(function(s) { return s.id !== id; });
    saveState();
    renderSizesGrid();
    log("Botón '" + (name || id) + "' eliminado.", "info");
}

// Obtener URL o data de vista previa del icono
function getIconPreviewSrc(icon) {
    if (!icon || !icon.path) return null;
    var ext = (icon.ext || "").toLowerCase();
    
    // Si es SVG, intentar leer inline para renderizado directo nítido
    if (ext === "svg" && typeof require !== "undefined") {
        try {
            var fs = require("fs");
            if (fs.existsSync(icon.path)) {
                var svgData = fs.readFileSync(icon.path, "utf8");
                return "data:image/svg+xml;utf8," + encodeURIComponent(svgData);
            }
        } catch (e) {}
    }
    
    // Si es imagen o SVG normal
    if (ext === "svg" || ext === "png" || ext === "jpg" || ext === "jpeg") {
        var cleanPath = icon.path.replace(/\\/g, "/");
        return "file:///" + cleanPath;
    }
    
    return null;
}

// Renderizar Barra de Categorías
function renderCategoriesBar() {
    var bar = document.getElementById("categories-bar");
    if (!bar) return;
    bar.innerHTML = "";

    var catMap = {};
    state.icons.forEach(function(ico) {
        var c = ico.category || "General";
        catMap[c] = (catMap[c] || 0) + 1;
    });

    var totalCount = state.icons.length;
    var totalCountEl = document.getElementById("total-icons-count");
    if (totalCountEl) totalCountEl.textContent = totalCount;

    // Botón "Todos"
    var allBtn = document.createElement("button");
    allBtn.className = "cat-pill" + (state.selectedCategory === "all" ? " active" : "");
    allBtn.textContent = "Todos (" + totalCount + ")";
    allBtn.onclick = function() {
        state.selectedCategory = "all";
        renderCategoriesBar();
        renderIconsGrid();
    };
    bar.appendChild(allBtn);

    // Botones de cada categoría
    Object.keys(catMap).sort().forEach(function(catName) {
        var pill = document.createElement("button");
        pill.className = "cat-pill" + (state.selectedCategory === catName ? " active" : "");
        pill.textContent = catName + " (" + catMap[catName] + ")";
        pill.onclick = function() {
            state.selectedCategory = catName;
            renderCategoriesBar();
            renderIconsGrid();
        };
        bar.appendChild(pill);
    });
}

// Renderizar Cuadrícula de Iconos
function renderIconsGrid() {
    var grid = document.getElementById("icons-grid");
    var emptyState = document.getElementById("icons-empty-state");
    var countLabel = document.getElementById("icons-count-label");
    var folderLabel = document.getElementById("icons-folder-label");
    if (!grid) return;

    grid.innerHTML = "";

    if (folderLabel) {
        if (state.iconsFolder) {
            var fName = state.iconsFolder.split(/[\\/]/).pop() || state.iconsFolder;
            folderLabel.textContent = "📁 " + fName;
            folderLabel.title = state.iconsFolder;
        } else {
            folderLabel.textContent = "";
            folderLabel.title = "";
        }
    }

    // Filtrar por categoría y por búsqueda
    var query = (state.searchQuery || "").toLowerCase().trim();
    var filtered = state.icons.filter(function(ico) {
        var matchCat = (state.selectedCategory === "all") || (ico.category === state.selectedCategory);
        var matchQuery = !query || 
            (ico.name && ico.name.toLowerCase().indexOf(query) !== -1) ||
            (ico.category && ico.category.toLowerCase().indexOf(query) !== -1);
        return matchCat && matchQuery;
    });

    if (countLabel) {
        countLabel.textContent = filtered.length + " de " + state.icons.length + " iconos";
    }

    if (filtered.length === 0) {
        grid.style.display = "none";
        if (emptyState) {
            emptyState.style.display = "block";
            var emptyText = document.getElementById("empty-state-text");
            if (emptyText) {
                if (state.icons.length === 0) {
                    emptyText.textContent = "Aún no tienes iconos guardados. Selecciona un vector en Illustrator y haz clic en '+ Guardar Selección' o vincula una carpeta.";
                } else {
                    emptyText.textContent = "No se encontraron iconos que coincidan con '" + query + "'.";
                }
            }
        }
        return;
    }

    if (emptyState) emptyState.style.display = "none";
    grid.style.display = "grid";

    filtered.forEach(function(ico) {
        var card = document.createElement("div");
        card.className = "icon-card";
        card.title = ico.name + " (" + (ico.category || "General") + ") - Clic para insertar";

        // Miniatura
        var thumb = document.createElement("div");
        thumb.className = "icon-thumb";

        var previewSrc = getIconPreviewSrc(ico);
        if (previewSrc) {
            var img = document.createElement("img");
            img.src = previewSrc;
            img.alt = ico.name;
            thumb.appendChild(img);
        } else {
            var badge = document.createElement("span");
            badge.className = "vector-ai-icon";
            badge.textContent = (ico.ext === "ai" || ico.ext === "eps") ? "📐" : "🎨";
            thumb.appendChild(badge);
        }

        // Nombre
        var nameSpan = document.createElement("span");
        nameSpan.className = "icon-name";
        nameSpan.textContent = ico.name;

        // Categoría tag
        var catSpan = document.createElement("span");
        catSpan.className = "icon-cat-tag";
        catSpan.textContent = ico.category || "General";

        // Botón eliminar
        var delBtn = document.createElement("button");
        delBtn.className = "icon-del-btn";
        delBtn.innerHTML = "&times;";
        delBtn.title = "Quitar de la biblioteca";
        delBtn.onclick = function(e) {
            e.stopPropagation();
            deleteIcon(ico.id);
        };

        // Inserción al hacer clic en la tarjeta
        card.onclick = function() {
            insertIcon(ico.path, ico.name);
        };

        card.appendChild(thumb);
        card.appendChild(nameSpan);
        card.appendChild(catSpan);
        card.appendChild(delBtn);
        grid.appendChild(card);
    });
}

// Insertar Icono en Illustrator
function insertIcon(filePath, iconName) {
    if (!filePath) {
        log("Ruta de icono no válida.", "error");
        return;
    }
    log("Insertando icono '" + (iconName || "vector") + "'...", "info");
    var escaped = filePath.replace(/\\/g, "/");
    var script = 'insertIconToDocument("' + escaped + '");';
    evalHostScript(script, function(result) {
        try {
            var res = JSON.parse(result);
            if (res.success) {
                log(res.message, "success");
            } else {
                log(res.message, "error");
            }
        } catch (e) {
            log(result || "Icono insertado", "info");
        }
    });
}

// Eliminar Icono de la biblioteca
function deleteIcon(iconId) {
    state.icons = state.icons.filter(function(i) { return i.id !== iconId; });
    saveState();
    renderCategoriesBar();
    renderIconsGrid();
    log("Icono eliminado de la biblioteca.", "info");
}

// Abrir Selector de Carpeta de Iconos
function handleBrowseIconsFolder() {
    log("Abriendo selector de carpeta de iconos...", "info");
    evalHostScript("browseIconsFolder();", function(result) {
        try {
            var res = JSON.parse(result);
            if (res.success && res.folderPath) {
                state.iconsFolder = res.folderPath;
                saveState();
                scanAndLoadIconsFolder(res.folderPath);
            }
        } catch (e) {
            console.error(e);
        }
    });
}

// Escanear carpeta de iconos
function scanAndLoadIconsFolder(folderPath) {
    log("Escaneando iconos en carpeta...", "info");
    var escaped = folderPath.replace(/\\/g, "/");
    var script = 'scanFolderIcons("' + escaped + '");';
    evalHostScript(script, function(result) {
        try {
            var res = JSON.parse(result);
            if (res.success && res.icons) {
                var existingPaths = {};
                state.icons.forEach(function(i) { existingPaths[i.path] = true; });

                var addedCount = 0;
                res.icons.forEach(function(newIco) {
                    if (!existingPaths[newIco.path]) {
                        state.icons.push(newIco);
                        existingPaths[newIco.path] = true;
                        addedCount++;
                    }
                });

                saveState();
                renderCategoriesBar();
                renderIconsGrid();
                log("Escaneo listo: " + res.total + " iconos encontrados (" + addedCount + " nuevos añadidos).", "success");
            } else {
                log(res.message || "No se encontraron iconos.", "error");
            }
        } catch (e) {
            log("Error al procesar el escaneo.", "error");
        }
    });
}

// Sincronizar con el tema de color nativo de Adobe Illustrator
function syncWithHostTheme() {
    try {
        var hostEnv = csInterface.getHostEnvironment();
        if (hostEnv && hostEnv.appSkinInfo) {
            var skin = hostEnv.appSkinInfo;
            var panelBg = skin.panelBackgroundColor.color;
            if (panelBg) {
                var r = Math.round(panelBg.red);
                var g = Math.round(panelBg.green);
                var b = Math.round(panelBg.blue);
                
                // Calcular luminancia: > 128 es tema claro, <= 128 es tema oscuro
                var luminance = (r * 0.299 + g * 0.587 + b * 0.114);
                var isLight = luminance > 128;
                
                var root = document.documentElement;
                root.classList.remove("theme-light", "theme-dark");
                root.classList.add(isLight ? "theme-light" : "theme-dark");

                if (isLight) {
                    root.style.setProperty('--bg-main', 'rgb(' + r + ',' + g + ',' + b + ')');
                    root.style.setProperty('--bg-card', '#f2f2f2');
                    root.style.setProperty('--bg-btn', '#ffffff');
                    root.style.setProperty('--bg-btn-hover', '#e2e2e2');
                    root.style.setProperty('--bg-input', '#ffffff');
                    root.style.setProperty('--border-color', '#c8c8c8');
                    root.style.setProperty('--border-hover', '#1473e6');
                    root.style.setProperty('--text-main', '#111111');
                    root.style.setProperty('--text-muted', '#333333');
                    root.style.setProperty('--text-dim', '#555555');
                } else {
                    root.style.setProperty('--bg-main', 'rgb(' + r + ',' + g + ',' + b + ')');
                    root.style.setProperty('--bg-card', '#282828');
                    root.style.setProperty('--bg-btn', '#383838');
                    root.style.setProperty('--bg-btn-hover', '#444444');
                    root.style.setProperty('--bg-input', '#202020');
                    root.style.setProperty('--border-color', '#444444');
                    root.style.setProperty('--border-hover', '#5a5a5a');
                    root.style.setProperty('--text-main', '#f0f0f0');
                    root.style.setProperty('--text-muted', '#b0b0b0');
                    root.style.setProperty('--text-dim', '#888888');
                }
            }
        }
    } catch(e) {}
}

// Inicialización de Eventos UI
document.addEventListener("DOMContentLoaded", function() {
    syncWithHostTheme();
    csInterface.addEventListener("com.adobe.csxs.events.ThemeColorChanged", syncWithHostTheme);
    loadState();
    renderSizesGrid();
    renderCategoriesBar();
    renderIconsGrid();

    // Sincronizar campos de configuración
    document.getElementById("laser-margin").value = state.settings.laserMargin;
    document.getElementById("laser-dpi").value = state.settings.laserDpi;
    document.getElementById("photo-margin").value = state.settings.photoMargin;

    // Pestañas
    var tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            tabBtns.forEach(function(b) { b.classList.remove("active"); });
            document.querySelectorAll(".tab-panel").forEach(function(p) { p.classList.remove("active"); });
            
            btn.classList.add("active");
            var tabId = btn.dataset.tab;
            var panel = document.getElementById("tab-" + tabId);
            if (panel) panel.classList.add("active");
        });
    });

    // Guardar cambios en inputs
    document.getElementById("laser-margin").addEventListener("change", function(e) {
        state.settings.laserMargin = Number(e.target.value);
        saveState();
    });
    document.getElementById("laser-dpi").addEventListener("change", function(e) {
        state.settings.laserDpi = Number(e.target.value);
        saveState();
    });
    document.getElementById("photo-margin").addEventListener("change", function(e) {
        state.settings.photoMargin = Number(e.target.value);
        saveState();
    });

    // Modal Crear Medida
    var modal = document.getElementById("add-size-modal");
    var openModalBtn = document.getElementById("btn-open-add-size");
    var closeModalBtn = document.getElementById("btn-close-modal");
    var formAddSize = document.getElementById("form-add-size");

    openModalBtn.addEventListener("click", function() {
        modal.classList.add("show");
        document.getElementById("new-size-name").focus();
    });

    closeModalBtn.addEventListener("click", function() {
        modal.classList.remove("show");
    });

    formAddSize.addEventListener("submit", function(e) {
        e.preventDefault();
        var name = document.getElementById("new-size-name").value.trim();
        var width = parseFloat(document.getElementById("new-size-width").value);
        var height = parseFloat(document.getElementById("new-size-height").value);
        var shape = document.getElementById("new-size-shape").value;

        if (!name || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert("Por favor ingresa datos válidos.");
            return;
        }

        var newSize = {
            id: "custom_" + Date.now(),
            name: name,
            width: width,
            height: height,
            shape: shape,
            isDefault: false
        };

        state.sizes.push(newSize);
        saveState();
        renderSizesGrid();
        
        modal.classList.remove("show");
        formAddSize.reset();
        log("Nuevo botón creado: " + name + " (" + width + "x" + height + " mm)", "success");
    });

    // Acciones de Iconos: Buscador en tiempo real
    var searchInput = document.getElementById("icon-search-input");
    var clearSearchBtn = document.getElementById("btn-clear-search");

    if (searchInput) {
        searchInput.addEventListener("input", function() {
            state.searchQuery = this.value;
            if (clearSearchBtn) {
                clearSearchBtn.style.display = this.value.trim().length > 0 ? "block" : "none";
            }
            renderIconsGrid();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", function() {
            if (searchInput) searchInput.value = "";
            state.searchQuery = "";
            clearSearchBtn.style.display = "none";
            renderIconsGrid();
            if (searchInput) searchInput.focus();
        });
    }

    // Botones de Carpeta y Refrescar
    var btnBrowseIcons = document.getElementById("btn-browse-icons-folder");
    if (btnBrowseIcons) {
        btnBrowseIcons.addEventListener("click", handleBrowseIconsFolder);
    }

    var btnRefreshIcons = document.getElementById("btn-refresh-icons");
    if (btnRefreshIcons) {
        btnRefreshIcons.addEventListener("click", function() {
            if (state.iconsFolder) {
                scanAndLoadIconsFolder(state.iconsFolder);
            } else {
                evalHostScript("getDefaultIconsDirectory();", function(resStr) {
                    try {
                        var res = JSON.parse(resStr);
                        if (res.success && res.folderPath) {
                            scanAndLoadIconsFolder(res.folderPath);
                        }
                    } catch(e) {}
                });
            }
        });
    }

    // Modal: Guardar Selección como Icono
    var iconModal = document.getElementById("save-icon-modal");
    var btnSaveSelected = document.getElementById("btn-save-selected-icon");
    var btnEmptyAdd = document.getElementById("btn-empty-add-icon");
    var btnCloseIconModal = document.getElementById("btn-close-icon-modal");
    var formSaveIcon = document.getElementById("form-save-icon");
    var selectCat = document.getElementById("new-icon-category");
    var customCatInput = document.getElementById("custom-icon-category");

    function openSaveModal() {
        if (iconModal) iconModal.classList.add("show");
        var nameInput = document.getElementById("new-icon-name");
        if (nameInput) {
            nameInput.value = "";
            nameInput.focus();
        }
        if (customCatInput) customCatInput.style.display = "none";
        if (selectCat) selectCat.value = "Médicos y Salud";
    }

    if (btnSaveSelected) btnSaveSelected.addEventListener("click", openSaveModal);
    if (btnEmptyAdd) btnEmptyAdd.addEventListener("click", openSaveModal);
    if (btnCloseIconModal) {
        btnCloseIconModal.addEventListener("click", function() {
            if (iconModal) iconModal.classList.remove("show");
        });
    }

    if (selectCat && customCatInput) {
        selectCat.addEventListener("change", function() {
            if (this.value === "__custom__") {
                customCatInput.style.display = "block";
                customCatInput.focus();
            } else {
                customCatInput.style.display = "none";
            }
        });
    }

    if (formSaveIcon) {
        formSaveIcon.addEventListener("submit", function(e) {
            e.preventDefault();
            var iconName = document.getElementById("new-icon-name").value.trim();
            if (!iconName) return;

            var cat = selectCat ? selectCat.value : "General";
            if (cat === "__custom__" && customCatInput) {
                cat = customCatInput.value.trim() || "General";
            }

            var customFolder = (state.iconsFolder || "").replace(/\\/g, "/");
            var script = 'exportSelectedVectorAsIcon(' + JSON.stringify(iconName) + ', ' + JSON.stringify(cat) + ', ' + JSON.stringify(customFolder) + ');';

            log("Guardando vector como icono '" + iconName + "'...", "info");

            evalHostScript(script, function(result) {
                if (!result || result === "EvalScript error." || result.indexOf("EvalScript error") !== -1) {
                    log("Error de comunicación con Illustrator: " + (result || "Sin respuesta"), "error");
                    return;
                }
                var res;
                try {
                    res = JSON.parse(result);
                } catch(err) {
                    log("Respuesta inesperada: " + result, "error");
                    return;
                }
                if (res.success && res.icon) {
                    state.icons.unshift(res.icon);
                    saveState();
                    renderCategoriesBar();
                    renderIconsGrid();
                    if (iconModal) iconModal.classList.remove("show");
                    formSaveIcon.reset();
                    log(res.message, "success");
                } else {
                    log(res.message || "Error al guardar icono", "error");
                }
            });
        });
    }

    // Acción: LÁSER
    document.getElementById("btn-process-laser").addEventListener("click", function() {
        var rawMargin = document.getElementById("laser-margin").value;
        var margin = parseFloat(String(rawMargin).replace(",", "."));
        if (isNaN(margin)) margin = 0.0;

        var rawDpi = document.getElementById("laser-dpi").value;
        var dpi = parseInt(String(rawDpi).replace(",", "."), 10);
        if (isNaN(dpi) || dpi <= 0) dpi = 2400;

        log("Procesando para LÁSER (Negativo, " + margin + "mm margen, MODO ESPEJO, " + dpi + " PPP)...", "info");

        var script = "processLaser(" + margin + ", " + dpi + ");";
        evalHostScript(script, function(result) {
            try {
                var res = JSON.parse(result);
                if (res.success) {
                    if (res.filePath && typeof require !== "undefined") {
                        try {
                            var fs = require("fs");
                            var buf = fs.readFileSync(res.filePath);
                            if (buf.length >= 33) {
                                var ppm = Math.round(Number(dpi) / 0.0254);
                                var physData = Buffer.alloc(9);
                                physData.writeUInt32BE(ppm, 0);
                                physData.writeUInt32BE(ppm, 4);
                                physData.writeUInt8(1, 8);
                                
                                var crcTable = [];
                                for (var n = 0; n < 256; n++) {
                                    var c = n;
                                    for (var k = 0; k < 8; k++) {
                                        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
                                    }
                                    crcTable[n] = c >>> 0;
                                }
                                var crc = 0 ^ (-1);
                                var typeAndData = Buffer.concat([Buffer.from("pHYs"), physData]);
                                for (var i = 0; i < typeAndData.length; i++) {
                                    crc = (crc >>> 8) ^ crcTable[(crc ^ typeAndData[i]) & 0xFF];
                                }
                                crc = (crc ^ (-1)) >>> 0;
                                
                                var physChunk = Buffer.alloc(12 + 9);
                                physChunk.writeUInt32BE(9, 0);
                                typeAndData.copy(physChunk, 4);
                                physChunk.writeUInt32BE(crc, 4 + 13);
                                
                                var offset = 8;
                                var chunks = [];
                                while (offset < buf.length) {
                                    var len = buf.readUInt32BE(offset);
                                    var type = buf.toString("ascii", offset + 4, offset + 8);
                                    chunks.push({ type: type, offset: offset, length: len });
                                    offset += 12 + len;
                                    if (type === "IEND") break;
                                }
                                var parts = [buf.slice(0, 33), physChunk];
                                for (var idx = 1; idx < chunks.length; idx++) {
                                    if (chunks[idx].type !== "pHYs") {
                                        parts.push(buf.slice(chunks[idx].offset, chunks[idx].offset + 12 + chunks[idx].length));
                                    }
                                }
                                fs.writeFileSync(res.filePath, Buffer.concat(parts));
                            }
                        } catch(errNode) {
                            console.error("Error asegurando DPI con Node:", errNode);
                        }
                    }
                    log(res.message, "success");
                } else {
                    log(res.message, "error");
                }
            } catch (e) {
                log(result || "Procesamiento completado", "info");
            }
        });
    });

    // Acción: FOTOPOLÍMERO
    document.getElementById("btn-process-photo").addEventListener("click", function() {
        var rawMargin = document.getElementById("photo-margin").value;
        var margin = parseFloat(String(rawMargin).replace(",", "."));
        if (isNaN(margin)) margin = 7.5;

        log("Procesando para FOTOPOLÍMERO (Negativo, " + margin + "mm margen, centrado arriba)...", "info");

        var script = "processPhotopolymer(" + margin + ");";
        evalHostScript(script, function(result) {
            try {
                var res = JSON.parse(result);
                if (res.success) {
                    log(res.message, "success");
                } else {
                    log(res.message, "error");
                }
            } catch (e) {
                log(result || "Procesamiento completado", "info");
            }
        });
    });

    // Precargar archivo JSX al iniciar
    ensureHostScriptLoaded(function() {
        log("Plugin Sellos Chacaíto listo (Motor conectado).", "success");
    });
});
