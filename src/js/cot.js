const API_URL = 'http://localhost:3000/api/ctz/cotiz';

let results = [];

function escapeHtml(str){
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function list_cot(){
    console.log('Cargando cotizaciones...');
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        const body = document.getElementById('cotizacionesBody');

        if (response.ok) {
            results = data.results || [];


            if (results.length === 0) {
                body.innerHTML = '<tr><td colspan="9">No hay cotizaciones disponibles</td></tr>';
            } else {
                body.innerHTML = results.map(item => {
                    const {id_cotizacion: id, 
                        fecha_creacion: fecha, 
                        nombre_cliente: cliente, 
                        nombre_usuario: usuario, 
                        subtotal, 
                        iva, 
                        total, 
                        estado} = item;

                    return `<tr>
                        <td><button class="btn-pdf" onclick="">PDF</button></td>
                        <td>${escapeHtml(id)}</td>
                        <td>${escapeHtml(fecha)}</td>
                        <td>${escapeHtml(cliente)}</td>
                        <td>${escapeHtml(usuario)}</td>
                        <td>${escapeHtml(subtotal)}</td>
                        <td>${escapeHtml(iva)}</td>
                        <td>${escapeHtml(total)}</td>
                        <td>${escapeHtml(estado)}</td>
                        <td><button class="btn-editar" onclick="agregarCotizacion(${escapeHtml(id)});">Editar</button></td>
                    </tr>`;
                }).join('');
            }
            } else {
            body.innerHTML = '<tr><td colspan="9">No hay productos</td></tr>';
        }
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {       
    list_cot();
});

async function agregarCotizacion(id_cotizacion) {
    document.getElementById("i_d_cotizaciones").style.display = "block";
    document.getElementById("listadoCotizaciones").style.display = "none";

    const response = await fetch('http://localhost:3000/api/ctz/cb_cli', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if(response.ok){
        let res_cli = [];
        const data_cli = await response.json();
        res_cli = data_cli.results || [];
        const selectCli = document.getElementById("cliente_select");
        selectCli.innerHTML = '<option value="0">Seleccione una opción</option>';
        
        res_cli.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id_cliente;
            option.text = item.nombre_cliente;
            selectCli.appendChild(option);
        });
    }

     const response_usr = await fetch('http://localhost:3000/api/ctz/cb_usr', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if(response_usr.ok){
        let res_usr = [];
        const data_usr = await response_usr.json();
        res_usr = data_usr.results || [];
        const selectUsr = document.getElementById("select_usuario");
        selectUsr.innerHTML = '<option value="0">Seleccione una opción</option>';
        
        res_usr.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id_usuario;
            option.text = item.nombre_usuario;
            selectUsr.appendChild(option);
        });
    }

    if (id_cotizacion) {
        const cotizacion = results.find(cot => cot.id_cotizacion === id_cotizacion);
        console.log("Cotización encontrada para editar:", cotizacion);
        if (cotizacion) {
            const clienteSelect = document.getElementById('cliente_select');
            Array.from(clienteSelect.options).forEach(option => {
                if (option.text === cotizacion.nombre_cliente) {
                    option.selected = true;
                }
            });

            const usuarioSelect = document.getElementById('select_usuario');
            Array.from(usuarioSelect.options).forEach(option => {
                if (option.text === cotizacion.nombre_usuario) {
                    option.selected = true;
                }
            });

            document.getElementById('fecha_cotizacion').value = cotizacion.fecha_creacion || '';

            document.getElementById('status_group').classList.add('visible');
            document.getElementById('select_status').value = cotizacion.estado || '0';
            document.getElementById('id_cotizacion').value = cotizacion.id_cotizacion || '';
            document.getElementById('select_status').disabled = false;
            
            document.getElementById('select_usuario').disabled = true;
            document.getElementById('cliente_select').disabled = true;
            document.getElementById('fecha_cotizacion').disabled = true;
            
            try {
                const response = await fetch(`http://localhost:3000/api/ctz/get_detalle/${id_cotizacion}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const detalles = await response.json();
                    
                    // Obtener productos para el select
                    const responseProd = await fetch('http://localhost:3000/api/ctz/cb_prod', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    });

                    if (responseProd.ok) {
                        const dataProd = await responseProd.json();
                        const productos = dataProd.results || [];
                        const tableBody = document.querySelector('.products-table tbody');
                        tableBody.innerHTML = ''; // Limpiar tabla existente

                        // Agregar cada detalle como una fila
                        detalles.results.forEach(detalle => {
                            const productOptions = productos.map(prod => 
                                `<option value="${prod.id_producto}" 
                                    data-precio="${prod.precio_producto}"
                                    ${prod.id_producto === detalle.id_producto ? 'selected' : ''}>
                                    ${prod.modelo_producto}
                                </option>`
                            ).join('');

                            const newRow = document.createElement('tr');
                            newRow.innerHTML = `
                                <td><button type="button" class="btn-white" onclick="deleteRow(event, this)">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button></td>
                                <td>
                                    <select class="input-select" onchange="updatePrice(this)">
                                        <option value="0">Seleccione un producto</option>
                                        ${productOptions}
                                    </select>
                                </td>
                                <td>
                                    <input type="number" class="input-number" value="${detalle.cantidad}" min="1" onchange="calculateRowTotal(this)">
                                </td>
                                <td class="precio-unitario">$${detalle.precio_unitario || '0.00'}</td>
                                <td class="total-row">$${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}</td>
                            `;
                            
                            tableBody.appendChild(newRow);
                        });

                        // Calcular totales
                        calculateTotals();
                    }
                }
            } catch (error) {
                console.error('Error al cargar detalles:', error);
            }
            document.getElementById('detalle_cotizacion').style.display = 'block';
            
        }
        document.getElementById('id_cotizacion').value = id_cotizacion;
    } else {
            document.getElementById('select_status').value = 'Pendiente';
            document.getElementById('select_status').disabled = true;
            document.getElementById('select_usuario').disabled = false;
            document.getElementById('cliente_select').disabled = false;
            document.getElementById('fecha_cotizacion').disabled = false;
            document.getElementById('detalle_cotizacion').style.display = 'none';
            document.getElementById('id_cotizacion').value = null; 
        }
}


document.getElementById('cancelarBtn_cot').addEventListener('click', () => {
    document.getElementById("i_d_cotizaciones").style.display = "none";
    document.getElementById("listadoCotizaciones").style.display = "block";
    document.getElementById("campos_productos").reset();
    document.getElementById('id_cotizacion').value = ''; // Limpiar ID
});

document.getElementById('cancelarBtn_d_cot').addEventListener('click', () => {
    document.getElementById("i_d_cotizaciones").style.display = "none";
    document.getElementById("listadoCotizaciones").style.display = "block";
    document.querySelector('.products-table tbody').innerHTML = '';
    document.getElementById("campos_productos").reset();
    document.getElementById('id_cotizacion').value = ''; // Limpiar ID
});

document.getElementById('guardarBtn_cot').addEventListener('click', async () => {
    const clienteId = document.getElementById('cliente_select').value;
    const usuarioId = document.getElementById('select_usuario').value;
    const fecha_creacion = document.getElementById('fecha_cotizacion').value;
    const id_cotizacion = document.getElementById('id_cotizacion').value;

    const nuevoCotizacion = {
        id_cliente: clienteId,
        id_usuario: usuarioId,
        fecha_creacion: fecha_creacion
    };
    console.log('Datos de cotización a guardar:', nuevoCotizacion);
    if(id_cotizacion){
        try{
            const response = await fetch('http://localhost:3000/api/ctz/update_ct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...nuevoCotizacion,
                    id_cotizacion: id_cotizacion,
                    estado: document.getElementById('select_status').value
                })
            });

            if (response.ok) {
                alert('Cotización actualizada exitosamente');
                document.getElementById("i_d_cotizaciones").style.display = "none";
                document.getElementById("listadoCotizaciones").style.display = "block";
                document.getElementById("campos_productos").reset();
                list_cot();
            } else {
                alert('Error al actualizar la cotización');
            }
        } catch (error) {   
             console.error('Error:', error);
        }
    }else{
        try {
            const response = await fetch('http://localhost:3000/api/ctz/save_ct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoCotizacion)
            });

            if (response.ok) {
                alert('Cotización agregada exitosamente');
                document.getElementById("i_d_cotizaciones").style.display = "none";
                document.getElementById("listadoCotizaciones").style.display = "block";
                document.getElementById("campos_productos").reset();
                list_cot();
            } else {
                alert('Error al agregar la cotización');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

});

async function addColumn(event) { 
    event.preventDefault(); // Previene el comportamiento por defecto
    try {
        const response = await fetch('http://localhost:3000/api/ctz/cb_prod', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if(response.ok){
            const data = await response.json();
            const productos = data.results || [];
            
            const tableBody = document.querySelector('.products-table tbody');
            const newRow = document.createElement('tr');
            
            // Create the select options HTML
            const productOptions = productos.map(prod => 
                `<option value="${prod.id_producto}" 
                         data-precio="${prod.precio_producto}">
                    ${prod.modelo_producto}
                </option>`
            ).join('');

            newRow.innerHTML = `
                <td><button type="button" class="btn-white" onclick="deleteRow(event, this)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button></td>
                <td>
                    <select class="input-select" onchange="updatePrice(this)">
                        <option value="0">Seleccione un producto</option>
                        ${productOptions}
                    </select>
                </td>
                <td>
                    <input type="number" class="input-number" value="1" min="1" onchange="calculateRowTotal(this)">
                </td>
                <td class="precio-unitario">$0.00</td>
                <td class="total-row">$0.00</td>
            `;
            
            tableBody.appendChild(newRow);
        } else {
            console.error('Error fetching products');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function deleteRow(event, button) {
    // Check if both event and button are provided
    if (!event || !button) {
        return;
    }
    
    event.preventDefault();
    const row = button.closest('tr');
    if (row) {
        row.remove();
        // Optional: Add code here to recalculate totals
    }
}

function updatePrice(selectElement) {
    const row = selectElement.closest('tr');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const precio = selectedOption.dataset.precio || 0;
    
    row.querySelector('.precio-unitario').textContent = `$${parseFloat(precio).toFixed(2)}`;
    calculateRowTotal(row.querySelector('.input-number'));
    calculateTotals();
}

function calculateRowTotal(inputElement) {
    const row = inputElement.closest('tr');
    const cantidad = parseFloat(inputElement.value);
    const precioUnitario = parseFloat(row.querySelector('.precio-unitario').textContent.replace('$', '')) || 0;
    const total = cantidad * precioUnitario;
    
    row.querySelector('.total-row').textContent = `$${total.toFixed(2)}`;
    calculateTotals();
}

function calculateTotals() {
    const rows = document.querySelectorAll('.products-table tbody tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        const totalStr = row.querySelector('.total-row').textContent.replace('$', '');
        subtotal += parseFloat(totalStr) || 0;
    });
    
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    
    document.querySelector('.totals-section .total-row:nth-child(1) .total-value').textContent = `$${subtotal.toFixed(2)}`;
    document.querySelector('.totals-section .total-row:nth-child(2) .total-value').textContent = `$${iva.toFixed(2)}`;
    document.querySelector('.totals-section .total-row:nth-child(3) .total-value').textContent = `$${total.toFixed(2)}`;
}


async function save_d_ct() {
    const id_cotizacion = document.getElementById('id_cotizacion').value;
    const productosData = getTableData();
    const totalesData = getTotalsData();

    try {
        const response = await fetch('http://localhost:3000/api/ctz/save_d_ct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_cotizacion: id_cotizacion,
                productos: productosData.productos,
                totales: totalesData
            })
        });

        if (response.ok) {
            alert('Detalle de cotización guardado exitosamente');
            document.getElementById("i_d_cotizaciones").style.display = "none";
            document.getElementById("listadoCotizaciones").style.display = "block";
            document.querySelector('.products-table tbody').innerHTML = '';
            document.getElementById("campos_productos").reset();
            document.getElementById('id_cotizacion').value = '';
            list_cot();
        } else {
            alert('Error al guardar el detalle de la cotización');
        }
    } catch (error) {
        console.error('Error:', error);
    }


}

function getTableData() {
    const rows = document.querySelectorAll('.products-table tbody tr');
    const productos = [];
    
    rows.forEach(row => {
        const cantidad = row.querySelector('.input-number').value;
        const select = row.querySelector('.input-select');
        const id_producto = select.value;
        
        if (id_producto !== '0') {
            productos.push({
                id_producto: parseInt(id_producto),
                cantidad: parseInt(cantidad)
            });
        }
    });

    return {
        productos: productos
    };
}

function getTotalsData() {
    const subtotal = document.querySelector('.totals-section .total-row:nth-child(1) .total-value').textContent.replace('$', '');
    const iva = document.querySelector('.totals-section .total-row:nth-child(2) .total-value').textContent.replace('$', '');
    const total = document.querySelector('.totals-section .total-row:nth-child(3) .total-value').textContent.replace('$', '');

    return {
        subtotal: parseFloat(subtotal),
        iva: parseFloat(iva),
        total: parseFloat(total)
    };
}
