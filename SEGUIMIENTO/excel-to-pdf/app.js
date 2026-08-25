document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const removeBtn = document.getElementById('remove-btn');
    const convertBtn = document.getElementById('convert-btn');
    const loader = document.getElementById('loader');
    const btnText = document.querySelector('.btn-text');

    let currentFile = null;
    let excelData = null;

    // Abrir el selector de archivos al hacer clic
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== removeBtn) {
            fileInput.click();
        }
    });

    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Manejo de drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        });
    });

    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                'application/vnd.ms-excel',
                'text/csv'
            ];
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
                currentFile = file;
                fileName.textContent = file.name;
                uploadArea.classList.add('hidden');
                fileInfo.classList.remove('hidden');
                convertBtn.disabled = false;
                
                // Read the file immediately to prepare data
                readExcel(file);
            } else {
                alert('Por favor, selecciona un archivo Excel válido (.xlsx, .xls) o CSV.');
            }
        }
    }

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentFile = null;
        excelData = null;
        fileInput.value = '';
        uploadArea.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        convertBtn.disabled = true;
    });

    function readExcel(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            excelData = workbook;
        };
        reader.readAsArrayBuffer(file);
    }

    convertBtn.addEventListener('click', async () => {
        if (!excelData || !currentFile) return;

        // Mostrar loading
        btnText.textContent = 'Convirtiendo...';
        loader.classList.remove('hidden');
        convertBtn.disabled = true;

        try {
            // Dar un pequeño timeout para que la UI se actualice
            await new Promise(resolve => setTimeout(resolve, 100));
            
            generatePDF(excelData, currentFile.name);
            
            // Éxito
            btnText.textContent = '¡Convertido con éxito!';
            convertBtn.style.background = 'var(--success)';
            
            setTimeout(() => {
                btnText.textContent = 'Convertir a PDF';
                loader.classList.add('hidden');
                convertBtn.disabled = false;
                convertBtn.style.background = '';
            }, 3000);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Hubo un error al generar el PDF. Verifica que el archivo no esté corrupto o vacío.');
            btnText.textContent = 'Convertir a PDF';
            loader.classList.add('hidden');
            convertBtn.disabled = false;
        }
    });

    function generatePDF(workbook, originalName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir la hoja a JSON (array de arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
            throw new Error("La hoja de cálculo está vacía");
        }

        // Configurar título
        doc.setFontSize(16);
        doc.text(originalName, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22);

        // Usar jspdf-autotable para renderizar los datos
        // Extraemos encabezados (primera fila) y el cuerpo (resto de filas)
        const headers = [jsonData[0]];
        const body = jsonData.slice(1);

        doc.autoTable({
            head: headers,
            body: body,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [99, 102, 241] }, // Color primary
            margin: { top: 28 }
        });

        // Guardar el PDF
        const pdfName = originalName.replace(/\.[^/.]+$/, "") + ".pdf";
        doc.save(pdfName);
    }
});
