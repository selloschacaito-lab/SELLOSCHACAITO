#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("Abre un documento antes de ejecutar el script.");
        return;
    }

    var doc = app.activeDocument;

    if (doc.selection.length === 0) {
        alert("Selecciona primero el diseño del cliente.");
        return;
    }

    function mmToPt(mm) {
        return mm * 72 / 25.4;
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

    // Guardar selección inicial
    var originalSelection = [];
    for (var i = 0; i < doc.selection.length; i++) {
        originalSelection.push(doc.selection[i]);
    }

    // Convierte textos seleccionados a contornos.
    function outlineTextInItem(item) {
        try {
            if (item.typename === "TextFrame") {
                if (!item.locked && !item.hidden) {
                    return item.createOutline();
                }
            }

            if (item.typename === "GroupItem") {
                // Recorrer de atrás hacia adelante porque createOutline cambia la colección.
                for (var j = item.pageItems.length - 1; j >= 0; j--) {
                    outlineTextInItem(item.pageItems[j]);
                }
            }

            if (item.typename === "CompoundPathItem") {
                // No requiere tratamiento especial.
            }
        } catch (e) {}
        return item;
    }

    for (var a = originalSelection.length - 1; a >= 0; a--) {
        outlineTextInItem(originalSelection[a]);
    }

    // Recuperar selección resultante después de convertir textos.
    var designItems = [];
    for (var b = 0; b < doc.selection.length; b++) {
        designItems.push(doc.selection[b]);
    }

    if (designItems.length === 0) {
        alert("No fue posible procesar la selección.");
        return;
    }

    // Crear grupo contenedor y mover dentro todos los elementos seleccionados.
    var finalGroup = doc.groupItems.add();
    finalGroup.name = "Diseño listo para imprimir";

    for (var c = designItems.length - 1; c >= 0; c--) {
        try {
            designItems[c].move(finalGroup, ElementPlacement.PLACEATBEGINNING);
        } catch (e) {}
    }

    // Aplicar blanco a todos los elementos vectoriales.
    function recolorItem(item) {
        try {
            if (item.typename === "PathItem") {
                if (item.filled) {
                    item.fillColor = WHITE;
                }
                if (item.stroked) {
                    item.strokeColor = WHITE;
                }
            } else if (item.typename === "CompoundPathItem") {
                for (var i = 0; i < item.pathItems.length; i++) {
                    if (item.pathItems[i].filled) {
                        item.pathItems[i].fillColor = WHITE;
                    }
                    if (item.pathItems[i].stroked) {
                        item.pathItems[i].strokeColor = WHITE;
                    }
                }
            } else if (item.typename === "GroupItem") {
                for (var j = 0; j < item.pageItems.length; j++) {
                    recolorItem(item.pageItems[j]);
                }
            } else if (item.typename === "TextFrame") {
                item.textRange.characterAttributes.fillColor = WHITE;
                item.textRange.characterAttributes.strokeColor = WHITE;
            }
        } catch (e) {}
    }

    for (var d = 0; d < finalGroup.pageItems.length; d++) {
        recolorItem(finalGroup.pageItems[d]);
    }

    // Medidas reales del diseño antes de crear el fondo.
    var bounds = finalGroup.visibleBounds;
    var left = bounds[0];
    var top = bounds[1];
    var right = bounds[2];
    var bottom = bounds[3];

    var designWidth = right - left;
    var designHeight = top - bottom;

    var margin = mmToPt(7.5);
    var backgroundWidth = designWidth + margin * 2;
    var backgroundHeight = designHeight + margin * 2;

    var backgroundLeft = left - margin;
    var backgroundTop = top + margin;

    // Crear fondo negro detrás.
    var background = finalGroup.pathItems.rectangle(
        backgroundTop,
        backgroundLeft,
        backgroundWidth,
        backgroundHeight
    );

    background.name = "Fondo negro";
    background.filled = true;
    background.fillColor = BLACK;
    background.stroked = false;
    background.zOrder(ZOrderMethod.SENDTOBACK);

    // Centrar diseño dentro del fondo usando sus límites visibles.
    var designBoundsAfter = null;

    // Obtener límites de los elementos del diseño excluyendo el fondo.
    var minL = 9999999;
    var maxT = -9999999;
    var maxR = -9999999;
    var minB = 9999999;

    for (var e = 0; e < finalGroup.pageItems.length; e++) {
        var item = finalGroup.pageItems[e];
        if (item === background) continue;

        try {
            var vb = item.visibleBounds;
            if (vb[0] < minL) minL = vb[0];
            if (vb[1] > maxT) maxT = vb[1];
            if (vb[2] > maxR) maxR = vb[2];
            if (vb[3] < minB) minB = vb[3];
        } catch (err) {}
    }

    var designCenterX = (minL + maxR) / 2;
    var designCenterY = (maxT + minB) / 2;

    var backgroundBounds = background.visibleBounds;
    var backgroundCenterX = (backgroundBounds[0] + backgroundBounds[2]) / 2;
    var backgroundCenterY = (backgroundBounds[1] + backgroundBounds[3]) / 2;

    var deltaX = backgroundCenterX - designCenterX;
    var deltaY = backgroundCenterY - designCenterY;

    for (var f = 0; f < finalGroup.pageItems.length; f++) {
        var moveItem = finalGroup.pageItems[f];
        if (moveItem === background) continue;
        try {
            moveItem.translate(deltaX, deltaY);
        } catch (e) {}
    }

    // Posicionar grupo: centrado horizontal y 5 mm bajo el borde superior.
    var artboardIndex = doc.artboards.getActiveArtboardIndex();
    var artboardRect = doc.artboards[artboardIndex].artboardRect;
    var artboardLeft = artboardRect[0];
    var artboardTop = artboardRect[1];
    var artboardRight = artboardRect[2];

    var groupBounds = finalGroup.visibleBounds;
    var groupWidth = groupBounds[2] - groupBounds[0];

    var targetLeft = artboardLeft + ((artboardRight - artboardLeft) - groupWidth) / 2;
    var targetTop = artboardTop - mmToPt(5);

    var moveX = targetLeft - groupBounds[0];
    var moveY = targetTop - groupBounds[1];

    finalGroup.translate(moveX, moveY);

    doc.selection = null;
    finalGroup.selected = true;

    app.redraw();
})();
