const API_URL = 'http://localhost:3000/api/vta/list_vta';

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

function formatCurrency(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' });
}

async function pt_vta(){
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        const body = document.getElementById('ventasBody');

        if (response.ok) {
            results = data.results || [];  
            if (results.length === 0) {
                body.innerHTML = '<tr><td colspan="8">No hay ventas disponibles</td></tr>';
            } else {
                body.innerHTML = results.map(item => {
                    const {
                        id_venta,
                        nombre_cliente,
                        total,
                        fecha_venta,
                        fecha_entrega,
                        estado_venta
                    } = item;

                    return `<tr>
                        <td>${escapeHtml(id_venta)}</td>
                        <td>${escapeHtml(nombre_cliente)}</td>
                        <td>${escapeHtml(fecha_venta)}</td>
                        <td>${escapeHtml(fecha_entrega)}</td>
                        <td>${formatCurrency(total)}</td>
                        <td>${escapeHtml(estado_venta)}</td>
                        <td><button class="btn-ver" onclick="verVenta(${escapeHtml(id_venta)});">Ver</button></td>
                        <td><button onclick="agregarVenta(${escapeHtml(id_venta)});">Editar</button></td>
                    </tr>`;
                }).join('');
            }
            } else {
            body.innerHTML = '<tr><td colspan="8">No hay ventas</td></tr>';
        }
    } catch (error) {
        console.error(error);
    }
}

async function agregarVenta(id_venta) {
    console.log('Agregar/Editar venta con ID:', id_venta);
    document.getElementById("i_d_ventas").style.display = "block";
    document.getElementById("listadoVentas").style.display = "none";

    const venta = results.find(v => v.id_venta === id_venta);
    if (venta) {
        document.getElementById('id_venta').value = venta.id_venta;
        document.getElementById('fecha_entrega').value = venta.fecha_entrega ? venta.fecha_entrega : '';
        document.getElementById('observaciones').value = venta.observaciones || '';

        const selectStatus = document.getElementById('select_st_vt');
        for (let i = 0; i < selectStatus.options.length; i++) {
            if (selectStatus.options[i].value === venta.estado_venta) {
                selectStatus.selectedIndex = i;
                break;
            }
        }
    } else {
        console.error('Venta no encontrada con ID:', id_venta);
    }
}

document.getElementById('cancelarBtn_vta').addEventListener('click', () => {
    document.getElementById("i_d_ventas").style.display = "none";
    document.getElementById("listadoVentas").style.display = "block";
});

async function save_vta(){
    const id_venta = document.getElementById('id_venta').value;
    const fecha_entrega = document.getElementById('fecha_entrega').value;
    const estado_venta = document.getElementById('select_st_vt').value;
    const observaciones = document.getElementById('observaciones').value;

    if (!validarCampos()) {
        return false;
    }

    const payload = {
        id_venta,
        fecha_entrega,
        estado_venta,
        observaciones
    };

    try {
        const response = await fetch('http://localhost:3000/api/vta/update_vta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            alert('Venta actualizada con éxito');
            document.getElementById("i_d_ventas").style.display = "none";
            document.getElementById("listadoVentas").style.display = "block";
            pt_vta();
        } else {
            alert('Error al actualizar la venta');
        }
    } catch (error) {
        console.error('Error al actualizar la venta:', error);
    }
}

async function verVenta(id_venta) {
    console.log('Ver detalles de la venta con ID:', id_venta);
    document.getElementById("overlay").style.display = "block";
    document.getElementById("listadoVentas").style.display = "none";
    document.getElementById("i_d_ventas").style.display = "none";

    cargaDetalleVta(id_venta)
        .then(id_cotizacion => {
            if (id_cotizacion) {
                return cargaDetalleVtaCot(id_cotizacion);
            }
        })
        .catch(error => {
            console.error('Error en el flujo:', error);
        });
}   

async function cargaDetalleVta(id_venta) {
    let results_vta = [];
    console.log("Entre a cargarDetalleVta");
    try {
        const response = await fetch('http://localhost:3000/api/vta/detalle_vta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_venta })
        });

        const data = await response.json();

        if (response.ok) {
            results_vta = data.results || [];  
            console.log(results_vta);
            if (results_vta.length === 0) {
                document.getElementById('detalle_venta').innerText = 'No hay detalles disponibles';
            } else {
                document.getElementById('nom_cliente').innerHTML = results_vta[0].nombre_cliente || '';
                document.getElementById('id_cotizacion').innerHTML = results_vta[0].id_cotizacion || '';
                document.getElementById('estado_venta').innerHTML = results_vta[0].estado_venta || '';
                document.getElementById('fecha_venta').innerHTML = results_vta[0].fecha_venta || '';
                document.getElementById('fecha_entrega_vta').innerHTML = results_vta[0].fecha_entrega || '';
                document.getElementById('observaciones_vta').innerHTML = results_vta[0].observaciones || '';
                return results_vta[0].id_cotizacion;
            }
            return null;
        } else {
            document.getElementById('detalle_venta').innerText = 'No hay detalles de venta';
            return null;
        }
   } catch (error) {
        console.error(error);
        return null;
   }
}

async function cargaDetalleVtaCot(id_cotizacion_vt) {
    console.log("9. id_cotización_vta",id_cotizacion_vt);
    try{
        const response_cot = await fetch('http://localhost:3000/api/vta/det_ct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_cotizacion_vt })
        });

        const data_ = await response_cot.json();

        const body_ct = document.getElementById('rows_det_cot');
        let results_ct = [];
        if (response_cot.ok) {
            results_ct = data_.results || [];  
            if (results_ct.length === 0) {
                body_ct.innerHTML = '<tr><td colspan="8">No hay detalle de la cotización</td></tr>';
            } else {
                const subtotal = results_ct.reduce((sum, item) => {
                    const cantidad = Number(item.cantidad || 0);
                    const precio = Number(item.precio_unitario || item.precio_producto || 0);
                    return sum + (cantidad * precio);
                }, 0);

                const iva_vta = subtotal * 0.16;
                const total_vta = subtotal + iva_vta;

                body_ct.innerHTML = results_ct.map(item => {
                        const modelo = escapeHtml(item.modelo || item.modelo_producto || '');
                    const cantidad = Number(item.cantidad || 0);
                    const precio = Number(item.precio_unitario || item.precio_producto || 0);
                    const total = cantidad * precio;
                    return `<tr>
                        <td class="text-left product-name">${modelo}</td>
                        <td class="text-center">${cantidad}</td>
                        <td class="text-right">${formatCurrency(precio)}</td>
                        <td class="text-right amount">${formatCurrency(total)}</td>
                    </tr>`;
                }).join('');

                document.getElementById('subtotal_vta').innerHTML = formatCurrency(subtotal);
                document.getElementById('iva_vta').innerHTML = formatCurrency(iva_vta);
                document.getElementById('total_vta').innerHTML = formatCurrency(total_vta);
            }
            } else {
                body_ct.innerHTML = '<tr><td colspan="8">No hay ventas</td></tr>';
        }
    }catch (error){
        console.error(error);
    }
}


document.getElementById('atras_btn').addEventListener('click',()=>{
    document.getElementById("overlay").style.display = "none";
    document.getElementById("listadoVentas").style.display = "block";
    document.getElementById("i_d_ventas").style.display = "none";
});

function validarCampos() {
    const fecha_entrega = document.getElementById('fecha_entrega').value;
    
    // Validar fecha de entrega
    if (!fecha_entrega) {
        alert('La fecha de entrega es obligatoria');
        document.getElementById('fecha_entrega').focus();
        return false;
    }
    
    // Validar que tenga hora
    if (!fecha_entrega.includes('T') || fecha_entrega.split('T')[1] === '') {
        alert('Debe seleccionar una hora específica para la entrega');
        document.getElementById('fecha_entrega').focus();
        return false;
    }
    
    // Validar que no sea fecha pasada
    const fechaSeleccionada = new Date(fecha_entrega);
    if (fechaSeleccionada < new Date()) {
        alert('La fecha de entrega no puede ser en el pasado');
        document.getElementById('fecha_entrega').focus();
        return false;
    }
    
    // Validar otros campos si es necesario
    const estado_venta = document.getElementById('select_st_vt').value;
    if (!estado_venta) {
        alert('Debe seleccionar un estado para la venta');
        document.getElementById('select_st_vt').focus();
        return false;
    }
    
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('La página está lista');
    pt_vta();
});

