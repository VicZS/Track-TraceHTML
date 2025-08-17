document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registroForm');
    const crearBtn = document.getElementById('crearRegistroBtn');
    const tipoCamionSelect = document.getElementById('tipoCamion');
    const tarimasInput = document.getElementById('tarimas');
    const capacidadOcupadaLabel = document.getElementById('capacidadOcupada');
    const capacidadMaximaLabel = document.getElementById('capacidadMaxima');
    const panelCamion = document.getElementById('panelCamion');

    const proveedorInput = document.getElementById('proveedor');
    const eslingasInput = document.getElementById('eslingas');
    const turnoInput = document.getElementById('turno');
    const almacenistaInput = document.getElementById('almacenista');
    const comentariosInput = document.getElementById('comentarios');

    let espacios = 0;

    const configCamiones = {
        "CAM 3.5": { espacios: 6, capacidad: 3500 },
        "THORTON": { espacios: 10, capacidad: 12000 },
        "TRAILER RABON": { espacios: 24, capacidad: 18000 },
        "TRAILER 53": { espacios: 24, capacidad: 22000 },
    };

    const inputsRequeridos = [
        'fecha',
        'tipoCamion',
        'tarimas',
        'proveedor',
        'eslingas',
        'turno',
        'almacenista'
    ];

    function validarFormulario() {
        const todoLleno = inputsRequeridos.every(id => {
            const input = document.getElementById(id);
            return input && input.value.trim() !== '';
        });
        crearBtn.disabled = !todoLleno;
    }

    inputsRequeridos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', validarFormulario);
            input.addEventListener('change', validarFormulario);
        }
    });

    tipoCamionSelect.addEventListener('change', function () {
    const tipo = tipoCamionSelect.value;
    if (!configCamiones[tipo]){
        panelCamion.style.display = 'none';
        tarimasInput.value = '';
        capacidadMaximaLabel.textContent = '0 KG';
        capacidadOcupadaLabel.textContent = '0/0';
        deshabilitarInputs();
        return;
    }

    habilitarInputs();
        
    espacios = configCamiones[tipo].espacios;
    const maxTarimas = espacios * 3;

    tarimasInput.value = ''; 
    tarimasInput.max = maxTarimas;

    capacidadMaximaLabel.textContent = configCamiones[tipo].capacidad + ' KG';
    capacidadOcupadaLabel.textContent = `0/${maxTarimas}`;
    capacidadOcupadaLabel.style.color = 'black';

    generarCamion(espacios, 0);
    panelCamion.style.display = 'block';
    });

    tarimasInput.addEventListener('input', function () {
        const tarimas = parseInt(tarimasInput.value) || 0;
        const max = espacios * 3;

        capacidadOcupadaLabel.textContent = `${tarimas}/${max}`;

        const ratio = tarimas / max;
        if (ratio < 0.5) {
            capacidadOcupadaLabel.style.color = 'red';
        } else if (ratio < 0.9) {
            capacidadOcupadaLabel.style.color = 'orange';
        } else {
            capacidadOcupadaLabel.style.color = 'green';
        }

        generarCamion(espacios, tarimas);
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const data = {
            fecha: document.getElementById('fecha').value,
            tipoCamion: tipoCamionSelect.value,
            tarimas: parseInt(tarimasInput.value) || 0,
            proveedor: proveedorInput.value,
            eslingas: eslingasInput.value,
            turno: turnoInput.value,
            almacenista: almacenistaInput.value,
            comentarios: comentariosInput.value,
        };

        fetch('/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (!res.ok) throw new Error('Error en el servidor');
            return res.text();
        })
        .then(() => {
            alert('Registro creado exitosamente');
            form.reset();
            panelCamion.innerHTML = '';
            capacidadOcupadaLabel.textContent = '0/0';
            capacidadMaximaLabel.textContent = '0 KG';
            crearBtn.disabled = true;
            deshabilitarInputs();
        })
        .catch(error => {
            console.error('Error al guardar:', error);
            alert('Hubo un problema al guardar el registro');
        });
    });

    function deshabilitarInputs() {
        tarimasInput.disabled = true;
        proveedorInput.disabled = true;
        eslingasInput.disabled = true;
        turnoInput.disabled = true;
        almacenistaInput.disabled = true;
        comentariosInput.disabled = true;
    }

    function habilitarInputs() {
        tarimasInput.disabled = false;
        proveedorInput.disabled = false;
        eslingasInput.disabled = false;
        turnoInput.disabled = false;
        almacenistaInput.disabled = false;
        comentariosInput.disabled = false;
    }

    function generarCamion(espacios, tarimas) {
        panelCamion.innerHTML = '';
        const columnas = Math.ceil(espacios / 2);
        const distribucion = Array.from({ length: 2 }, () => Array(columnas).fill(0));

        let restante = tarimas;

        // Paso 1: colocar 1 tarima por espacio (de izq a der)
        outer1:
        for (let c = 0; c < columnas; c++) {
            for (let r = 0; r < 2; r++) {
                if (restante <= 0) break outer1;
                distribucion[r][c] = 1;
                restante--;
            }
        }

        // Paso 2 y 3: estibar hasta 3, en orden alternado para repartir mejor
        let niveles = 2;
        while (restante > 0 && niveles <= 3) {
            for (let c = 0; c < columnas && restante > 0; c++) { // ← cambio aquí
                for (let r = 0; r < 2 && restante > 0; r++) {     // ← también aquí
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
});
