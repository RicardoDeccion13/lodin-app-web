const API_URL = 'http://localhost:3000/api/invt/inv';

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

async function pt_prod(producto){
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto })
        });

        const data = await response.json();

        const body = document.getElementById('productosBody');

        if (response.ok) {
            results = data.results || [];


            if (results.length === 0) {
                body.innerHTML = '<tr><td colspan="9">No hay productos</td></tr>';
            } else {
                body.innerHTML = results.map(item => {
                    const id = item.id_producto ?? item.id ?? item.ID ?? '';
                    const modelo = item.modelo_producto ?? item.modelo ?? '';
                    const descripcion = item.descripcion_producto ?? item.descripcion ?? '';
                    const noSerie = item.numero_serie ?? item.serial ?? '';
                    const precio = item.precio_producto ?? item.price ?? '';
                    const fecha = item.Fecha_compra ?? item.fecha ?? '';
                    const piezas = item.piezas_disponibles ?? item.stock ?? item.cantidad ?? '';

                    return `<tr>
                        <td>${escapeHtml(id)}</td>
                        <td>${escapeHtml(modelo)}</td>
                        <td>${escapeHtml(descripcion)}</td>
                        <td>${escapeHtml(noSerie)}</td>
                        <td>$${escapeHtml(precio)}</td>
                        <td>${escapeHtml(fecha)}</td>
                        <td>${escapeHtml(piezas)}</td>
                        <td><button class="btn-editar" data-id="${escapeHtml(id)}" onclick="agregarProducto(2,'${escapeHtml(id)}');">Editar</button></td>
                        <td><button class="btn-eliminar" data-id="${escapeHtml(id)}" onclick="delete_prod('${escapeHtml(id)}');">Eliminar</button></td>
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
    console.log('La página está lista');

    let producto = document.getElementById('modelo').value;
    console.log(producto);
    pt_prod(producto);
});

document.getElementById('buscarBtn').addEventListener('click', () => {
    let producto = document.getElementById('modelo').value;
    console.log(producto);
    pt_prod(producto);
});


async function agregarProducto(edicion, id_producto) {
    document.getElementById("i_d_productos").style.display = "block";
    document.getElementById("listadoProductos").style.display = "none";
    document.getElementById("operacion").value = edicion; // 1 para agregar, 2 para editar

    const response = await fetch('http://localhost:3000/api/invt/cb_tmp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if(response.ok){
        let res_temp = [];
        const data = await response.json();
        res_temp = data.results || [];
        const temporadaSelect = document.getElementById("temporada_precios");
        temporadaSelect.innerHTML = '<option value="0">Seleccione una opción</option>';
        
        res_temp.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id_temporada;
            option.text = item.nombre_temporada;
            temporadaSelect.appendChild(option);
        });
    }

    if (edicion === 2) {
        console.log("Voy a editar el producto con ID:", id_producto);
        
        const productoEncontrado = results.find(item => {
            const id = item.id_producto ?? item.id ?? item.ID;
            return id == id_producto; // Usar == en lugar de === para comparar string con número si es necesario
        });

        if (productoEncontrado) {  
            //document.getElementById("id_producto").value = productoEncontrado.id_producto ?? productoEncontrado.id ?? productoEncontrado.ID ?? '';
            document.getElementById("modelo_producto").value = productoEncontrado.modelo_producto ?? productoEncontrado.modelo ?? '';
            document.getElementById("descripcion_producto").value = productoEncontrado.descripcion_producto ?? productoEncontrado.descripcion ?? '';
            document.getElementById("numero_serie_producto").value = productoEncontrado.numero_serie ?? productoEncontrado.serial ?? '';
            document.getElementById("precio_producto").value = productoEncontrado.precio_producto ?? productoEncontrado.price ?? '';
            document.getElementById("fecha_compra_producto").value = productoEncontrado.Fecha_compra ?? productoEncontrado.fecha ?? '';
            document.getElementById("piezas_disponible_producto").value = productoEncontrado.piezas_disponibles ?? productoEncontrado.stock ?? productoEncontrado.cantidad ?? '';
            document.getElementById("temporada_precios").value = productoEncontrado.id_temporada ?? '0';
        }
    } 
}

document.getElementById("cancelarBtn").addEventListener("click", () => {
    document.getElementById("i_d_productos").style.display = "none";
    document.getElementById("listadoProductos").style.display = "block";
    document.getElementById("campos_productos").reset();
});


async function save_prod(){
    console.log("Guardando producto...");
    try {
        //const id_producto = document.getElementById("id_producto").value;
        const modelo_producto = document.getElementById("modelo_producto").value;
        const descripcion_producto = document.getElementById("descripcion_producto").value;
        const numero_serie_producto = document.getElementById("numero_serie_producto").value;
        const precio_producto = document.getElementById("precio_producto").value;
        const fecha_compra_producto = document.getElementById("fecha_compra_producto").value;
        const piezas_disponible_producto = document.getElementById("piezas_disponible_producto").value;
        const operacion = document.getElementById("operacion").value; 

        const productoData = {
            modelo_producto,
            descripcion_producto,
            numero_serie_producto,
            precio_producto,
            fecha_compra_producto,
            piezas_disponible_producto,
            operacion
        };

        const camposFaltantes = Object.keys(productoData).filter(campo => {
            const valor = productoData[campo];
            return valor === undefined || valor === null || valor === '';
        });

        if (camposFaltantes.length > 0) {
            alert(`Faltan los siguientes campos: ${camposFaltantes.join(', ')}`);
            return;
        }

        console.log('Datos del producto a guardar:', productoData);

        const response = await fetch('http://localhost:3000/api/invt/save_prod', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productoData)
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (response.ok) {
            alert('Producto guardado exitosamente');
            document.getElementById("i_d_productos").style.display = "none";
            document.getElementById("listadoProductos").style.display = "block";
            document.getElementById("campos_productos").reset();
            pt_prod('');
        } else {
            alert('Error al guardar el producto: ' + (data.error || 'Error desconocido'));
        }

    } catch (error) {
        console.error(error);
    }
}

async function delete_prod(id_producto) {
    console.log("Eliminando producto con ID:", id_producto);
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar este producto?");
    if (!confirmDelete) {
        return; // Salir si el usuario cancela
    }

    try {
        const response = await fetch('http://localhost:3000/api/invt/delete_prod', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_producto })
        });

        const data = await response.json();
        console.log('Respuesta del servidor al eliminar:', data);

        if (response.ok) {
            alert('Producto eliminado exitosamente');
            pt_prod('');
        } else {
            alert('Error al eliminar el producto: ' + (data.error || 'Error desconocido'));
        }

    } catch (error) {
        console.error(error);
    }   
}