const raw = `Carlos Martinez 
V-14567890
0414-1234567
carlosmartinez@gmail.com
Calle los Ilustres, Caracas`;

let lines = raw.split(/[\n\t,]+/).map(l => l.trim()).filter(l => l.length > 0);

let nombre = "";
let tipoDoc = "V-";
let numDoc = "";
let telefono = "";
let correo = "";
let direccion = "";

const regexDoc = /([VJGEPCvjgepc])[-.\s]?(\d{6,10})/i;
const regexSoloNum = /^\d{6,10}$/;
const regexTel = /(\+?58)?(0?4\d{2}|0?2\d{2})[-.\s]?(\d{7})/i;
const regexCorreo = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

lines.forEach((line) => {
    if(!correo && regexCorreo.test(line)) {
        correo = line.match(regexCorreo)[0];
        line = line.replace(correo, '').trim();
    }

    if(!telefono && regexTel.test(line)) {
        telefono = line.match(regexTel)[0];
        line = line.replace(telefono, '').trim();
    }

    if(!numDoc) {
        let docMatch = line.match(regexDoc);
        if(docMatch) {
            tipoDoc = docMatch[1].toUpperCase() + "-";
            numDoc = docMatch[2];
            line = line.replace(docMatch[0], '').trim();
        } else if (regexSoloNum.test(line) && line.length >= 6) {
            numDoc = line;
            tipoDoc = "V-";
            line = "";
        }
    }

    if (line.length > 2) {
        if (!nombre) {
            nombre = line;
        } else {
            direccion += (direccion ? " " : "") + line;
        }
    }
});

console.log({nombre, tipoDoc, numDoc, telefono, correo, direccion});
