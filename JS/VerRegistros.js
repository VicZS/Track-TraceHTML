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

    fetch('/registros')
        .then(res => {
            if (!res.ok) throw new Error('Error al obtener registros');
            return res.json();
        })
        .then(data => {
            // 🔹 Ordenar descendente por ID (mayor ID primero)
            registros = data.map((r, i) => ({ id: i + 1, ...r }))
                .sort((a, b) => b.id - a.id);
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
    

    // 🔹 Exportar un solo registro en formato uniforme
    function exportarRegistroExcel(registro) {
        const capacidad = (configCamiones[registro.tipoCamion]?.espacios || 1) * 3;
        const porcentaje = ((registro.tarimas / capacidad) * 100).toFixed(2) + "%";

        const headers = ["ID", "Fecha", "Tipo de Camión", "Tarimas Enviadas", "Proveedor", "Eslingas", "Turno", "Almacenista", "Comentarios", "Porcentaje Ocupación"];
        const valores = [
            registro.id,
            registro.fecha,
            registro.tipoCamion,
            registro.tarimas,
            registro.proveedor,
            registro.eslingas,
            registro.turno,
            registro.almacenista,
            registro.comentarios || "-",
            porcentaje
        ];

        return XlsxPopulate.fromBlankAsync().then(workbook => {
            const sheet = workbook.sheet("Sheet1");
            headers.forEach((h, i) => sheet.cell(1, i + 1).value(h).style({ bold: true, border: true, horizontalAlignment: "center" }));
            valores.forEach((v, i) => sheet.cell(2, i + 1).value(v).style({ border: true, horizontalAlignment: "center" }));
            headers.forEach((_, i) => sheet.column(i + 1).width(22));
            return workbook.outputAsync();
        });
    }

    document.getElementById("exportarExcel").addEventListener("click", function () {
        const selectedIndex = registroSelect.value;
        if (selectedIndex === '') return alert("Selecciona un registro primero");
        const registro = registros[selectedIndex];
        exportarRegistroExcel(registro).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Reporte del dia ${registro.fecha}.xlsx`; // 🔹 nombre uniforme
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        });
    });

    // Referencias
    const filtroReporte = document.getElementById("filtroReporte");
    const filtrosRango = document.getElementById("filtrosRango");
    const generarReporteExcel = document.getElementById("generarReporteExcel");
    const fechaInicio = document.getElementById("fechaInicio");
    const fechaFin = document.getElementById("fechaFin");

    // Mostrar/Ocultar filtros según selección
    filtroReporte.addEventListener("change", () => {
        if (filtroReporte.value === "rango") {
            filtrosRango.style.display = "flex";
            generarReporteExcel.disabled = true; 
        } else if (filtroReporte.value !== "") {
            filtrosRango.style.display = "none";
            generarReporteExcel.disabled = false; // habilitar el botón
        } else {
            filtrosRango.style.display = "none";
            generarReporteExcel.disabled = true;
        }
    });

    // Validar fechas en rango
    function validarRango() {
        if (fechaInicio.value && fechaFin.value) {
            generarReporteExcel.disabled = false;
        } else {
            generarReporteExcel.disabled = true;
        }
    }

    fechaInicio.addEventListener("change", validarRango);
    fechaFin.addEventListener("change", validarRango);


    function parseFecha(fechaStr) {
        // Aseguramos formato YYYY-MM-DD
        const [year, month, day] = fechaStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    function filtrarRegistrosPorFecha() {
        const hoy = new Date();
        let inicio, fin;

        switch (filtroReporte.value) {
            case "dia":
                inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
                fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
                break;

            case "semana":
                const primerDia = new Date(hoy);
                primerDia.setDate(hoy.getDate() - hoy.getDay()); // domingo
                inicio = new Date(primerDia.getFullYear(), primerDia.getMonth(), primerDia.getDate(), 0, 0, 0);
                fin = new Date(inicio);
                fin.setDate(inicio.getDate() + 6);
                fin.setHours(23,59,59);
                break;

            case "mes":
                inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0);
                fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
                break;

            case "rango":
                const iniStr = document.getElementById("fechaInicio").value;
                const finStr = document.getElementById("fechaFin").value;
                if (!iniStr || !finStr) return [];
                inicio = parseFecha(iniStr);
                fin = parseFecha(finStr);
                fin.setHours(23,59,59);
                break;

            default:
                return [];
        }

        return registros.filter(r => {
            const fechaR = parseFecha(r.fecha);
            return fechaR >= inicio && fechaR <= fin;
        }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // orden descendente
    }

    generarReporteExcel.addEventListener("click", function () {
        const registrosFiltrados = filtrarRegistrosPorFecha();
        if (registrosFiltrados.length === 0) return alert("No hay registros para este rango");

        // 🔹 Definir nombre de archivo
        const hoy = new Date();
        let nombreArchivo = "Reporte";
        const opcionesMes = { month: "long" };
        const opcionesDia = { day: "2-digit", month: "2-digit", year: "numeric" };

        switch (filtroReporte.value) {
            case "dia":
                nombreArchivo = `Reporte del dia ${hoy.toLocaleDateString("es-MX", opcionesDia)}`;
                break;
            case "semana":
                const numeroSemana = Math.ceil(((hoy - new Date(hoy.getFullYear(),0,1)) / 86400000 + new Date(hoy.getFullYear(),0,1).getDay()+1) / 7);
                nombreArchivo = `Reporte de la semana ${numeroSemana}`;
                break;
            case "mes":
                nombreArchivo = `Reporte del mes de ${hoy.toLocaleDateString("es-MX", opcionesMes)} de ${hoy.getFullYear()}`;
                break;
            case "rango":
                const iniStr = document.getElementById("fechaInicio").value;
                const finStr = document.getElementById("fechaFin").value;
                const iniFecha = parseFecha(iniStr).toLocaleDateString("es-MX", opcionesDia);
                const finFecha = parseFecha(finStr).toLocaleDateString("es-MX", opcionesDia);
                nombreArchivo = `Reporte del dia ${iniFecha} al dia ${finFecha}`;
                break;
        }

        XlsxPopulate.fromBlankAsync()
            .then(workbook => {
                const sheet = workbook.sheet("Sheet1");

                // Encabezados
                const headers = ["ID", "Fecha", "Tipo de Camión", "Tarimas Enviadas", "Proveedor", "Eslingas", "Turno", "Almacenista", "Comentarios", "Porcentaje Ocupación"];
                headers.forEach((h, i) => {
                    const cell = sheet.cell(1, i + 1);
                    cell.value(h).style({ bold: true, horizontalAlignment: "center", border: true });
                });

                // Filas
                registrosFiltrados.forEach((registro, idx) => {
                    const fila = idx + 2;
                    const capacidad = (configCamiones[registro.tipoCamion]?.espacios || 1) * 3; // 🔹 considerar 3 niveles
                    const porcentaje = ((registro.tarimas / capacidad) * 100).toFixed(2) + "%";

                    const valores = [
                        registro.id,
                        registro.fecha,
                        registro.tipoCamion,
                        registro.tarimas,
                        registro.proveedor,
                        registro.eslingas,
                        registro.turno,
                        registro.almacenista,
                        registro.comentarios || "-",
                        porcentaje
                    ];

                    valores.forEach((valor, col) => {
                        sheet.cell(fila, col + 1).value(valor).style({ border: true, horizontalAlignment: "center" });
                    });
                });

                headers.forEach((_, i) => sheet.column(i + 1).width(22));

                return workbook.outputAsync();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${nombreArchivo}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            });
    });

    document.getElementById("exportarTodosExcel").addEventListener("click", function () {
        if (registros.length === 0) return alert("No hay registros para exportar");

        const nombreArchivo = "Reporte completo";

        XlsxPopulate.fromBlankAsync()
            .then(workbook => {
                const sheet = workbook.sheet("Sheet1");

                const headers = ["ID", "Fecha", "Tipo de Camión", "Tarimas Enviadas", "Proveedor", "Eslingas", "Turno", "Almacenista", "Comentarios", "Porcentaje Ocupación"];
                headers.forEach((h, i) => {
                    sheet.cell(1, i + 1).value(h).style({ bold: true, horizontalAlignment: "center", border: true });
                });

                registros.forEach((registro, idx) => {
                    const fila = idx + 2;
                    const capacidad = (configCamiones[registro.tipoCamion]?.espacios || 1) * 3;
                    const porcentaje = ((registro.tarimas / capacidad) * 100).toFixed(2) + "%";

                    const valores = [
                        registro.id,
                        registro.fecha,
                        registro.tipoCamion,
                        registro.tarimas,
                        registro.proveedor,
                        registro.eslingas,
                        registro.turno,
                        registro.almacenista,
                        registro.comentarios || "-",
                        porcentaje
                    ];

                    valores.forEach((valor, col) => {
                        sheet.cell(fila, col + 1).value(valor).style({ border: true, horizontalAlignment: "center" });
                    });
                });

                headers.forEach((_, i) => sheet.column(i + 1).width(22));

                return workbook.outputAsync();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${nombreArchivo}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            });
    });

});
