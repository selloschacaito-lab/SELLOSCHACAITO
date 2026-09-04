#target illustrator

/**
 * Sellos Chacaíto - Panel Flotante Nativo (ScriptUI)
 * Ejecutable directamente desde Archivo > Secuencias de comandos > SellosChacaito_Panel_ScriptUI.jsx
 */

(function () {
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

            var ppm = Math.round(Number(dpi) / 0.0254);
            var ppmB0 = (ppm >>> 24) & 0xFF;
            var ppmB1 = (ppm >>> 16) & 0xFF;
            var ppmB2 = (ppm >>> 8) & 0xFF;
            var ppmB3 = ppm & 0xFF;

            var physTypeAndData = [
                0x70, 0x48, 0x59, 0x73,
                ppmB0, ppmB1, ppmB2, ppmB3,
                ppmB0, ppmB1, ppmB2, ppmB3,
                0x01
            ];

            var crcVal = getCrc32(physTypeAndData);
            var crcB0 = (crcVal >>> 24) & 0xFF;
            var crcB1 = (crcVal >>> 16) & 0xFF;
            var crcB2 = (crcVal >>> 8) & 0xFF;
            var crcB3 = crcVal & 0xFF;

            var physChunkStr = String.fromCharCode(
                0x00, 0x00, 0x00, 0x09,
                0x70, 0x48, 0x59, 0x73,
                ppmB0, ppmB1, ppmB2, ppmB3,
                ppmB0, ppmB1, ppmB2, ppmB3,
                0x01,
                crcB0, crcB1, crcB2, crcB3
            );

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

    function recolorItem(item, targetColor) {
        try {
            if (item.typename === "PathItem") {
                if (item.filled) item.fillColor = targetColor;
                if (item.stroked) item.strokeColor = targetColor;
            } else if (item.typename === "CompoundPathItem") {
                for (var i = 0; i < item.pathItems.length; i++) {
                    if (item.pathItems[i].filled) item.pathItems[i].fillColor = targetColor;
                    if (item.pathItems[i].stroked) item.pathItems[i].strokeColor = targetColor;
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
     * Crea el marco del sello:
     * - Exterior: nominal, sin color, trazo 0.25pt gris 40%
     * - Interior: 1mm menos, sin color, sin borde
     * - Agrupados
     */
    function createStampTemplate(wMm, hMm, isCircle, name) {
        if (app.documents.length === 0) {
            app.documents.add(DocumentColorSpace.CMYK, 300, 300);
        }
        var doc = app.activeDocument;

        var outerW = mmToPt(wMm);
        var outerH = mmToPt(hMm);
        var innerW = mmToPt(Math.max(0.5, wMm - 1.0));
        var innerH = mmToPt(Math.max(0.5, hMm - 1.0));

        var abIndex = doc.artboards.getActiveArtboardIndex();
        var abRect = doc.artboards[abIndex].artboardRect;
        var centerX = (abRect[0] + abRect[2]) / 2.0;
        var centerY = (abRect[1] + abRect[3]) / 2.0;

        var stampGroup = doc.groupItems.add();
        stampGroup.name = "Plantilla " + (name || (wMm + "x" + hMm + " mm"));

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

        // Exterior
        outerShape.name = "Exterior (" + wMm + "x" + hMm + " mm)";
        outerShape.filled = false;
        outerShape.stroked = true;
        outerShape.strokeWidth = 0.25;
        outerShape.strokeColor = getGray40Color(doc);

        // Interior
        var inW = (Math.round((wMm - 1.0) * 10) / 10);
        var inH = (Math.round((hMm - 1.0) * 10) / 10);
        innerShape.name = "Interior (" + inW + "x" + inH + " mm)";
        innerShape.filled = false;
        innerShape.stroked = false;

        doc.selection = null;
        stampGroup.selected = true;
        app.redraw();
    }

    function doLaserProcess() {
        if (app.documents.length === 0 || app.activeDocument.selection.length === 0) {
            alert("Abre un documento y selecciona el diseño a procesar para Láser.");
            return;
        }

        var doc = app.activeDocument;
        var margin = 0.0; // Tamaño exacto del diseño por defecto
        var marginPt = mmToPt(margin);
        var dpi = 2400;

        var desktopFolder = Folder.desktop;
        var laserFolder = new Folder(desktopFolder.fsName + "/LASER");
        if (!laserFolder.exists) laserFolder.create();

        var originalSelection = [];
        for (var i = 0; i < doc.selection.length; i++) originalSelection.push(doc.selection[i]);
        for (var a = originalSelection.length - 1; a >= 0; a--) outlineTextInItem(originalSelection[a]);

        var designItems = [];
        for (var b = 0; b < doc.selection.length; b++) designItems.push(doc.selection[b]);

        // Limpiar guías de plantilla si existen
        function cleanTemplateGuides(item) {
            try {
                if (item.name && item.name.indexOf("Exterior") === 0) {
                    item.stroked = false;
                    item.filled = false;
                }
                if (item.name && item.name.indexOf("Interior") === 0) {
                    item.remove();
                }
                if (item.typename === "GroupItem") {
                    for (var g = item.pageItems.length - 1; g >= 0; g--) {
                        cleanTemplateGuides(item.pageItems[g]);
                    }
                }
            } catch (e) {}
        }
        for (var ti = designItems.length - 1; ti >= 0; ti--) cleanTemplateGuides(designItems[ti]);

        var finalGroup = doc.groupItems.add();
        var timestamp = (new Date()).getTime();
        finalGroup.name = "Laser_Grabado_" + timestamp;

        for (var c = designItems.length - 1; c >= 0; c--) {
            try { designItems[c].move(finalGroup, ElementPlacement.PLACEATBEGINNING); } catch (e) {}
        }

        for (var d = 0; d < finalGroup.pageItems.length; d++) {
            recolorItem(finalGroup.pageItems[d], WHITE);
        }

        var bounds = finalGroup.visibleBounds;
        var left = bounds[0], top = bounds[1], right = bounds[2], bottom = bounds[3];
        var designWidth = right - left, designHeight = top - bottom;

        var background = finalGroup.pathItems.rectangle(
            top + marginPt,
            left - marginPt,
            designWidth + marginPt * 2,
            designHeight + marginPt * 2
        );
        background.filled = true;
        background.fillColor = BLACK;
        background.stroked = false;
        background.zOrder(ZOrderMethod.SENDTOBACK);

        // Centrar
        if (margin > 0) {
            var minL = 9999999, maxT = -9999999, maxR = -9999999, minB = 9999999;
            for (var e = 0; e < finalGroup.pageItems.length; e++) {
                var itm = finalGroup.pageItems[e];
                if (itm === background) continue;
                var vb = itm.visibleBounds;
                if (vb[0] < minL) minL = vb[0];
                if (vb[1] > maxT) maxT = vb[1];
                if (vb[2] > maxR) maxR = vb[2];
                if (vb[3] < minB) minB = vb[3];
            }

            var dCenterX = (minL + maxR) / 2.0, dCenterY = (maxT + minB) / 2.0;
            var bgBounds = background.visibleBounds;
            var bgCenterX = (bgBounds[0] + bgBounds[2]) / 2.0, bgCenterY = (bgBounds[1] + bgBounds[3]) / 2.0;

            for (var f = 0; f < finalGroup.pageItems.length; f++) {
                var moveItem = finalGroup.pageItems[f];
                if (moveItem === background) continue;
                moveItem.translate(bgCenterX - dCenterX, bgCenterY - dCenterY);
            }
        }

        // MODO ESPEJO: Reflejo horizontal en documento y exportación
        finalGroup.resize(-100, 100, true, true, true, true, 100, Transformation.CENTER);

        var finalBounds = finalGroup.visibleBounds;
        var artL = Math.min(finalBounds[0], finalBounds[2]);
        var artT = Math.max(finalBounds[1], finalBounds[3]);
        var artR = Math.max(finalBounds[0], finalBounds[2]);
        var artB = Math.min(finalBounds[1], finalBounds[3]);

        var wMm = Math.round(ptToMm(artR - artL) * 10) / 10;
        var hMm = Math.round(ptToMm(artT - artB) * 10) / 10;

        // Exportar a PNG 2400 PPP
        var initialArtboardIndex = doc.artboards.getActiveArtboardIndex();
        var tempArtboard = doc.artboards.add([artL, artT, artR, artB]);
        doc.artboards.setActiveArtboardIndex(doc.artboards.length - 1);

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
        tempArtboard.remove();
        doc.artboards.setActiveArtboardIndex(initialArtboardIndex);

        // Inyectar resolución física 2400 DPI (pHYs)
        setPngDpi(exportFile, dpi);

        doc.selection = null;
        finalGroup.selected = true;
        app.redraw();

        alert("¡Grabado Láser listo!\nTamaño exacto: " + wMm + " x " + hMm + " mm (" + dpi + " PPP)\nQuedó en MODO ESPEJO y exportado a:\n" + exportFile.fsName);
    }

    function doPhotopolymerProcess() {
        if (app.documents.length === 0 || app.activeDocument.selection.length === 0) {
            alert("Abre un documento y selecciona el diseño para Fotopolímero.");
            return;
        }

        var doc = app.activeDocument;
        var marginPt = mmToPt(7.5);

        var originalSelection = [];
        for (var i = 0; i < doc.selection.length; i++) originalSelection.push(doc.selection[i]);
        for (var a = originalSelection.length - 1; a >= 0; a--) outlineTextInItem(originalSelection[a]);

        var designItems = [];
        for (var b = 0; b < doc.selection.length; b++) designItems.push(doc.selection[b]);

        var finalGroup = doc.groupItems.add();
        finalGroup.name = "Fotopolimero_" + (new Date().getTime());

        for (var c = designItems.length - 1; c >= 0; c--) {
            try { designItems[c].move(finalGroup, ElementPlacement.PLACEATBEGINNING); } catch (e) {}
        }

        for (var d = 0; d < finalGroup.pageItems.length; d++) {
            recolorItem(finalGroup.pageItems[d], WHITE);
        }

        var bounds = finalGroup.visibleBounds;
        var left = bounds[0], top = bounds[1], right = bounds[2], bottom = bounds[3];

        var background = finalGroup.pathItems.rectangle(
            top + marginPt,
            left - marginPt,
            (right - left) + marginPt * 2,
            (top - bottom) + marginPt * 2
        );
        background.filled = true;
        background.fillColor = BLACK;
        background.stroked = false;
        background.zOrder(ZOrderMethod.SENDTOBACK);

        // Centrar
        var minL = 9999999, maxT = -9999999, maxR = -9999999, minB = 9999999;
        for (var e = 0; e < finalGroup.pageItems.length; e++) {
            var itm = finalGroup.pageItems[e];
            if (itm === background) continue;
            var vb = itm.visibleBounds;
            if (vb[0] < minL) minL = vb[0];
            if (vb[1] > maxT) maxT = vb[1];
            if (vb[2] > maxR) maxR = vb[2];
            if (vb[3] < minB) minB = vb[3];
        }

        var dCenterX = (minL + maxR) / 2.0, dCenterY = (maxT + minB) / 2.0;
        var bgBounds = background.visibleBounds;
        var bgCenterX = (bgBounds[0] + bgBounds[2]) / 2.0, bgCenterY = (bgBounds[1] + bgBounds[3]) / 2.0;

        for (var f = 0; f < finalGroup.pageItems.length; f++) {
            var moveItem = finalGroup.pageItems[f];
            if (moveItem === background) continue;
            moveItem.translate(bgCenterX - dCenterX, bgCenterY - dCenterY);
        }

        // Posicionar en parte superior de mesa de trabajo
        var artboardRect = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var groupBounds = finalGroup.visibleBounds;
        var targetLeft = artboardRect[0] + ((artboardRect[2] - artboardRect[0]) - (groupBounds[2] - groupBounds[0])) / 2.0;
        var targetTop = artboardRect[1] - mmToPt(5.0);

        finalGroup.translate(targetLeft - groupBounds[0], targetTop - groupBounds[1]);

        doc.selection = null;
        finalGroup.selected = true;
        app.redraw();

        alert("¡Diseño preparado para Fotopolímero y centrado en la mesa de trabajo!");
    }

    // INTERFAZ GRÁFICA SCRIPTUI
    var win = new Window("palette", "Sellos Chacaíto - Plugin Impresión", undefined, { resizeable: true });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 8;
    win.margins = 12;

    // Panel Medidas
    var pnlSizes = win.add("panel", undefined, "Crear Plantilla de Medida");
    pnlSizes.orientation = "column";
    pnlSizes.alignChildren = ["fill", "top"];

    var lblHelp = pnlSizes.add("statictext", undefined, "Crea borde exterior 0.25pt gris 40% + interior 1mm menos sin borde:", { multiline: true });
    lblHelp.preferredSize.width = 280;

    var grid = pnlSizes.add("group");
    grid.orientation = "column";
    grid.spacing = 4;

    var row1 = grid.add("group");
    var btn4913 = row1.add("button", undefined, "4913 (58x22)");
    var btn4912 = row1.add("button", undefined, "4912 (47x18)");
    var btn4911 = row1.add("button", undefined, "4911 (38x14)");

    var row2 = grid.add("group");
    var btn9511 = row2.add("button", undefined, "9511 (38x14)");
    var btn9512 = row2.add("button", undefined, "9512 (47x18)");
    var btn4545 = row2.add("button", undefined, "45x45 mm");

    var row3 = grid.add("group");
    var btnR542 = row3.add("button", undefined, "⚪ R-542 (Ø42)");
    var btn4910 = row3.add("button", undefined, "4910 (26x9)");

    // Medida personalizada manual
    var grpCustom = pnlSizes.add("group");
    grpCustom.add("statictext", undefined, "Manual:");
    var txtW = grpCustom.add("edittext", undefined, "45");
    txtW.characters = 3;
    grpCustom.add("statictext", undefined, "x");
    var txtH = grpCustom.add("edittext", undefined, "45");
    txtH.characters = 3;
    grpCustom.add("statictext", undefined, "mm");
    var chkCircle = grpCustom.add("checkbox", undefined, "Círculo");
    var btnApplyCustom = grpCustom.add("button", undefined, "+ Crear");

    // Panel Procesar
    var pnlProcess = win.add("panel", undefined, "Procesar para Impresión");
    pnlProcess.orientation = "column";
    pnlProcess.alignChildren = ["fill", "top"];

    var btnLaser = pnlProcess.add("button", undefined, "🔴 GRABADO LÁSER (2400 DPI - MODO ESPEJO - PNG)");
    var btnPhoto = pnlProcess.add("button", undefined, "🟢 FOTOPOLÍMERO (Negativo 7.5mm - Centrado)");

    // Eventos
    btn4913.onClick = function () { createStampTemplate(58, 22, false, "4913"); };
    btn4912.onClick = function () { createStampTemplate(47, 18, false, "4912"); };
    btn4911.onClick = function () { createStampTemplate(38, 14, false, "4911"); };
    btn9511.onClick = function () { createStampTemplate(38, 14, false, "9511"); };
    btn9512.onClick = function () { createStampTemplate(47, 18, false, "9512"); };
    btn4545.onClick = function () { createStampTemplate(45, 45, false, "45x45"); };
    btnR542.onClick = function () { createStampTemplate(42, 42, true, "R-542"); };
    btn4910.onClick = function () { createStampTemplate(26, 9, false, "4910"); };

    btnApplyCustom.onClick = function () {
        var w = parseFloat(txtW.text);
        var h = parseFloat(txtH.text);
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
            alert("Ingresa medidas válidas.");
            return;
        }
        createStampTemplate(w, h, chkCircle.value, w + "x" + h + " mm");
    };

    btnLaser.onClick = doLaserProcess;
    btnPhoto.onClick = doPhotopolymerProcess;

    win.center();
    win.show();
})();
