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

async function agregarCotizacion() {
    document.getElementById("i_d_cotizaciones").style.display = "block";
    document.getElementById("listadoCotizaciones").style.display = "none";
    //document.getElementById("operacion").value = edicion; // 1 para agregar, 2 para editar

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
}


document.getElementById('cancelarBtn_cot').addEventListener('click', () => {
    document.getElementById("i_d_cotizaciones").style.display = "none";
    document.getElementById("listadoCotizaciones").style.display = "block";
    document.getElementById("campos_productos").reset();
});

