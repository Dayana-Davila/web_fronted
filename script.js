/*script.js - Conexión en tiempo real a Firebase*/
// =========================================================

// 1. CONFIGURACIÓN DE FIREBASE
// =========================================================

const firebaseConfig = {
    // Tus credenciales son correctas aquí
    apiKey: "AIzaSyDLFAkvyVj6dVv8csuL9HvqRUv_3FzasHw",
    authDomain: "tecnico-c3c48.firebaseapp.com",
    projectId: "tecnico-c3c48",
    storageBucket: "tecnico-c3c48.firebasestorage.app",
    appId: "1:923208931684:web:1277e3dc3f0bd8a6fb0271"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =========================================================
// 2. CONTROL DE VISTAS (Panel Lateral)
// =========================================================

// Oculta/Muestra el panel lateral
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    
    sidebar.classList.toggle('hidden');
    content.classList.toggle('full-width');
}

// Cambia entre la vista de Hoy y la vista de Registros
function cambiarVista(vistaId) {
    // Oculta todas las vistas
    document.getElementById('vista-hoy').style.display = 'none';
    document.getElementById('vista-registros').style.display = 'none';
    
    // Muestra la vista solicitada
    document.getElementById(vistaId).style.display = 'block';

    // Manejar el estado 'active' de los enlaces del menú
    document.getElementById('linkHoy').classList.remove('active');
    document.getElementById('linkRegistros').classList.remove('active');

    if (vistaId === 'vista-hoy') {
        document.getElementById('linkHoy').classList.add('active');
        cargarTablaHoy();
    } else if (vistaId === 'vista-registros') {
        document.getElementById('linkRegistros').classList.add('active');
        // Al cargar la vista historial, establecemos la fecha de hoy por defecto en el filtro
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('filtroFecha').value = today;
        cargarRegistrosPorFecha(today); // Cargamos los registros de hoy por defecto
    }
}        

// =========================================================
// 3. VISTA ASISTENCIA DE HOY (Tu lógica principal)
// =========================================================

function cargarTablaHoy() {
    const cuerpoTabla = document.getElementById('cuerpoTablaHoy');
    
    // 1. Escucha los cambios en la asistencia diaria (colección: asistencia_diaria)
    db.collection('asistencia_diaria').onSnapshot(async (asistenciaSnapshot) => {
        
        // --- FILTRADO POR FECHA DE HOY ---
        const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        const asistenciaHoy = {};
        asistenciaSnapshot.forEach(doc => {
            const registro = doc.data();
            // Solo procesamos registros de hoy
            if (registro.fecha === hoy) {
                // 🚨 USAMOS LA CLAVE LIMPIADA (minúsculas y sin tildes)
                const key = limpiarClave(registro.nombre);
                asistenciaHoy[key] = registro;
            }
        });
        
        try {
            // 2. Carga la lista maestra de estudiantes (Colección: Estudiantes)
            const estudiantesSnapshot = await db.collection('Estudiantes').get();
            
            let listaEstudiantes = [];
            estudiantesSnapshot.forEach(doc => {
                listaEstudiantes.push(doc.data());
            });
            
            // 🟢 Ordena el array alfabéticamente por 'nombre_completo'
            listaEstudiantes.sort((a, b) => {
                if (a.nombre_completo < b.nombre_completo) return -1;
                if (a.nombre_completo > b.nombre_completo) return 1;
                return 0;
            });

            cuerpoTabla.innerHTML = ''; // Limpia la tabla
            
            // 🟢 Itera sobre el ARRAY ORDENADO y dibuja las filas
            listaEstudiantes.forEach(estudiante => {
                // 🛑 CORRECCIÓN CLAVE: Usar estudiante.nombre_completo (coincide con Firebase)
                const nombreCompleto = estudiante.nombre_completo; 
                
                // 🔑 CLAVE DE BÚSQUEDA LIMPIADA (sin tildes)
                const claveBusqueda = limpiarClave(nombreCompleto);
                
                const fila = cuerpoTabla.insertRow();
                
                // 🚨 BÚSQUEDA DE REGISTRO USANDO LA CLAVE LIMPIADA
                const registro = asistenciaHoy[claveBusqueda];
                
                let estado = 'Inasistencia';
                let hora = '---';
                let claseFila = 'inasistencia';
                
                if (registro) {
                    estado = registro.estado;
                    
                    // Asumiendo que el campo 'timestamp' existe y es un número de segundos UNIX
                    let date = new Date(registro.timestamp * 1000);
                    // Formato de hora de Ecuador (ejemplo: 07:00:00 AM)
                    hora = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    if (estado === 'Asistencia') {
                        claseFila = 'asistencia';
                    } else if (estado === 'Atraso') {
                        claseFila = 'tardanza';
                    }
                }
                
                fila.classList.add(claseFila);
                fila.insertCell(0).innerText = nombreCompleto;
                fila.insertCell(1).innerText = estado;
                fila.insertCell(2).innerText = hora;
            });
            
        } catch(e) {
             console.error("Error al cargar la tabla maestra:", e);
             alert("Error crítico: Verifica que la colección 'Estudiantes' exista y el nombre de los campos sea correcto.");
        }
    });
}


// =========================================================
// 4. VISTA REGISTROS ANTERIORES (Historial)
// =========================================================

async function cargarRegistrosPorFecha(fechaSeleccionada = document.getElementById('filtroFecha').value) {
    const cuerpoTablaHistorial = document.getElementById('cuerpoTablaHistorial');

    if (!fechaSeleccionada) {
        alert("Por favor, selecciona una fecha.");
        return;
    }

    // 1. Limpiamos la tabla y le ponemos un mensaje de carga
    if (cuerpoTablaHistorial) {
        cuerpoTablaHistorial.innerHTML = `<tr><td colspan="3">Cargando registros del ${fechaSeleccionada}...</td></tr>`;
    }
    
    // 2. Carga la lista maestra de estudiantes (Colección: Estudiantes)
    let listaEstudiantes = [];
    try {
        const estudiantesSnapshot = await db.collection('Estudiantes').get();
        estudiantesSnapshot.forEach(doc => listaEstudiantes.push(doc.data()));
        listaEstudiantes.sort((a, b) => {
            if (a.nombre_completo < b.nombre_completo) return -1;
            if (a.nombre_completo > b.nombre_completo) return 1;
            return 0;
        });
    } catch (e) {
        console.error("Error al cargar la lista maestra de estudiantes para el historial:", e);
        return;
    }

    // 3. Consulta SÓLO los registros de la fecha seleccionada
    const asistenciaDelDia = {};
    try {
        // Filtro por campo 'fecha' (que Python guarda como YYYY-MM-DD)
        const snapshot = await db.collection('asistencia_diaria').where('fecha', '==', fechaSeleccionada).get();
        snapshot.forEach(doc => {
            const registro = doc.data();
            // 🚨 USAMOS LA CLAVE LIMPIADA (minúsculas y sin tildes)
            const key = limpiarClave(registro.nombre);
            asistenciaDelDia[key] = registro;
        });
    } catch (e) {
        console.error("Error al obtener registros de Firebase para el historial:", e);
        return;
    }

    // 4. Dibuja la tabla
    const tbody = document.getElementById('cuerpoTablaHistorial');
    tbody.innerHTML = '';
    
    listaEstudiantes.forEach(estudiante => {
        const nombreCompleto = estudiante.nombre_completo;
        
        // 🔑 CLAVE DE BÚSQUEDA LIMPIADA para el historial
        const claveBusqueda = limpiarClave(nombreCompleto);
        
        const fila = tbody.insertRow();
        
        // 🚨 BÚSQUEDA DE REGISTRO USANDO LA CLAVE LIMPIADA
        const registro = asistenciaDelDia[claveBusqueda];
        
        let estado = 'Inasistencia';
        let hora = '---';
        let claseFila = 'inasistencia';
        
        if (registro) {
            estado = registro.estado;
            claseFila = estado === 'Asistencia' ? 'asistencia' : 'tardanza';

            let date = new Date(registro.timestamp * 1000);
            hora = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        
        fila.classList.add(claseFila);
        fila.insertCell(0).innerText = nombreCompleto;
        fila.insertCell(1).innerText = estado;
        fila.insertCell(2).innerText = hora;
    });
    
    if (listaEstudiantes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3">No se encontraron estudiantes para la lista maestra.</td></tr>`;
    }
}


// =========================================================
// 5. FUNCIÓN DE LIMPIEZA (Corregida para manejar tildes de forma universal)
// =========================================================

const limpiarClave = (name) => {
    if (!name) return "";
    
    // 1. Convertir a string y minúsculas
    let cleaned = String(name).toLowerCase();
    
    // 2. Normalizar: Elimina los acentos (diacríticos) de una cadena de texto.
    // Esto es CLAVE para que "Dávila" y "Davila" generen la misma clave.
    cleaned = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 3. Eliminar espacios al inicio y al final
    return cleaned.trim();
};


// =========================================================
// 6. INICIO Y CONTROL DE LA PÁGINA
// =========================================================


document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Construir el título con la fecha actual
    const fecha = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const textoFecha = fecha.toLocaleDateString('es-EC', opcionesFecha);
    
    const tituloDisplay = document.getElementById('titulo-hoy');
    if (tituloDisplay) {
        tituloDisplay.innerText = `HOY, ${textoFecha.toUpperCase()}`;
    }
    
    // 2. Asignar los eventos de navegación a los enlaces del menú
    document.getElementById('linkHoy').addEventListener('click', (e) => {
        e.preventDefault();
        cambiarVista('vista-hoy');
    });

    document.getElementById('linkRegistros').addEventListener('click', (e) => {
        e.preventDefault();
        cambiarVista('vista-registros');
    });

    // 3. Iniciar la página en la vista de Hoy y cargar los datos
    cambiarVista('vista-hoy');
});