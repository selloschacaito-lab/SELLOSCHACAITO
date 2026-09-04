/**
 * Sellos Chacaito - Host ExtendScript
 * Compatible con Adobe Illustrator CS6 - CC 2026+
 */

// JSON Polyfill para ExtendScript (ES3)
if (typeof JSON !== "object") {
    JSON = {};
}
(function () {
    'use strict';
    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var meta = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"': '\\"',
        '\\': '\\\\'
    };
    function quote(string) {
        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string) ? '"' + string.replace(rx_escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }
    function str(key, holder) {
        var value = holder[key];
        switch (typeof value) {
        case 'string': return quote(value);
        case 'number': return isFinite(value) ? String(value) : 'null';
        case 'boolean':
        case 'null': return String(value);
        case 'object':
            if (!value) return 'null';
            var partial = [];
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                var length = value.length;
                for (var i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                return '[' + partial.join(',') + ']';
            }
            for (var k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    var v = str(k, value);
                    if (v) partial.push(quote(k) + ':' + v);
                }
            }
            return '{' + partial.join(',') + '}';
        }
    }
    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value) {
            return str('', {'': value});
        };
    }
    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text) {
            var j;
            text = String(text);
            rx_one.lastIndex = 0;
            if (rx_one.test(text.replace(rx_two, '@').replace(rx_three, ']').replace(rx_four, ''))) {
                j = eval('(' + text + ')');
                return j;
            }
            throw new SyntaxError('JSON.parse error');
        };
    }
}());

// Utilidad para convertir unidades
function mmToPt(mm) {
    return mm * 72.0 / 25.4;
}

function ptToMm(pt) {
    return pt * 25.4 / 72.0;
}

function makeRGB(r, g, b) {
    var c = new RGBColor();
    c.red = r;
    c.green = g;
    c.blue = b;
    return c;
}

var WHITE = makeRGB(255, 255, 255);
var BLACK = makeRGB(0, 0, 0);

function getGray40Color(doc) {
    try {
        if (doc.documentColorSpace === DocumentColorSpace.CMYK) {
            var cmyk = new CMYKColor();
            cmyk.cyan = 0;
            cmyk.magenta = 0;
            cmyk.yellow = 0;
            cmyk.black = 40; // 40% K
            return cmyk;
        } else {
            var rgbVal = Math.round(255 * (1 - 0.40)); // 153
            return makeRGB(rgbVal, rgbVal, rgbVal);
        }
    } catch (e) {
        return makeRGB(153, 153, 153);
    }
}

// Inyector de resolución DPI (pHYs chunk) en archivos PNG
function setPngDpi(fileObj, dpi) {
    try {
        if (!fileObj.exists) return false;

        fileObj.encoding = "BINARY";
        if (!fileObj.open("r")) return false;
        var content = fileObj.read();
        fileObj.close();

        if (content.length < 33) return false;
        if (content.charCodeAt(0) !== 0x89 || content.charCodeAt(1) !== 0x50 ||
            content.charCodeAt(2) !== 0x4E || content.charCodeAt(3) !== 0x47) {
            return false;
        }

        // Tabla CRC32
        var crcTable = [];
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c >>> 0;
        }

        function getCrc32(bytesArr) {
            var crc = 0 ^ (-1);
            for (var i = 0; i < bytesArr.length; i++) {
                crc = (crc >>> 8) ^ crcTable[(crc ^ bytesArr[i]) & 0xFF];
            }
            return (crc ^ (-1)) >>> 0;
        }

        // 1 pulgada = 0.0254 metros -> ppm = Math.round(dpi / 0.0254)
        var ppm = Math.round(Number(dpi) / 0.0254);
        var ppmB0 = (ppm >>> 24) & 0xFF;
        var ppmB1 = (ppm >>> 16) & 0xFF;
        var ppmB2 = (ppm >>> 8) & 0xFF;
        var ppmB3 = ppm & 0xFF;

        var physTypeAndData = [
            0x70, 0x48, 0x59, 0x73, // 'p', 'H', 'Y', 's'
            ppmB0, ppmB1, ppmB2, ppmB3, // X
            ppmB0, ppmB1, ppmB2, ppmB3, // Y
            0x01                         // Metros
        ];

        var crcVal = getCrc32(physTypeAndData);
        var crcB0 = (crcVal >>> 24) & 0xFF;
        var crcB1 = (crcVal >>> 16) & 0xFF;
        var crcB2 = (crcVal >>> 8) & 0xFF;
        var crcB3 = crcVal & 0xFF;

        var physChunkStr = String.fromCharCode(
            0x00, 0x00, 0x00, 0x09, // Length 9
            0x70, 0x48, 0x59, 0x73,
            ppmB0, ppmB1, ppmB2, ppmB3,
            ppmB0, ppmB1, ppmB2, ppmB3,
            0x01,
            crcB0, crcB1, crcB2, crcB3
        );

        // Analizar chunks PNG existentes
        var offset = 8;
        var chunks = [];
        while (offset < content.length) {
            if (offset + 8 > content.length) break;
            var len = (content.charCodeAt(offset) << 24) |
                      (content.charCodeAt(offset + 1) << 16) |
                      (content.charCodeAt(offset + 2) << 8) |
                      content.charCodeAt(offset + 3);
            len = len >>> 0;
            var type = String.fromCharCode(
                content.charCodeAt(offset + 4),
                content.charCodeAt(offset + 5),
                content.charCodeAt(offset + 6),
                content.charCodeAt(offset + 7)
            );
            chunks.push({
                type: type,
                offset: offset,
                totalLen: 12 + len
            });
            offset += 12 + len;
            if (type === "IEND") break;
        }

        // Construir archivo con el nuevo chunk pHYs
        var newParts = [content.substring(0, 33), physChunkStr];
        for (var idx = 1; idx < chunks.length; idx++) {
            var ch = chunks[idx];
            if (ch.type !== "pHYs") {
                newParts.push(content.substring(ch.offset, ch.offset + ch.totalLen));
            }
        }
        var finalContent = newParts.join("");

        fileObj.encoding = "BINARY";
        if (!fileObj.open("w")) return false;
        fileObj.write(finalContent);
        fileObj.close();
        return true;
    } catch (err) {
        return false;
    }
}

// Convierte textos a contornos recursivamente
function outlineTextInItem(item) {
    try {
        if (item.typename === "TextFrame") {
            if (!item.locked && !item.hidden) {
                return item.createOutline();
            }
        }
        if (item.typename === "GroupItem") {
            for (var j = item.pageItems.length - 1; j >= 0; j--) {
                outlineTextInItem(item.pageItems[j]);
            }
        }
    } catch (e) {}
    return item;
}

// Convierte todos los elementos vectoriales al color indicado
function recolorItem(item, targetColor) {
    try {
        // Ignorar guías o elementos de plantilla ya procesados
        if (item.name && (item.name.indexOf("Exterior") === 0 || item.name.indexOf("Interior") === 0 || item.name.indexOf("Fondo negro") === 0)) {
            return;
        }

        if (item.typename === "PathItem") {
            if (item.filled) {
                item.fillColor = targetColor;
            }
            if (item.stroked) {
                item.strokeColor = targetColor;
            }
        } else if (item.typename === "CompoundPathItem") {
            for (var i = 0; i < item.pathItems.length; i++) {
                if (item.pathItems[i].filled) {
                    item.pathItems[i].fillColor = targetColor;
                }
                if (item.pathItems[i].stroked) {
                    item.pathItems[i].strokeColor = targetColor;
                }
            }
        } else if (item.typename === "GroupItem") {
            for (var j = 0; j < item.pageItems.length; j++) {
                recolorItem(item.pageItems[j], targetColor);
            }
        } else if (item.typename === "TextFrame") {
            item.textRange.characterAttributes.fillColor = targetColor;
            item.textRange.characterAttributes.strokeColor = targetColor;
        }
    } catch (e) {}
}

/**
 * Crea la plantilla de sello:
 * 1. Rectángulo/Círculo exterior nominal: sin relleno, trazo 0.25pt gris al 40%
 * 2. Rectángulo/Círculo interior (1mm menos en cada dimensión): sin relleno, sin trazo
 * 3. Ambos agrupados y centrados
 */
function createStampTemplate(widthMm, heightMm, shapeType, name) {
    try {
        if (app.documents.length === 0) {
            app.documents.add(DocumentColorSpace.CMYK, 300, 300);
        }
        var doc = app.activeDocument;

        var w = Number(widthMm);
        var h = Number(heightMm);
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
            return JSON.stringify({ success: false, message: "Medidas no válidas." });
        }

        var outerW = mmToPt(w);
        var outerH = mmToPt(h);
        var innerW = mmToPt(Math.max(0.5, w - 1.0));
        var innerH = mmToPt(Math.max(0.5, h - 1.0));

        var abIndex = doc.artboards.getActiveArtboardIndex();
        var abRect = doc.artboards[abIndex].artboardRect;
        var centerX = (abRect[0] + abRect[2]) / 2.0;
        var centerY = (abRect[1] + abRect[3]) / 2.0;

        var stampGroup = doc.groupItems.add();
        var label = name ? name : (w + "x" + h + " mm");
        stampGroup.name = "Plantilla " + label;

        var isCircle = (shapeType === "circle" || (name && (name.indexOf("R-") >= 0 || name.toLowerCase().indexOf("redondo") >= 0 || name.toLowerCase().indexOf("circulo") >= 0)));

        var outerShape, innerShape;

        if (isCircle) {
            outerShape = stampGroup.pathItems.ellipse(
                centerY + outerH / 2.0,
                centerX - outerW / 2.0,
                outerW,
                outerH
            );
            innerShape = stampGroup.pathItems.ellipse(
                centerY + innerH / 2.0,
                centerX - innerW / 2.0,
                innerW,
                innerH
            );
        } else {
            outerShape = stampGroup.pathItems.rectangle(
                centerY + outerH / 2.0,
                centerX - outerW / 2.0,
                outerW,
                outerH
            );
            innerShape = stampGroup.pathItems.rectangle(
                centerY + innerH / 2.0,
                centerX - innerW / 2.0,
                innerW,
                innerH
            );
        }

        // Configuración Exterior: Sin color, trazo 0.25 pt, Gris 40%
        outerShape.name = "Exterior (" + w + "x" + h + " mm)";
        outerShape.filled = false;
        outerShape.stroked = true;
        outerShape.strokeWidth = 0.25;
        outerShape.strokeColor = getGray40Color(doc);

        // Configuración Interior: 1mm menos, sin color, sin bordes
        var innerWMm = (Math.round((w - 1.0) * 10) / 10);
        var innerHMm = (Math.round((h - 1.0) * 10) / 10);
        innerShape.name = "Interior (" + innerWMm + "x" + innerHMm + " mm)";
        innerShape.filled = false;
        innerShape.stroked = false;

        doc.selection = null;
        stampGroup.selected = true;
        app.redraw();

        return JSON.stringify({
            success: true,
            message: "Plantilla creada: " + label + " (Exterior " + w + "x" + h + "mm 0.25pt gris 40%, Interior " + innerWMm + "x" + innerHMm + "mm sin borde)"
        });
    } catch (err) {
        return JSON.stringify({ success: false, message: "Error al crear plantilla: " + err.toString() });
    }
}

/**
 * Procesa la selección para LÁSER:
 * - Convierte a Blanco
 * - Fondo Negro con el TAMAÑO EXACTO del diseño (o margen configurado)
 * - MODO ESPEJO: Reflejo horizontal en el documento y en la exportación
 * - Exporta PNG transparente a 2400 PPP en Desktop/LASER con resolución real incrustada
 */
function processLaser(marginMm, dpiVal) {
    try {
        if (app.documents.length === 0) {
            return JSON.stringify({ success: false, message: "Abre un documento antes de ejecutar." });
        }
        var doc = app.activeDocument;
        if (doc.selection.length === 0) {
            return JSON.stringify({ success: false, message: "Selecciona primero el diseño a procesar para Láser." });
        }

        // Margen: si es 0 o no se especifica, usa exactamente el tamaño del diseño
        var margin = (marginMm !== undefined && marginMm !== null && marginMm !== "" && !isNaN(Number(marginMm))) ? Number(marginMm) : 0.0;
        var marginPt = mmToPt(margin);
        var dpi = (dpiVal && !isNaN(Number(dpiVal))) ? Number(dpiVal) : 2400;

        // Crear carpeta en Escritorio/LASER
        var desktopFolder = Folder.desktop;
        var laserFolder = new Folder(desktopFolder.fsName + "/LASER");
        if (!laserFolder.exists) {
            laserFolder.create();
        }

        var originalSelection = [];
        for (var i = 0; i < doc.selection.length; i++) {
            originalSelection.push(doc.selection[i]);
        }

        // Convertir textos a contornos
        for (var a = originalSelection.length - 1; a >= 0; a--) {
            outlineTextInItem(originalSelection[a]);
        }

        var designItems = [];
        for (var b = 0; b < doc.selection.length; b++) {
            designItems.push(doc.selection[b]);
        }

        if (designItems.length === 0) {
            return JSON.stringify({ success: false, message: "No fue posible procesar la selección." });
        }

        // Detectar si hay elementos de plantilla en la selección (para no dibujar borde blanco)
        var templateOuterItem = null;
        function findTemplateItems(item) {
            try {
                if (item.name && item.name.indexOf("Exterior") === 0) {
                    templateOuterItem = item;
                }
                if (item.name && item.name.indexOf("Interior") === 0) {
                    item.remove(); // Eliminar línea invisible guía
                }
                if (item.typename === "GroupItem") {
                    for (var g = item.pageItems.length - 1; g >= 0; g--) {
                        findTemplateItems(item.pageItems[g]);
                    }
                }
            } catch (err) {}
        }
        for (var ti = designItems.length - 1; ti >= 0; ti--) {
            findTemplateItems(designItems[ti]);
        }

        // Si se encontró el recuadro exterior de plantilla, quitar su trazo gris para que no se convierta en blanco
        if (templateOuterItem) {
            templateOuterItem.stroked = false;
            templateOuterItem.filled = false;
        }

        // Agrupar elementos del diseño
        var finalGroup = doc.groupItems.add();
        var timestamp = (new Date()).getTime();
        finalGroup.name = "Laser_Grabado_" + timestamp;

        for (var c = designItems.length - 1; c >= 0; c--) {
            try {
                designItems[c].move(finalGroup, ElementPlacement.PLACEATBEGINNING);
            } catch (e) {}
        }

        // Recolorar arte a blanco
        for (var d = 0; d < finalGroup.pageItems.length; d++) {
            recolorItem(finalGroup.pageItems[d], WHITE);
        }

        // Límites del diseño
        var bounds = finalGroup.visibleBounds;
        var left = bounds[0];
        var top = bounds[1];
        var right = bounds[2];
        var bottom = bounds[3];

        var designWidth = right - left;
        var designHeight = top - bottom;

        var backgroundWidth = designWidth + marginPt * 2;
        var backgroundHeight = designHeight + marginPt * 2;
        var backgroundLeft = left - marginPt;
        var backgroundTop = top + marginPt;

        // Crear fondo negro
        var background = finalGroup.pathItems.rectangle(
            backgroundTop,
            backgroundLeft,
            backgroundWidth,
            backgroundHeight
        );

        background.name = "Fondo negro Laser";
        background.filled = true;
        background.fillColor = BLACK;
        background.stroked = false;
        background.zOrder(ZOrderMethod.SENDTOBACK);

        // Centrar arte en el fondo negro si se aplicó margen
        if (margin > 0) {
            var minL = 9999999, maxT = -9999999, maxR = -9999999, minB = 9999999;
            for (var e = 0; e < finalGroup.pageItems.length; e++) {
                var itm = finalGroup.pageItems[e];
                if (itm === background) continue;
                try {
                    var vb = itm.visibleBounds;
                    if (vb[0] < minL) minL = vb[0];
                    if (vb[1] > maxT) maxT = vb[1];
                    if (vb[2] > maxR) maxR = vb[2];
                    if (vb[3] < minB) minB = vb[3];
                } catch (err) {}
            }

            var designCenterX = (minL + maxR) / 2.0;
            var designCenterY = (maxT + minB) / 2.0;
            var bgBounds = background.visibleBounds;
            var bgCenterX = (bgBounds[0] + bgBounds[2]) / 2.0;
            var bgCenterY = (bgBounds[1] + bgBounds[3]) / 2.0;

            var deltaX = bgCenterX - designCenterX;
            var deltaY = bgCenterY - designCenterY;

            for (var f = 0; f < finalGroup.pageItems.length; f++) {
                var moveItem = finalGroup.pageItems[f];
                if (moveItem === background) continue;
                try {
                    moveItem.translate(deltaX, deltaY);
                } catch (e) {}
            }
        }

        // MODO ESPEJO: Reflejo horizontal (-100% escala horizontal)
        finalGroup.resize(-100, 100, true, true, true, true, 100, Transformation.CENTER);

        // Dimensiones en mm del archivo final
        var finalBounds = finalGroup.visibleBounds;
        var artL = Math.min(finalBounds[0], finalBounds[2]);
        var artT = Math.max(finalBounds[1], finalBounds[3]);
        var artR = Math.max(finalBounds[0], finalBounds[2]);
        var artB = Math.min(finalBounds[1], finalBounds[3]);

        var wMm = Math.round(ptToMm(artR - artL) * 10) / 10;
        var hMm = Math.round(ptToMm(artT - artB) * 10) / 10;

        // Exportar a PNG 2400 PPP usando la mesa de trabajo temporal exacta
        var initialArtboardIndex = doc.artboards.getActiveArtboardIndex();
        var tempArtboard = doc.artboards.add([artL, artT, artR, artB]);
        var tempArtboardIndex = doc.artboards.length - 1;
        doc.artboards.setActiveArtboardIndex(tempArtboardIndex);

        var fileName = "Sello_Laser_" + Math.round(wMm) + "x" + Math.round(hMm) + "mm_2400DPI_" + timestamp + ".png";
        var exportFile = new File(laserFolder.fsName + "/" + fileName);

        var exportOptions = new ExportOptionsPNG24();
        exportOptions.antiAliasing = true;
        exportOptions.transparency = true;
        exportOptions.artBoardClipping = true;
        exportOptions.matte = false;
        exportOptions.horizontalScale = (dpi / 72.0) * 100.0;
        exportOptions.verticalScale = (dpi / 72.0) * 100.0;

        doc.exportFile(exportFile, ExportType.PNG24, exportOptions);

        // Restaurar mesa de trabajo
        tempArtboard.remove();
        doc.artboards.setActiveArtboardIndex(initialArtboardIndex);

        // Inyectar resolución física 2400 DPI (pHYs chunk) en el PNG
        setPngDpi(exportFile, dpi);

        doc.selection = null;
        finalGroup.selected = true;
        app.redraw();

        return JSON.stringify({
            success: true,
            message: "¡Láser exportado con éxito!\nTamaño: " + wMm + " x " + hMm + " mm (" + dpi + " PPP exactos)\nArchivo: " + exportFile.fsName,
            filePath: exportFile.fsName,
            widthMm: wMm,
            heightMm: hMm,
            dpi: dpi
        });
    } catch (err) {
        return JSON.stringify({ success: false, message: "Error en proceso Láser: " + err.toString() });
    }
}

/**
 * Procesa la selección para FOTOPOLÍMERO
 */
function processPhotopolymer(marginMm) {
    try {
        if (app.documents.length === 0) {
            return JSON.stringify({ success: false, message: "Abre un documento antes de ejecutar." });
        }
        var doc = app.activeDocument;
        if (doc.selection.length === 0) {
            return JSON.stringify({ success: false, message: "Selecciona primero el diseño del cliente." });
        }

        var marginVal = marginMm ? Number(marginMm) : 7.5;
        var marginPt = mmToPt(marginVal);

        var originalSelection = [];
        for (var i = 0; i < doc.selection.length; i++) {
            originalSelection.push(doc.selection[i]);
        }

        for (var a = originalSelection.length - 1; a >= 0; a--) {
            outlineTextInItem(originalSelection[a]);
        }

        var designItems = [];
        for (var b = 0; b < doc.selection.length; b++) {
            designItems.push(doc.selection[b]);
        }

        if (designItems.length === 0) {
            return JSON.stringify({ success: false, message: "No fue posible procesar la selección." });
        }

        var finalGroup = doc.groupItems.add();
        finalGroup.name = "Fotopolímero - " + (new Date().getTime());

        for (var c = designItems.length - 1; c >= 0; c--) {
            try {
                designItems[c].move(finalGroup, ElementPlacement.PLACEATBEGINNING);
            } catch (e) {}
        }

        for (var d = 0; d < finalGroup.pageItems.length; d++) {
            recolorItem(finalGroup.pageItems[d], WHITE);
        }

        var bounds = finalGroup.visibleBounds;
        var left = bounds[0];
        var top = bounds[1];
        var right = bounds[2];
        var bottom = bounds[3];

        var designWidth = right - left;
        var designHeight = top - bottom;

        var backgroundWidth = designWidth + marginPt * 2;
        var backgroundHeight = designHeight + marginPt * 2;
        var backgroundLeft = left - marginPt;
        var backgroundTop = top + marginPt;

        var background = finalGroup.pathItems.rectangle(
            backgroundTop,
            backgroundLeft,
            backgroundWidth,
            backgroundHeight
        );

        background.name = "Fondo negro Fotopolímero";
        background.filled = true;
        background.fillColor = BLACK;
        background.stroked = false;
        background.zOrder(ZOrderMethod.SENDTOBACK);

        // Centrar diseño
        var minL = 9999999, maxT = -9999999, maxR = -9999999, minB = 9999999;
        for (var e = 0; e < finalGroup.pageItems.length; e++) {
            var itm = finalGroup.pageItems[e];
            if (itm === background) continue;
            try {
                var vb = itm.visibleBounds;
                if (vb[0] < minL) minL = vb[0];
                if (vb[1] > maxT) maxT = vb[1];
                if (vb[2] > maxR) maxR = vb[2];
                if (vb[3] < minB) minB = vb[3];
            } catch (err) {}
        }

        var designCenterX = (minL + maxR) / 2.0;
        var designCenterY = (maxT + minB) / 2.0;
        var bgBounds = background.visibleBounds;
        var bgCenterX = (bgBounds[0] + bgBounds[2]) / 2.0;
        var bgCenterY = (bgBounds[1] + bgBounds[3]) / 2.0;

        var deltaX = bgCenterX - designCenterX;
        var deltaY = bgCenterY - designCenterY;

        for (var f = 0; f < finalGroup.pageItems.length; f++) {
            var moveItem = finalGroup.pageItems[f];
            if (moveItem === background) continue;
            try {
                moveItem.translate(deltaX, deltaY);
            } catch (e) {}
        }

        // Posicionar en parte superior de la mesa de trabajo
        var artboardIndex = doc.artboards.getActiveArtboardIndex();
        var artboardRect = doc.artboards[artboardIndex].artboardRect;
        var artboardLeft = artboardRect[0];
        var artboardTop = artboardRect[1];
        var artboardRight = artboardRect[2];

        var groupBounds = finalGroup.visibleBounds;
        var groupWidth = groupBounds[2] - groupBounds[0];

        var targetLeft = artboardLeft + ((artboardRight - artboardLeft) - groupWidth) / 2.0;
        var targetTop = artboardTop - mmToPt(5.0);

        var moveX = targetLeft - groupBounds[0];
        var moveY = targetTop - groupBounds[1];

        finalGroup.translate(moveX, moveY);

        doc.selection = null;
        finalGroup.selected = true;
        app.redraw();

        return JSON.stringify({
            success: true,
            message: "Diseño para Fotopolímero preparado con éxito (Margen: " + marginVal + " mm)."
        });
    } catch (err) {
        return JSON.stringify({ success: false, message: "Error en Fotopolímero: " + err.toString() });
    }
}

/**
 * Helper para crear carpetas recursivamente
 */
function createFolderRecursive(folder) {
    if (!folder) return false;
    if (folder.exists) return true;
    if (folder.parent && !folder.parent.exists) {
        createFolderRecursive(folder.parent);
    }
    return folder.create();
}

/**
 * Obtiene o crea la carpeta predeterminada de iconos del plugin
 */
function getDefaultIconsDirectory() {
    try {
        var baseDir = new Folder(Folder.userData.fsName + "/SellosChacaito/Iconos");
        createFolderRecursive(baseDir);
        return JSON.stringify({ success: true, folderPath: baseDir.fsName });
    } catch (err) {
        return JSON.stringify({ success: false, message: err.toString() });
    }
}

/**
 * Helper para sanitizar nombres de archivos sin expresiones regulares complejas
 */
function sanitizeCleanName(str, fallback) {
    if (!str) return fallback || "Icono";
    var invalid = "\\/:*?\"<>|";
    var out = "";
    for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (invalid.indexOf(c) !== -1) {
            out += "_";
        } else {
            out += c;
        }
    }
    var start = 0;
    while (start < out.length && out.charCodeAt(start) <= 32) {
        start++;
    }
    var end = out.length;
    while (end > start && out.charCodeAt(end - 1) <= 32) {
        end--;
    }
    var res = out.substring(start, end);
    return res.length > 0 ? res : (fallback || "Icono");
}

/**
 * Guarda el vector seleccionado en Illustrator como icono SVG vectorial limpio en la biblioteca
 */
function exportSelectedVectorAsIcon(iconName, category, customFolder) {
    try {
        if (app.documents.length === 0) {
            return JSON.stringify({ success: false, message: "Abre o crea un documento con tu vector antes de guardar." });
        }
        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) {
            return JSON.stringify({ success: false, message: "No hay nada seleccionado. Selecciona el vector en Illustrator primero." });
        }

        var cleanName = sanitizeCleanName(iconName, "Icono");
        var cleanCat = sanitizeCleanName(category, "General");

        // Determinar carpeta destino
        var destFolder;
        if (customFolder && customFolder.length > 0) {
            destFolder = new Folder(customFolder + "/" + cleanCat);
        } else {
            destFolder = new Folder(Folder.userData.fsName + "/SellosChacaito/Iconos/" + cleanCat);
        }
        createFolderRecursive(destFolder);

        // Calcular tamaño de la selección
        var sel = doc.selection;
        var minL = 9999999, maxT = -9999999, maxR = -9999999, minB = 9999999;
        for (var i = 0; i < sel.length; i++) {
            try {
                var vb = sel[i].visibleBounds;
                if (vb[0] < minL) minL = vb[0];
                if (vb[1] > maxT) maxT = vb[1];
                if (vb[2] > maxR) maxR = vb[2];
                if (vb[3] < minB) minB = vb[3];
            } catch (e) {}
        }

        var selW = maxR - minL;
        var selH = maxT - minB;
        if (selW <= 0) selW = 72;
        if (selH <= 0) selH = 72;

        // Margen pequeño para no cortar bordes
        var pad = 4.0;
        var artW = selW + (pad * 2);
        var artH = selH + (pad * 2);

        // Copiar selección
        app.copy();

        // Crear documento temporal usando app.documents.add estándar
        var colSpace = DocumentColorSpace.RGB;
        try {
            colSpace = doc.documentColorSpace;
        } catch (csErr) {}

        var tempDoc = app.documents.add(colSpace, artW, artH);
        app.paste();

        // Centrar arte en el documento temporal
        if (tempDoc.pageItems && tempDoc.pageItems.length > 0) {
            var abRect = tempDoc.artboards[0].artboardRect;
            var abCenterX = (abRect[0] + abRect[2]) / 2.0;
            var abCenterY = (abRect[1] + abRect[3]) / 2.0;

            var tMinL = 9999999, tMaxT = -9999999, tMaxR = -9999999, tMinB = 9999999;
            for (var j = 0; j < tempDoc.pageItems.length; j++) {
                try {
                    var tvb = tempDoc.pageItems[j].visibleBounds;
                    if (tvb[0] < tMinL) tMinL = tvb[0];
                    if (tvb[1] > tMaxT) tMaxT = tvb[1];
                    if (tvb[2] > tMaxR) tMaxR = tvb[2];
                    if (tvb[3] < tMinB) tMinB = tvb[3];
                } catch (e) {}
            }

            var tCenterX = (tMinL + tMaxR) / 2.0;
            var tCenterY = (tMaxT + tMinB) / 2.0;
            var dx = abCenterX - tCenterX;
            var dy = abCenterY - tCenterY;

            for (var k = 0; k < tempDoc.pageItems.length; k++) {
                try {
                    tempDoc.pageItems[k].translate(dx, dy);
                } catch (e) {}
            }
        }

        // Exportar a SVG
        var destFile = new File(destFolder.fsName + "/" + cleanName + ".svg");
        var exportOptions = new ExportOptionsSVG();
        exportOptions.embedRasterImages = true;
        exportOptions.fontSubsetting = SVGFontSubsetting.ALLGLYPHS;
        exportOptions.coordinatePrecision = 3;
        tempDoc.exportFile(destFile, ExportType.SVG, exportOptions);
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);

        return JSON.stringify({
            success: true,
            message: "Icono '" + cleanName + "' guardado en la biblioteca.",
            icon: {
                id: "ico_" + new Date().getTime(),
                name: cleanName,
                category: cleanCat,
                path: destFile.fsName,
                ext: "svg"
            }
        });
    } catch (err) {
        return JSON.stringify({ success: false, message: "Error al guardar vector como icono: " + err.toString() + (err.line ? " (L:" + err.line + ")" : "") });
    }
}

/**
 * Inserta un archivo vectorial (.svg, .ai, .eps, .pdf, .png) en el documento activo
 */
function insertIconToDocument(iconFilePath) {
    try {
        if (app.documents.length === 0) {
            return JSON.stringify({ success: false, message: "Abre o crea un documento antes de insertar el icono." });
        }
        var file = new File(iconFilePath);
        if (!file.exists) {
            return JSON.stringify({ success: false, message: "El archivo del icono no existe: " + iconFilePath });
        }

        var doc = app.activeDocument;
        var placed = doc.placedItems.add();
        placed.file = file;

        // Intentar embeber para que sea vector editable nativo
        try {
            placed.embed();
        } catch (embedErr) {
            // Si es imagen o ya está embebido, continuar
        }

        // Centrar en la mesa de trabajo activa
        try {
            var abIndex = doc.artboards.getActiveArtboardIndex();
            var abRect = doc.artboards[abIndex].artboardRect;
            var abCenterX = (abRect[0] + abRect[2]) / 2.0;
            var abCenterY = (abRect[1] + abRect[3]) / 2.0;

            var vb = placed.visibleBounds;
            var itmCenterX = (vb[0] + vb[2]) / 2.0;
            var itmCenterY = (vb[1] + vb[3]) / 2.0;

            placed.translate(abCenterX - itmCenterX, abCenterY - itmCenterY);
        } catch (posErr) {}

        doc.selection = null;
        try {
            placed.selected = true;
        } catch (selErr) {}

        app.redraw();

        return JSON.stringify({
            success: true,
            message: "Icono '" + file.name + "' insertado en el documento."
        });
    } catch (err) {
        return JSON.stringify({ success: false, message: "Error al insertar icono: " + err.toString() });
    }
}

// Compatibilidad retroactiva
function insertTemplate(filePath) {
    return insertIconToDocument(filePath);
}

/**
 * Abre selector de carpeta para escanear iconos
 */
function browseIconsFolder() {
    try {
        var folder = Folder.selectDialog("Selecciona la carpeta donde tienes tus iconos");
        if (folder) {
            return JSON.stringify({
                success: true,
                folderPath: folder.fsName
            });
        }
        return JSON.stringify({ success: false, message: "Operación cancelada." });
    } catch (err) {
        return JSON.stringify({ success: false, message: err.toString() });
    }
}

/**
 * Escanea recursivamente una carpeta buscando archivos vectoriales e imágenes
 */
function scanFolderIcons(folderPath) {
    try {
        var rootFolder = new Folder(folderPath);
        if (!rootFolder.exists) {
            return JSON.stringify({ success: false, message: "La carpeta no existe: " + folderPath });
        }

        var icons = [];
        var validExts = { "svg": 1, "ai": 1, "eps": 1, "pdf": 1, "png": 1, "jpg": 1 };

        function scanRecursive(dir, categoryName) {
            var items = dir.getFiles();
            for (var i = 0; i < items.length; i++) {
                var itm = items[i];
                if (itm instanceof Folder) {
                    // La subcarpeta define la categoría
                    scanRecursive(itm, itm.name);
                } else if (itm instanceof File) {
                    var dotIdx = itm.name.lastIndexOf(".");
                    if (dotIdx !== -1) {
                        var ext = itm.name.substring(dotIdx + 1).toLowerCase();
                        if (validExts[ext]) {
                            var base = itm.name.substring(0, dotIdx);
                            var cleanBaseName = "";
                            for (var b = 0; b < base.length; b++) {
                                var ch = base.charAt(b);
                                cleanBaseName += (ch === '-' || ch === '_') ? ' ' : ch;
                            }
                            var safeId = "";
                            for (var s = 0; s < itm.name.length; s++) {
                                var cCode = itm.name.charCodeAt(s);
                                if ((cCode >= 48 && cCode <= 57) || (cCode >= 65 && cCode <= 90) || (cCode >= 97 && cCode <= 122)) {
                                    safeId += itm.name.charAt(s);
                                }
                            }
                            icons.push({
                                id: "ico_" + icons.length + "_" + safeId,
                                name: cleanBaseName,
                                category: categoryName,
                                path: itm.fsName,
                                ext: ext
                            });
                        }
                    }
                }
            }
        }

        scanRecursive(rootFolder, "General");

        return JSON.stringify({
            success: true,
            folderPath: rootFolder.fsName,
            total: icons.length,
            icons: icons
        });
    } catch (err) {
        return JSON.stringify({ success: false, message: "Error al escanear carpeta: " + err.toString() });
    }
}
