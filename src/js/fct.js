const API_URL = 'http://localhost:3000/api/fact/list_fct';

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

async function pt_fct(){
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        const body = document.getElementById('facturaBody');

        if (response.ok) {
            results = data.results || [];


            if (results.length === 0) {
                body.innerHTML = '<tr><td colspan="7">No hay facturas disponibles</td></tr>';
            } else {
                body.innerHTML = results.map(item => {
                    const {
                        id_factura,
                        nombre_cliente,
                        subtotal,
                        iva,
                        total,
                        fecha_emision
                    } = item;

                    return `<tr>
                        <td>${escapeHtml(id_factura)}</td>
                        <td>${escapeHtml(nombre_cliente)}</td>
                        <td>${formatCurrency(subtotal)}</td>
                        <td>${formatCurrency(iva)}</td>
                        <td>${formatCurrency(total)}</td>
                        <td>${escapeHtml(fecha_emision)}</td>
                        <td><button class="btn-pdf" onclick="generatePDF_fct(${id_factura});">PDF</button></td>
                    </tr>`;
                }).join('');
            }
            } else {
            body.innerHTML = '<tr><td colspan="7">No hay facturas</td></tr>';
        }
    } catch (error) {
        console.error(error);
    }
}

async function agregarFactura(){
    console.log("Facturando y mostrando");
    document.getElementById("i_d_facturas").style.display = "block";
    document.getElementById("listadoFacturacion").style.display = "none";

    try{
        const response = await fetch('http://localhost:3000/api/fact/cb_vta_fct', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },

        });

        if(response.ok){
            let res_vta = [];
            const data_vta = await response.json();
            res_vta = data_vta.results || [];
            
            const selectVta = document.getElementById("select_vta_fct");
            selectVta.innerHTML = '<option value="0">Seleccione una opción</option>';
            res_vta.forEach(item => {
                const option = document.createElement("option");
                option.value = item.ID_VENTA;
                option.text = item.ID_VENTA;
                selectVta.appendChild(option);
            });
        }
    }catch(error){
        console.error('Error al cargar los combos:', error);
    }
    
}

async function save_fct() {
    console.log("Listo para guardar");
    let id_venta = document.getElementById("select_vta_fct").value;
    let fecha_emision = document.getElementById("fecha_emision").value;

    if (!validarCampos()) {
        return false;
    }

    const fct = {
        id_venta,
        fecha_emision
    };

    try {
        const response = await fetch('http://localhost:3000/api/fact/insert_fct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fct)
        });
        if (response.ok) {
            alert('Factura generada con éxito');
            document.getElementById("i_d_facturas").style.display = "none";
            document.getElementById("listadoFacturacion").style.display = "block";
            pt_fct();
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Error al generar la factura');
        }
    } catch (error) {
        console.error('Error al actualizar la venta:', error);
    }
}

function formatCurrency(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' });
}

function validarCampos() {
    const fecha_emision = document.getElementById('fecha_emision').value;
    
    // Validar fecha de entrega
    if (!fecha_emision) {
        alert('La fecha de emisión es obligatoria');
        document.getElementById('fecha_emision').focus();
        return false;
    }
    
    // Validar que tenga hora
    if (!fecha_emision.includes('T') || fecha_emision.split('T')[1] === '') {
        alert('Debe seleccionar una hora específica para la entrega');
        document.getElementById('fecha_emision').focus();
        return false;
    }
    
    // Validar que no sea fecha pasada
    const fechaSeleccionada = new Date(fecha_emision);
    if (fechaSeleccionada < new Date()) {
        alert('La fecha de emisión no puede ser en el pasado');
        document.getElementById('fecha_emision').focus();
        return false;
    }
    
    // Validar otros campos si es necesario
    const select_vta = document.getElementById('select_vta_fct').value;
    if (!select_vta || select_vta == 0) {
        alert('Debe seleccionar una venta');
        document.getElementById('select_vta_fct').focus();
        return false;
    }
    
    return true;
}

document.getElementById('cancelarBtn_factura').addEventListener('click', () => {
    document.getElementById("i_d_facturas").style.display = "none";
    document.getElementById("listadoFacturacion").style.display = "block";
    document.getElementById("campos_productos").reset();
});

//Generar PDF para la factura
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

async function generatePDF_fct(id_factura){
    console.log("Generando PDF");
    try{
        await loadExternalScripts();
        //Encontrar los datos de facturacion
        const fct = results.find(c => c.id_factura === id_factura) || {};

        //Pedir los datos de Cliente
        const resp = await fetch(`http://localhost:3000/api/client/list_cli`);
        const detallesJson = resp.ok ? await resp.json() : { results: [] };
        const detalles = detallesJson.results || [];
        const detalles_cli = detalles.find(c => c.nombre_cliente === fct.nombre_cliente) || {};
        console.log('cliente',detalles_cli);
        //Datos de detalle de vta
        const resp_ct = await fetch(`http://localhost:3000/api/ctz/get_detalle/${fct.id_cotizacion}`);
        const detallesctJson = resp_ct.ok ? await resp_ct.json() : { results: [] };
        const detallesct = detallesctJson.results || [];
        console.log('cliente',detallesct);
        // Construir HTML temporal
        const html = buildCotizacionHTML(fct, detalles_cli, detallesct);
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

        pdf.save(`factura_${id_factura}.pdf`);

        wrapper.remove();

    }catch(error){
        console.error('Error generando PDF:', error);
        alert('Ocurrió un error al generar el PDF');
    }
}

function buildCotizacionHTML(fct, detalles_cli, detallesct){
    const rows = detallesct.map(d => {
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

    const subtotal = Number(fct.subtotal || 0);
    const iva = Number(fct.iva || 0);
    const total = Number(fct.total || (subtotal + iva));

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
        
        th:first-child { border-radius: 6px 0 0 0;
        }
        th:last-child { border-radius: 0 6px 0 0;
        }
        
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
        
        .text-right { text-align: right;
        }
        .text-center { text-align: center;
        }
        .text-left { text-align: left;
        }
        
        /* Sección de totales e importe con letra lado a lado - AJUSTE CLAVE */
        .totals-container {
            display: flex;
            gap: 20px;
            margin-top: 20px;
            align-items: stretch; 
        }

        
        /* Importe con letra y Total Section */
        .amount-in-words-section,
        .total-section {
            flex: 1;
            background: var(--surface);
            padding: 20px;
            border-radius: 6px;
            border: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 180px; /* Incrementado para mejor alineación */
        }

        .total-lines {
            flex: 1;
        }
        
        .amount-in-words-title {
            font-weight: 700;
            margin-bottom: 10px;
            color: var(--text-primary);
            font-size: 15px;
        }

        .amount-in-words-content {
            color: var(--text-primary);
            font-weight: 500;
            line-height: 1.2; /* Ligeramente más espaciado */
            padding: 10px;
            border-radius: 4px;
            border: 1px solid var(--border);
             background: var(--background);
            font-style: italic;
            display: block; 
            overflow: hidden;
            margin-top: auto;
            flex-grow: 1; /* Permite crecer para llenar el espacio */
        }
                
        .total-amount { 
            font-weight: 800;
            font-size: 20px; 
            color: var(--primary-dark); 
            margin-top: auto; 
            padding-top: 15px;
            border-top: 2px solid var(--border);
        }
        
        .total-line { 
            display: flex;
            justify-content: space-between; 
            margin-bottom: 8px;
        }
        
        @media print { 
            .cot-container { 
                box-shadow: none;
                padding: 0;
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
                        <h1>FACTURA</h1>
                    </div>
         
                </div>
                <div class="document-info">
                    <div class="info-row">
                        <span class="info-label">Fecha:</span>
                        <span class="info-value">${escapeHtml(fct.fecha_emision)}</span>
     
                    </div>

                    ${fct.id_factura ?
                    `<div class="info-row">
                        <span class="info-label">Folio:</span>
                        <span class="info-value">${String(fct.id_factura).padStart(6, '0')}</span>
                    </div>` : ''}
                </div>
          
            </div>

            <div class="client-section">
                <div class="client-label">CLIENTE</div>
                <div class="client-name">${escapeHtml(fct.nombre_cliente)}</div>
                <div class="client-label">RFC</div>
                <div class="client-name">${escapeHtml(detalles_cli.rfc_cliente)}</div>
                <div 
                class="client-label">DIRECCIÓN</div>
                <div class="client-name">${escapeHtml(detalles_cli.direccion_cliente)}</div>
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

            <div class="totals-container">
       
                <div class="amount-in-words-section">
                    <div class="amount-in-words-title">IMPORTE CON LETRA</div>
                    <div class="amount-in-words-content">
                        ${convertNumberToWords(total)}
                    </div>
  
                </div>
                
                <div class="total-section">
                    <div class="total-lines">
                        <div class="total-line">
       
                            <span><strong>Subtotal:</strong></span>
                            <span>${formatCurrency(subtotal)}</span>
                        </div>
                        <div class="total-line">
  
                            <span><strong>IVA:</strong></span>
                            <span>${formatCurrency(iva)}</span>
                        </div>
                    </div>
  
                    <div class="total-line total-amount">
                        <span><strong>TOTAL:</strong></span>
                        <span>${formatCurrency(total)}</span>
                    </div>
            
                </div>
            </div>
        </div>
    </div>
    `;
}

function convertNumberToWords(number) {
    // Definiciones de palabras clave en español
    const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    // Función auxiliar para convertir grupos de 3 dígitos (0 a 999)
    function convertGroup(n) {
        let text = '';

        if (n === 100) return 'CIEN';
        if (n > 100) {
            text += hundreds[Math.floor(n / 100)];
            n %= 100;
        }

        if (n > 0) {
            if (text.length > 0) text += ' ';
            if (n < 10) {
                text += units[n];
            } else if (n < 20) {
                text += teens[n - 10];
            } else if (n === 20) {
                text += 'VEINTE';
            } else if (n < 30) {
                text += 'VEINTI' + units[n % 10];
            } else {
                text += tens[Math.floor(n / 10)];
                if (n % 10 > 0) {
                    text += ' Y ' + units[n % 10];
                }
            }
        }
        return text.trim();
    }

    // Asegurarse de que el número es un string para manejar decimales
    const numString = number.toFixed(2);
    const [enteroStr, decimalStr] = numString.split('.');
    
    let entero = parseInt(enteroStr);
    const decimal = parseInt(decimalStr);

    if (entero === 0) {
        return `CERO PESOS ${decimal}/100 M.N.`;
    }

    let words = '';
    let thousands = 0;

    // Convertir la parte entera por grupos de mil
    do {
        const group = entero % 1000;
        entero = Math.floor(entero / 1000);

        if (group > 0) {
            let groupWords = convertGroup(group);

            if (thousands === 1) { // Miles
                groupWords += (group === 1) ? ' MIL' : ' MIL'; // Solo se añade MIL
            } else if (thousands === 2) { // Millones
                groupWords += (group === 1) ? ' MILLÓN' : ' MILLONES';
            }

            words = groupWords + ' ' + words;
        }
        thousands++;
    } while (entero > 0);

    // Formato final para facturación
    // El total del PDF es 37,120.00
    // Resultado esperado: TREINTA Y SIETE MIL CIENTO VEINTE PESOS 00/100 M.N.
    return `${words.trim().toUpperCase()} PESOS ${decimal}/100 M.N.`;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('La página está lista');
    pt_fct();
});
