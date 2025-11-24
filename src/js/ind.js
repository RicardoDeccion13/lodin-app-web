const API_URL = 'http://localhost:3000/api/ind/metricas';

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

// En index.html - dentro de un script o archivo JS
function getUserData() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        return null;
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const userData = getUserData();
    
    if (userData) {
        console.log('Usuario autenticado:', userData);       
        document.getElementById("iniciales").innerHTML = userData.nombre.charAt(0).toUpperCase() + userData.apellido_paterno.charAt(0).toUpperCase();
        document.getElementById("usr").innerHTML = userData.nombre + ' ' +userData.apellido_paterno;
        document.getElementById("rol").innerHTML = userData.area;

        switch (userData.rol) {
            case 1:       //Administrador
                console.log("Soy el admin");
                break;
            case 2:       //Ventas
                document.getElementById("clientes_menu").style.display = "none";
                break;

            case 3:       //Almacen
                document.getElementById("cotizaciones_menu").style.display = "none";
                document.getElementById("ventas_menu").style.display = "none";
                document.getElementById("facturacion_menu").style.display = "none";
                document.getElementById("clientes_menu").style.display = "none";
                break;


            default:
                alert("No tienes rol asignado");
                break;
        }
    } else {
        console.log('No hay usuario logueado');
    }



    const menuItems = document.querySelectorAll(".menu-item");
    const sections = {
        "Inicio": document.getElementById("inicio"),
        "Inventario": document.getElementById("inventario"),
        "Cotizaciones": document.getElementById("cotizaciones"),
        "Clientes": document.getElementById("clientes"),
        "Facturación": document.getElementById("facturacion"),
        "Ventas": document.getElementById("ventas")
    };
    const pageTitle = document.querySelector(".page-title");

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            // Obtener el texto del label del menú
            const sectionName = item.querySelector(".label").textContent;
            
            // Quitar active de todos los items del menú
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            // Ocultar todas las secciones
            Object.values(sections).forEach(section => {
                section.classList.remove("active");
            });

            // Mostrar la sección correspondiente
            if (sections[sectionName]) {
                sections[sectionName].classList.add("active");
            }

            // Actualizar título
            pageTitle.textContent = sectionName;
        });
    });
    cargar_metricas();
});

// Código para ocultar/mostrar la top bar al hacer scroll
let lastScroll = 0;
const topBar = document.querySelector(".top-bar");

window.addEventListener("scroll", () => {
const currentScroll = window.pageYOffset;

if (currentScroll > lastScroll && currentScroll > 70) {
// bajando
topBar.classList.add("hidden");
} else {
// subiendo
topBar.classList.remove("hidden");
}

lastScroll = currentScroll;
});


async function cargar_metricas(){
    console.log('Voy a cargar las metricas');
    try{
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if(response.ok){
            results = data.results || [];  
            document.getElementById('monto_ventas').innerHTML = formatCurrency(results[0].total_ventas);
            document.getElementById('cot_pnd').innerHTML = results[0].cotizaciones_pendientes;
            document.getElementById('vtn_ent').innerHTML = results[0].ventas_entregadas;
            document.getElementById('vta_proc').innerHTML = results[0].ventas_entregadas;

            renderTopClientesChart(results[0].top_clientes_json);
            renderTopVendedoresChart(results[0].top_vendedores_json,results[0].total_ventas);
        }else{
            console.log("Error en la obtensión de datos");
        }

    } catch(error){
        
    }
}

function renderTopClientesChart(topClientesJson){
     try {
        const clientes = JSON.parse(topClientesJson || '[]');
        
        if (clientes.length === 0) {
            document.querySelector('.products-list').innerHTML = '<p>No hay datos de clientes disponibles</p>';
            return;
        }
        
        // Calcular total y procesar números
        const clientesProcesados = clientes.map(cliente => {
            const ventasNumerico = parseFloat(cliente.total_ventas.toString().replace(/,/g, ''));
            return {
                ...cliente,
                ventasNumerico: ventasNumerico,
                total_ventas_formateado: formatCurrency(ventasNumerico)
            };
        });
        
        const totalVentas = clientesProcesados.reduce((sum, cliente) => sum + cliente.ventasNumerico, 0);
        
        // Generar HTML
        const productsList = document.querySelector('.products-list');
        productsList.innerHTML = '';
        
        clientesProcesados.forEach((cliente, index) => {
            const porcentaje = totalVentas > 0 ? (cliente.ventasNumerico / totalVentas) * 100 : 0;
            const porcentajeRedondeado = Math.round(porcentaje);
            
            const gradients = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important', 
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important'
            ];
            
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="product-header">
                    <span class="product-rank">${(index + 1).toString().padStart(2, '0')}</span>
                    <span class="product-name">${cliente.nombre_cliente}</span>
                    <span class="seller-amount">${cliente.total_ventas_formateado}</span>
                </div>
                <div class="product-bar-container">
                    <div class="product-bar" style="width: ${porcentajeRedondeado}%; background: ${gradients[index] || gradients[2]};">
                        <span class="percentage">${porcentajeRedondeado}%</span>
                    </div>
                </div>
            `;
            
            productsList.appendChild(productItem);
        });
        
        // Animación suave
        setTimeout(() => {
            document.querySelectorAll('.product-bar').forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        }, 50);
        
    } catch (error) {
        console.error('Error procesando top clientes:', error);
        document.querySelector('.products-list').innerHTML = '<p class="error">Error al cargar datos de clientes</p>';
    }
}

function renderTopVendedoresChart(topVendedoresJson, ventasTotalesMes) {
    try {
        const vendedores = JSON.parse(topVendedoresJson || '[]');
        
        if (vendedores.length === 0) {
            document.querySelector('.sellers-list').innerHTML = '<p>No hay datos de vendedores disponibles</p>';
            return;
        }
        
        // Procesar vendedores
        const vendedoresProcesados = vendedores.map(vendedor => {
            const ventasNumerico = parseFloat(vendedor.total_ventas.toString().replace(/,/g, ''));
            return {
                ...vendedor,
                ventasNumerico: ventasNumerico,
                total_ventas_formateado: formatCurrency(ventasNumerico)
            };
        });
        
        const totalVentasMes = parseFloat(ventasTotalesMes.toString().replace(/,/g, ''));
        
        // Generar HTML - ahora busca dentro de .chart-container
        const sellersList = document.querySelector('.chart-container .sellers-list');
        sellersList.innerHTML = '';
        
        vendedoresProcesados.forEach((vendedor, index) => {
            // Calcular porcentaje basado en el total del mes
            const porcentaje = totalVentasMes > 0 ? (vendedor.ventasNumerico / totalVentasMes) * 100 : 0;
            const porcentajeRedondeado = Math.min(Math.round(porcentaje), 100);
            
            const gradients = [
                'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%) !important',
                'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%) !important',
                'linear-gradient(135deg, #FFD93D 0%, #FF9C33 100%) !important'
            ];
            
            const sellerItem = document.createElement('div');
            sellerItem.className = 'seller-item';
            sellerItem.innerHTML = `
                <div class="seller-header">
                    <div class="seller-rank">${(index + 1).toString().padStart(2, '0')}</div>
                    <div class="seller-name">${vendedor.nombre_usuario}</div>
                    <div class="seller-amount">${vendedor.total_ventas_formateado}</div>
                </div>
                <div class="seller-bar-container">
                    <div class="seller-bar" style="width: ${porcentajeRedondeado}%">
                        <span class="percentage">${porcentajeRedondeado}%</span>
                    </div>
                </div>
            `;
            
            // Aplicar gradiente directamente
            const sellerBar = sellerItem.querySelector('.seller-bar');
            sellerBar.style.background = gradients[index] || gradients[2];
            
            sellersList.appendChild(sellerItem);
        });
        
        // Animación suave
        setTimeout(() => {
            document.querySelectorAll('.seller-bar').forEach(bar => {
                const originalWidth = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = originalWidth;
                }, 100);
            });
        }, 50);
        
    } catch (error) {
        console.error('Error procesando top vendedores:', error);
        document.querySelector('.sellers-list').innerHTML = '<p class="error">Error al cargar datos de vendedores</p>';
    }
}

function cerrarSesion() {
    /// Limpiar cualquier dato de sesión almacenado
    localStorage.removeItem('sessionToken');
    sessionStorage.clear();
    
    // Prevenir cache
    window.history.replaceState(null, '', window.location.href);
    
    // Redirigir forzando recarga
    window.location.replace("lgn.html");
}