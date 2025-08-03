document.addEventListener('DOMContentLoaded', function () {
      const registroSelect = document.getElementById('registroSelect');
      const detalle = document.getElementById('detalleRegistro');
      const registros = JSON.parse(localStorage.getItem("registros")) || [];

      const configCamiones = {
        "CAM 3.5": { espacios: 6 },
        "THORTON": { espacios: 10 },
        "TRAILER RABON": { espacios: 24 },
        "TRAILER 53": { espacios: 24 },
      };

      registros.forEach((registro, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${registro.fecha} - ${registro.tipoCamion}`;
        registroSelect.appendChild(option);
      });

      registroSelect.addEventListener('change', function () {
        const selectedIndex = this.value;
        if (selectedIndex === '') {
          detalle.style.display = 'none';
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
      });

      function generarVisualizacionCamion(espacios, tarimas) {
        const panelCamion = document.getElementById('panelCamion');
        panelCamion.innerHTML = '';

        const columnas = Math.ceil(espacios / 2);
        const distribucion = Array.from({ length: 2 }, () => Array(columnas).fill(0));

        let restante = tarimas;

        // Paso 1: colocar 1 tarima por espacio
        outer1:
        for (let c = 0; c < columnas; c++) {
          for (let r = 0; r < 2; r++) {
            if (restante <= 0) break outer1;
            distribucion[r][c] = 1;
            restante--;
          }
        }

        // Paso 2-3: estibar hasta 3
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
    });