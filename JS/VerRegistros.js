document.addEventListener('DOMContentLoaded', function () {
const registroSelect = document.getElementById('registroSelect');
    const detalle = document.getElementById('detalleRegistro');
    const configCamiones = {
        "CAM 3.5": { espacios: 6 },
        "THORTON": { espacios: 10 },
        "TRAILER RABON": { espacios: 24 },
        "TRAILER 53": { espacios: 24 },
    };

    let registros = [];

    // 🔄 Cargar registros desde el backend
    fetch('/registros')
        .then(res => {
            if (!res.ok) throw new Error('Error al obtener registros');
            return res.json();
        })
        .then(data => {
            registros = data.map((r, i) => ({ id: i + 1, ...r })); // Asignar ID si no viene
            rellenarSelect(registros);
        })
        .catch(error => {
            console.error('Error al cargar registros:', error);
            alert('No se pudieron cargar los registros');
        });

    function rellenarSelect(registros) {
        registroSelect.innerHTML = '<option value="">Seleccionar...</option>';
        registros.forEach((registro, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `ID ${registro.id} - ${registro.fecha} - ${registro.tipoCamion}`;
            registroSelect.appendChild(option);
        });
    }

    registroSelect.addEventListener('change', function () {
        const selectedIndex = this.value;
        if (selectedIndex === '') {
            detalle.style.display = 'none';
            document.getElementById('exportarPDF').disabled = true;
            document.getElementById('exportarExcel').disabled = true;
            return;
        }

        const registro = registros[selectedIndex];
        detalle.style.display = 'block';

        document.getElementById('infoFecha').textContent = registro.fecha;
        document.getElementById('infoTipoCamion').textContent = registro.tipoCamion;
        document.getElementById('infoTarimas').textContent = registro.tarimas;
        document.getElementById('infoProveedor').textContent = registro.proveedor;
        document.getElementById('infoEslingas').textContent = registro.eslingas;
        document.getElementById('infoTurno').textContent = registro.turno;
        document.getElementById('infoAlmacenista').textContent = registro.almacenista;
        document.getElementById('infoComentarios').textContent = registro.comentarios || '-';

        generarVisualizacionCamion(configCamiones[registro.tipoCamion].espacios, parseInt(registro.tarimas));

        document.getElementById('exportarPDF').disabled = false;
        document.getElementById('exportarExcel').disabled = false;
    });

    function generarVisualizacionCamion(espacios, tarimas) {
        const panelCamion = document.getElementById('panelCamion');
        panelCamion.innerHTML = '';
        const columnas = Math.ceil(espacios / 2);
        const distribucion = Array.from({ length: 2 }, () => Array(columnas).fill(0));
        let restante = tarimas;

        outer1:
        for (let c = 0; c < columnas; c++) {
            for (let r = 0; r < 2; r++) {
                if (restante <= 0) break outer1;
                distribucion[r][c] = 1;
                restante--;
            }
        }

        let niveles = 2;
        while (restante > 0 && niveles <= 3) {
            for (let c = 0; c < columnas && restante > 0; c++) {
                for (let r = 0; r < 2 && restante > 0; r++) {
                    if (distribucion[r][c] < niveles) {
                        distribucion[r][c]++;
                        restante--;
                    }
                }
            }
            niveles++;
        }

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${columnas}, 65px)`;
        grid.style.gridTemplateRows = 'repeat(2, 65px)';
        grid.style.gap = '2px';

        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < columnas; c++) {
                const val = distribucion[r][c];
                const cell = document.createElement('div');
                cell.textContent = val;
                cell.style.width = '65px';
                cell.style.height = '65px';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.border = '1px solid #000';
                cell.style.fontWeight = 'bold';

                switch (val) {
                    case 0: cell.style.backgroundColor = 'lightgray'; break;
                    case 1: cell.style.backgroundColor = 'lightblue'; break;
                    case 2: cell.style.backgroundColor = 'khaki'; break;
                    case 3: cell.style.backgroundColor = 'lightgreen'; break;
                }
                grid.appendChild(cell);
            }
        }
        panelCamion.appendChild(grid);
    }
    document.getElementById("exportarPDF").addEventListener("click", async function () {
        const { jsPDF } = window.jspdf;

        const doc = new jsPDF();
        const selectedIndex = registroSelect.value;
        if (selectedIndex === '') return alert("Selecciona un registro primero");

        const registro = registros[selectedIndex];
        let y = 10;

        doc.setFontSize(12);
        doc.text(`ID: ${registro.id}`, 10, y += 10);
        doc.text(`Fecha: ${registro.fecha}`, 10, y += 10);
        doc.text(`Tipo de Camión: ${registro.tipoCamion}`, 10, y += 10);
        doc.text(`Tarimas: ${registro.tarimas}`, 10, y += 10);
        doc.text(`Proveedor: ${registro.proveedor}`, 10, y += 10);
        doc.text(`Eslingas: ${registro.eslingas}`, 10, y += 10);
        doc.text(`Turno: ${registro.turno}`, 10, y += 10);
        doc.text(`Almacenista: ${registro.almacenista}`, 10, y += 10);
        const comentarioTexto = `Comentarios: ${registro.comentarios || "-"}`;
        const comentarioAnchoMaximo = 180; // ancho en mm
        const lineasComentario = doc.splitTextToSize(comentarioTexto, comentarioAnchoMaximo);
        doc.text(lineasComentario, 10, y += 10);
        y += lineasComentario.length * 7;

        if (y > 250) { 
            doc.addPage();
            y = 10;
        }
        const camionContainer = document.querySelector("#detalleRegistro .d-flex");
        await html2canvas(camionContainer).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            const imgWidth = 180;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(imgData, 'PNG', 10, y + 10, imgWidth, imgHeight);
            doc.save(`Registro_ID${registro.id}_${registro.fecha}.pdf`);
        });
    });

    document.getElementById("exportarExcel").addEventListener("click", function () {
    const selectedIndex = registroSelect.value;
    if (selectedIndex === '') return alert("Selecciona un registro primero");

    const registro = registros[selectedIndex];
    const nombreBase = `Registro_ID${registro.id}_${registro.fecha}`;

    XlsxPopulate.fromBlankAsync()
        .then(workbook => {
            const sheet = workbook.sheet("Sheet1");

            const datos = [
                ["ID", registro.id],
                ["Fecha", registro.fecha],
                ["Tipo de Camión", registro.tipoCamion],
                ["Tarimas Enviadas", registro.tarimas],
                ["Proveedor", registro.proveedor],
                ["Eslingas", registro.eslingas],
                ["Turno", registro.turno],
                ["Almacenista", registro.almacenista],
                ["Comentarios", registro.comentarios || "-"]
            ];

            datos.forEach(([clave, valor], i) => {
                const fila = i + 1;
                sheet.cell(`A${fila}`).value(clave).style({ bold: true, horizontalAlignment: "center", border: true });
                sheet.cell(`B${fila}`).value(valor).style({ horizontalAlignment: "justify", border: true });
            });

            sheet.column("A").width(20);
            sheet.column("B").width(40);

            return workbook.outputAsync();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${nombreBase}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        });
    });
});
