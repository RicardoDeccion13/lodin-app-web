const API_URL = 'http://localhost:3000/api/client/list_cli';

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

async function pt_cli(){
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        const body = document.getElementById('clienteBody');

        if (response.ok) {
            results = data.results || [];


            if (results.length === 0) {
                body.innerHTML = '<tr><td colspan="8">No hay clientes disponibles</td></tr>';
            } else {
                body.innerHTML = results.map(item => {
                    const {
                        id_cliente,
                        nombre_cliente,
                        direccion_cliente,
                        telefono_cliente,
                        razon_social,
                        rfc_cliente
                    } = item;

                    return `<tr>
                        <td>${escapeHtml(id_cliente)}</td>
                        <td>${escapeHtml(nombre_cliente)}</td>
                        <td>${escapeHtml(direccion_cliente)}</td>
                        <td>${escapeHtml(telefono_cliente)}</td>
                        <td>${escapeHtml(razon_social)}</td>
                        <td>${escapeHtml(rfc_cliente)}</td>
                        <td><button class="btn-editar" onclick="agregarCliente(${escapeHtml(id_cliente)});">Editar</button></td>
                        <td><button class="btn-eliminar" data-id="${escapeHtml(id_cliente)}" onclick="delete_cli('${escapeHtml(id_cliente)}');">Eliminar</button></td>
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

function agregarCliente(id_cliente){
    console.log('Función agregarCliente llamada');
    document.getElementById("i_d_productos").style.display = "block";
    document.getElementById("listadoClientes").style.display = "none";

    if(id_cliente){
        const cliente = results.find(c => c.id_cliente === id_cliente);
        if(cliente){
            document.getElementById("id_cliente").value = cliente.id_cliente;   
            document.getElementById("nombre_cliente").value = cliente.nombre_cliente;   
            document.getElementById("direccion_cliente").value = cliente.direccion_cliente;   
            document.getElementById("telefono_cliente").value = cliente.telefono_cliente;   
            document.getElementById("razon_social").value = cliente.razon_social;   
            document.getElementById("rfc_cliente").value = cliente.rfc_cliente;   
        }   
    }    
}

document.getElementById("cancelarBtn_cliente").addEventListener("click", function() {
    document.getElementById("i_d_productos").style.display = "none";
    document.getElementById("listadoClientes").style.display = "block";
    document.getElementById("campos_productos").reset();
});

async function save_cli(){
    const id_cliente = document.getElementById("id_cliente").value;
    const nombre_cliente = document.getElementById("nombre_cliente").value;
    const direccion_cliente = document.getElementById("direccion_cliente").value;
    const telefono_cliente = document.getElementById("telefono_cliente").value;
    const razon_social = document.getElementById("razon_social").value;
    const rfc_cliente = document.getElementById("rfc_cliente").value;

    const clienteData = {
        nombre_cliente,
        direccion_cliente,
        telefono_cliente,
        razon_social,
        rfc_cliente
    };

    const camposFaltantes = Object.keys(clienteData).filter(campo => {
        const valor = clienteData[campo];
        return valor === undefined || valor === null || valor === '';
    });

    if (camposFaltantes.length > 0) {
        alert(`Faltan los siguientes campos: ${camposFaltantes.join(', ')}`);
        return;
    }

    let url = 'http://localhost:3000/api/client/add_cli';
    let method = 'POST';

    if(id_cliente){
        url = `http://localhost:3000/api/client/update_cli/${id_cliente}`;
        method = 'POST';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clienteData)
        });

        if (response.ok) {
            alert('Cliente guardado exitosamente');
            document.getElementById("i_d_productos").style.display = "none";
            document.getElementById("listadoClientes").style.display = "block";
            document.getElementById("campos_productos").reset();
            pt_cli();
        } else {
            const errorData = await response.json();
            alert('Error al guardar el cliente: ' + errorData.error);
        }
    } catch (error) {
        console.error('Error al guardar el cliente:', error);
        alert('Error al guardar el cliente');
    }
}

function delete_cli(id_cliente){
    if(confirm('¿Estás seguro de que deseas eliminar este cliente?')){
        fetch(`http://localhost:3000/api/client/delete_cli/${id_cliente}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => {
            if (response.ok) {
                alert('Cliente eliminado exitosamente');
                pt_cli();
            } else {
                alert('Error al eliminar el cliente');
            }
        })
        .catch(error => {
            console.error('Error al eliminar el cliente:', error);
            alert('Error al eliminar el cliente');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('La página está lista');
    pt_cli();
});
