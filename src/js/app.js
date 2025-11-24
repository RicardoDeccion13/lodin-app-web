const API_URL = 'http://localhost:3000/api/auth/login';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('usuario').value;
    const password = document.getElementById('contrasena').value;

    if(correo === '' || password === '') {
        alert('Por favor, complete todos los campos.');
        return;
    }

    try {
        const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (response.ok) {
           console.log("Estoy dentro");
            alert('Inicio de sesión exitoso');

            // Debug: verificar la estructura exacta de data
            console.log("Estructura de data:", data.usuario);
            console.log("data.id_usuario:", data.usuario.id_usuario);
            console.log("data.nombre:", data.usuario.nombre);
            console.log("data.apellido_paterno:", data.usuario.apellido_paterno);
            console.log("data.area:", data.usuario.nombre_area);
            console.log("data.rol:", data.usuario.id_rol);

            // Guardar datos en localStorage
            localStorage.setItem('userData', JSON.stringify({
                id_usuario: data.usuario.id_usuario,
                nombre: data.usuario.nombre,
                apellido_paterno: data.usuario.apellido_paterno,
                area: data.usuario.nombre_area,
                rol: data.usuario.id_rol
            }));
            
            window.location.href = 'https://localhost/lodin-proyect/lodin-app-web/src/index.html';
        } else {
            alert('Usuario y contraseña incorrecto');
            console.log("Estoy fuera");
        }
    } catch (error) {
        console.error(error);
        document.getElementById('mensaje').textContent = 'Error de conexión';
    }
});
