// script.js

// --- Asume que tu configuración de Firebase está aquí: ---
/*
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};
firebase.initializeApp(firebaseConfig);
*/
const db = firebase.firestore();

// =========================================================================
// 1. FUNCIÓN PARA CARGAR ASISTENCIA POR FECHA (USANDO EL FILTRO)
// =========================================================================

function cargarAsistenciaPorFecha() {
    const fechaInput = document.getElementById('fechaSeleccionada');
    const fechaFiltro = fechaInput.value; // Obtiene la fecha en formato YYYY-MM-DD
    
    if (!fechaFiltro) {
        alert('Por favor, selecciona una fecha para consultar el reporte.');
        return;
    }

    console.log(`Cargando asistencia para la fecha: ${fechaFiltro}`);
    
    // Paso 1: Obtener la lista maestra de estudiantes para poder mostrar a los "Ausentes".
    // Esto requiere que tengas una colección 'Estudiantes' que liste a todos los alumnos.
    db.collection("Estudiantes").get().then(snapshotEstudiantes => {
        const listaEstudiantes = {};
        
        // Inicializar a todos como Ausente
        snapshotEstudiantes.forEach(doc => {
            const data = doc.data();
            listaEstudiantes[data.nombre] = {
                nombre: data.nombre,
                estado: "Ausente", 
                hora_entrada: ""
            };
        });

        // Paso 2: Consultar la colección 'asistencia_diaria' filtrando por la fecha seleccionada
        db.collection("asistencia_diaria")
          .where("fecha", "==", fechaFiltro) // <-- ¡El filtro principal!
          .get()
          .then(snapshotAsistencia => {
              
            // Actualizar el estado de los que sí registraron ese día
            snapshotAsistencia.forEach(doc => {
                const data = doc.data();
                // Si el estudiante está en la lista maestra, actualizamos su estado
                if (listaEstudiantes[data.nombre]) {
                    listaEstudiantes[data.nombre].estado = data.estado;
                    listaEstudiantes[data.nombre].hora_entrada = data.hora_entrada;
                }
            });
            
            // Paso 3: Actualizar la tabla HTML con la lista final
            actualizarTabla(Object.values(listaEstudiantes));

            if (Object.keys(listaEstudiantes).length === 0) {
                 alert("No se encontraron registros de estudiantes para esa fecha o la lista maestra está vacía.");
            }
            
        }).catch(error => {
            console.error("Error al cargar registros de asistencia:", error);
            alert("Error al cargar los datos del día. Revisa la consola.");
        });

    }).catch(error => {
        console.error("Error al cargar la lista de estudiantes:", error);
        alert("Error al obtener la lista de estudiantes. ¡Asegúrate de tener una colección 'Estudiantes'!");
    });
}


// =========================================================================
// 2. FUNCIÓN PARA DIBUJAR LA TABLA (UTILIZADA POR LA CARGA DIARIA Y EL HISTÓRICO)
// =========================================================================

function actualizarTabla(estudiantes) {
    const tbody = document.getElementById('cuerpoTabla');
    tbody.innerHTML = ''; // Limpia la tabla antes de llenarla con nuevos datos
    
    // Ordenar alfabéticamente por nombre completo
    estudiantes.sort((a, b) => a.nombre.localeCompare(b.nombre));

    estudiantes.forEach(estudiante => {
        const row = tbody.insertRow();
        
        // Columna Nombre
        const cellNombre = row.insertCell();
        cellNombre.textContent = estudiante.nombre;
        
        // Columna Estado
        const cellEstado = row.insertCell();
        cellEstado.textContent = estudiante.estado;
        
        // Columna Hora
        const cellHora = row.insertCell();
        cellHora.textContent = estudiante.hora_entrada || '-'; // Muestra '-' si está ausente
        
        // Dar estilo (usando las clases CSS que definiste, por ejemplo en style.css)
        if (estudiante.estado === 'Atraso') {
            row.classList.add('atraso');
        } else if (estudiante.estado === 'Asistencia') {
            row.classList.add('asistencia');
        } else if (estudiante.estado === 'Ausente') {
            row.classList.add('ausente');
        }
    });
}