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
                        <td><button class="btn-pdf" onclick="generatePDF(${escapeHtml(id)});">PDF</button></td>
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
        console.log("Cotización encontrada para editar huevos:", cotizacion);
        if (cotizacion) {

            // VERIFICAR SI LA COTIZACIÓN ESTÁ ACEPTADA
            if (cotizacion.estado === 'Aceptada' || cotizacion.estado === 'Cancelada') {
                alert('No se puede editar los detalles de la cotización que ya ha sido Aceptada.');
                
                // Deshabilitar el botón Guardar
                const guardarBtn = document.querySelector('button[onclick*="save_d_ct"]');
                if (guardarBtn) {
                    guardarBtn.disabled = true;
                    guardarBtn.style.opacity = '0.6';
                    guardarBtn.style.cursor = 'not-allowed';
                }
                
                // También deshabilitar otros controles para mayor seguridad
                document.getElementById('select_status').disabled = true;
                document.getElementById('select_usuario').disabled = true;
                document.getElementById('cliente_select').disabled = true;
                document.getElementById('fecha_cotizacion').disabled = true;
                
                // Deshabilitar la tabla de productos si existe
                const productosTable = document.querySelector('.products-table');
                if (productosTable) {
                    const inputs = productosTable.querySelectorAll('input, select, button');
                    inputs.forEach(input => {
                        input.disabled = true;
                    });
                }
           }

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
                                    data-existencia="${prod.piezas_disponibles || 0}"
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
                                    <input type="number" class="input-number" value="${detalle.cantidad}" min="1" onchange="validateQuantity(this)">                                
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
            console.log("DAta",productos);
            const tableBody = document.querySelector('.products-table tbody');
            const newRow = document.createElement('tr');
            
            // Create the select options HTML
            const productOptions = productos.map(prod => 
                `<option value="${prod.id_producto}" 
                         data-precio="${prod.precio_producto}"
                         data-existencia="${prod.piezas_disponibles || 0}">
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
                    <input type="number" class="input-number" value="1" min="1" onchange="validateQuantity(this)">
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

function validateQuantity(inputElement) {
    const row = inputElement.closest('tr');
    const cantidad = parseInt(inputElement.value);
    const selectElement = row.querySelector('.input-select');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    if (selectedOption && selectedOption.value !== '0') {
        const existencia = parseInt(selectedOption.dataset.existencia) || 0;
        
        if (cantidad > existencia) {
            alert(`⚠️ Advertencia: La cantidad solicitada (${cantidad}) excede las existencias disponibles (${existencia})`);
            // Opcional: ajustar automáticamente a la existencia máxima
            inputElement.value = existencia;
        }
    }
    // Llamar a calculateRowTotal para actualizar los cálculos
    calculateRowTotal(inputElement);
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
    const existencia = selectedOption.dataset.existencia || 0;
    
    row.querySelector('.precio-unitario').textContent = `$${parseFloat(precio).toFixed(2)}`;
    
    // Validar la cantidad actual contra la existencia
    const inputElement = row.querySelector('.input-number');
    const cantidadActual = parseInt(inputElement.value);
    
    if (cantidadActual > parseInt(existencia)) {
        alert(`⚠️ Advertencia: La cantidad actual (${cantidadActual}) excede las existencias disponibles (${existencia})`);
        // Opcional: ajustar automáticamente a la existencia máxima
        // inputElement.value = existencia;
    }
    
    calculateRowTotal(inputElement);
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


// ...existing code...

// Carga dinámica de librerías (html2canvas y jsPDF desde CDN si no están cargadas)
async function loadExternalScripts() {
    if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }
    if (!window.jspdf) {
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }
}

// Genera el PDF de la cotización (obtiene detalles, renderiza HTML oculto, captura con html2canvas y guarda con jsPDF)
async function generatePDF(id_cotizacion) {
    try {
        await loadExternalScripts();

        // Buscar datos básicos en memoria
        const cot = results.find(c => c.id_cotizacion === id_cotizacion) || {};

        // Obtener detalles (productos)
        const resp = await fetch(`http://localhost:3000/api/ctz/get_detalle/${id_cotizacion}`);
        const detallesJson = resp.ok ? await resp.json() : { results: [] };
        const detalles = detallesJson.results || [];

        // Construir HTML temporal
        const html = buildCotizacionHTML(cot, detalles);
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.left = '-10000px';
        wrapper.style.top = '0';
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper);

        // Capturar con html2canvas
        const canvas = await window.html2canvas(wrapper, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        // Crear PDF y añadir imagen escalada a ancho de página A4
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const pdfWidth = pageWidth - margin * 2;

        // Obtener dimensiones reales de la imagen para mantener proporción
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Si la altura excede una página, se añade la imagen escalada en la primera página.
        // (Para documentos largos, se puede implementar paginación por partes del canvas).
        pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);

        pdf.save(`cotizacion_${id_cotizacion}.pdf`);

        wrapper.remove();
    } catch (error) {
        console.error('Error generando PDF:', error);
        alert('Ocurrió un error al generar el PDF');
    }
}

function formatCurrency(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' });
}

function buildCotizacionHTML(cot, detalles) {
    const rows = detalles.map(d => {
        const modelo = escapeHtml(d.modelo || d.modelo_producto || '');
        const cantidad = Number(d.cantidad || 0);
        const precio = Number(d.precio_unitario || d.precio_producto || 0);
        const total = cantidad * precio;
        return `<tr>
            <td class="text-left product-name">${modelo}</td>
            <td class="text-center">${cantidad}</td>
            <td class="text-right">${formatCurrency(precio)}</td>
            <td class="text-right amount">${formatCurrency(total)}</td>
        </tr>`;
    }).join('');

    const subtotal = Number(cot.subtotal || 0);
    const iva = Number(cot.iva || 0);
    const total = Number(cot.total || (subtotal + iva));

    return `
    <div class="cot-wrapper" style="width:800px; margin:0;">
        <style>
        :root {
            --primary: #1673e8;
            --primary-dark: #0d47a1;
            --accent: #7b2cff;
            --success: #10b981;
            --background: #ffffff;
            --surface: #f8fafc;
            --border: #e2e8f0;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --text-muted: #94a3b8;
        }
        
        body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            color: var(--text-primary); 
            background: white; 
            line-height: 1.5;
        }
        
        .cot-container { 
            width: 800px; 
            margin: 0 auto; 
            padding: 24px; 
            font-size: 14px; 
            background: var(--background); 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
            position: relative;
        }
        
        /* Header con logo GRANDE */
        .header { 
            margin-bottom: 24px; 
            padding: 0;
            background: var(--background); 
            border-radius: 8px;
            display: flex; 
            align-items: flex-start; 
            gap: 24px; 
            border-bottom: 2px solid var(--primary);
            padding-bottom: 20px;
        }
        
        .brand { 
            display: flex; 
            align-items: center; 
            gap: 24px; 
            flex: 1; 
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
        }
        
        .logo-img { 
            width: 120px;
            height: auto; 
            display: block;
            border-radius: 4px;
        }
        
        .title-block { 
            flex: 1; 
            padding-left: 8px;
            border-left: 2px solid var(--border);
        }
        
        h1 { 
            margin: 0 0 6px 0; 
            font-size: 32px;
            color: var(--primary-dark); 
            font-weight: 800;
            letter-spacing: -0.5px;
        }
        
        .company-subtitle {
            margin: 0;
            font-size: 16px;
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .document-info {
            background: var(--surface);
            padding: 16px;
            border-radius: 6px;
            min-width: 200px;
            border: 1px solid var(--border);
        }
        
        .info-row { 
            display: flex; 
            justify-content: space-between;
            margin-bottom: 6px; 
            font-size: 13px; 
        }
        
        .info-label { 
            font-weight: 600; 
            color: var(--text-secondary);
        }
        
        .info-value {
            color: var(--text-primary);
            font-weight: 500;
        }
        
        /* Sección cliente */
        .client-section {
            background: var(--surface);
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid var(--primary);
        }
        
        .client-label {
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 4px;
            font-size: 13px;
        }
        
        .client-name {
            font-weight: 700;
            color: var(--text-primary);
            font-size: 16px;
        }
        
        /* Tabla mejorada */
        table { 
            width: 100%; 
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 32px; 
            font-size: 13px; 
            background: var(--background);
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        thead th { 
            background: var(--primary); 
            color: #fff; 
            padding: 12px 16px; 
            text-align: left; 
            font-weight: 600;
            border: none;
            font-size: 13px;
        }
        
        th:first-child { border-radius: 6px 0 0 0; }
        th:last-child { border-radius: 0 6px 0 0; }
        
        tbody tr { 
            transition: background-color 0.15s ease;
        }
        
        tbody tr:nth-child(even) { 
            background: var(--surface); 
        }
        
        tbody tr:hover {
            background: #f1f5f9;
        }
        
        th, td { 
            border: none; 
            padding: 12px 16px; 
            vertical-align: middle; 
        }
        
        td { 
            color: var(--text-primary); 
        }
        
        .product-name {
            font-weight: 500;
        }
        
        .amount {
            font-weight: 600;
            color: var(--primary-dark);
        }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        
        /* Totales mejorados */
        .total-section { 
            text-align: right; 
            margin-top: 20px; 
            font-size: 15px; 
            background: var(--surface);
            padding: 20px;
            border-radius: 6px;
            border: 1px solid var(--border);
        }
        
        .total-amount { 
            font-weight: 800; 
            font-size: 20px; 
            color: var(--primary-dark); 
            margin-top: 8px; 
            padding-top: 12px;
            border-top: 2px solid var(--border);
        }
        
        .total-line { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
            max-width: 300px;
            margin-left: auto;
        }
        
        /* Observaciones mejoradas */
        .observations { 
            margin-top: 32px; 
            padding: 20px;
            background: var(--surface);
            border-radius: 6px;
            border-left: 4px solid var(--accent);
        }
        
        .observations-title { 
            font-weight: 700; 
            margin-bottom: 12px; 
            color: var(--text-primary);
            font-size: 15px;
        }
        
        /* Footer con patrón decorativo */
        .footer { 
            margin-top: 40px;
            font-size: 12px; 
            text-align: center; 
            padding: 24px 0 0 0;
            color: var(--text-muted);
            position: relative;
        }
        
        .footer-pattern {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 20px;
            opacity: 0.1;
            background: linear-gradient(45deg, var(--primary) 25%, transparent 25%), 
                        linear-gradient(-45deg, var(--primary) 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, var(--primary) 75%), 
                        linear-gradient(-45deg, transparent 75%, var(--primary) 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        
        .footer-content {
            position: relative;
            z-index: 2;
            padding-bottom: 30px;
        }
        
        .divider {
            border-top: 1px solid var(--border);
            margin: 12px 0;
        }
        
        .thank-you {
            font-style: italic;
            margin-top: 8px;
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .contact-info {
            margin-top: 8px;
            font-size: 11px;
            color: var(--text-muted);
        }
        
        @media print { 
            .cot-container { 
                box-shadow: none; 
                padding: 0;
            }
            .footer-pattern {
                opacity: 0.05;
            }
        }
        </style>

        <div class="cot-container">
            <div class="header">
                <div class="brand">
                    <div class="logo-container">
                        <img src="IMG/LOGOLodin.png" alt="LODIN" class="logo-img" />
                    </div>
                    <div class="title-block">
                        <h1>COTIZACIÓN</h1>
                    </div>
                </div>
                <div class="document-info">
                    <div class="info-row">
                        <span class="info-label">Fecha:</span>
                        <span class="info-value">${escapeHtml(cot.fecha_creacion)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Vendedor:</span>
                        <span class="info-value">${escapeHtml(cot.nombre_usuario)}</span>
                    </div>
                    ${cot.id_cotizacion ? `<div class="info-row">
                        <span class="info-label">Folio:</span>
                        <span class="info-value">${String(cot.id_cotizacion).padStart(6, '0')}</span>
                    </div>` : ''}
                </div>
            </div>

            <div class="client-section">
                <div class="client-label">CLIENTE</div>
                <div class="client-name">${escapeHtml(cot.nombre_cliente)}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th class="text-left">Producto / Modelo</th>
                        <th class="text-center">Cantidad</th>
                        <th class="text-right">Precio Unitario</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-line">
                    <span><strong>Subtotal:</strong></span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                <div class="total-line">
                    <span><strong>IVA:</strong></span>
                    <span>${formatCurrency(iva)}</span>
                </div>
                <div class="total-line total-amount">
                    <span><strong>TOTAL:</strong></span>
                    <span>${formatCurrency(total)}</span>
                </div>
            </div>

            ${cot.observaciones ? `
            <div class="observations">
                <div class="observations-title">Observaciones:</div>
                <div>${escapeHtml(cot.observaciones)}</div>
            </div>
            ` : ''}

            <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
            <div class="footer">
                <div class="footer-content">
                    <div class="divider"></div>
                    <div>${escapeHtml(cot.nombre_usuario)} • Lodin</div>
                    <div class="thank-you">¡Gracias por su preferencia!</div>
                    <div class="contact-info">
                        www.lodin.com • contacto@lodin.com • Tel: (555) 123-4567
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}