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
            window.location.href = 'https://localhost/lodin-proyect/lodin-app-web/src/cotizaciones.html';
        } else {
            console.log("Estoy fuera");
        }
    } catch (error) {
        console.error(error);
        document.getElementById('mensaje').textContent = 'Error de conexión';
    }
});
