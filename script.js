// script.js - Conexión en tiempo real a Firebase

// =========================================================
// 1. CONFIGURACIÓN DE FIREBASE (¡CRÍTICO: REEMPLAZA TUS CREDENCIALES!)
// =========================================================
const firebaseConfig = {
    // ⚠️ Reemplaza con los datos de tu proyecto
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
// 2. FUNCIÓN DE LIMPIEZA (Para el botón "Comenzar Nuevo Día")
// =========================================================
function limpiarAsistencia() {
    if (confirm("⚠️ ¿Estás segura de que quieres borrar TODOS los registros de asistencia del día para comenzar de nuevo?")) {
        
        // Usa la colección CORRECTA para la asistencia diaria
        const coleccionAsistencia = db.collection('asistencia_diaria');
        
        // Obtiene todos los documentos y los elimina en lotes
        coleccionAsistencia.get().then(snapshot => {
            
            const batch = db.batch(); 
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            return batch.commit(); 
        }).then(() => {
            alert("✅ Asistencia limpiada con éxito. ¡Comenzamos nuevo día!");
            location.reload(); 
        }).catch(error => {
            console.error("Error al limpiar:", error);
            alert("Hubo un error al limpiar la asistencia. Revisa la consola.");
        });
    }
}


// =========================================================
// 3. FUNCIÓN DE CARGA DE TABLA (Lógica principal: Lista Completa y ORDENADA)
// =========================================================
function cargarTabla() {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    
    // 1. Escucha los cambios en la asistencia diaria (colección: asistencia_diaria)
    db.collection('asistencia_diaria').onSnapshot(async (asistenciaSnapshot) => {
        
        // Mapea los registros de asistencia hoy para acceso rápido
        const asistenciaHoy = {};
        asistenciaSnapshot.forEach(doc => {
            const registro = doc.data();
            // La clave es el nombre completo (campo 'nombre' que guarda Python)
            asistenciaHoy[registro.nombre] = registro; 
        });

        try {
            // 2. Carga la lista maestra de estudiantes (Colección: Estudiantes con E mayúscula)
            const estudiantesSnapshot = await db.collection('Estudiantes').get();
            
            // 🟢 PASO 1: Convierta la lista (snapshot) en un array para poder ordenarlo
            let listaEstudiantes = [];
            estudiantesSnapshot.forEach(doc => {
                listaEstudiantes.push(doc.data());
            });
            
            // 🟢 PASO 2: Ordena el array alfabéticamente por 'nombre_completo'
            listaEstudiantes.sort((a, b) => {
                // Compara el nombre completo del estudiante A con el estudiante B
                if (a.nombre_completo < b.nombre_completo) return -1;
                if (a.nombre_completo > b.nombre_completo) return 1;
                return 0; // Son iguales
            });

            cuerpoTabla.innerHTML = ''; // Limpia la tabla
            
            // 🟢 PASO 3: Itera sobre el ARRAY ORDENADO y dibuja las filas
            listaEstudiantes.forEach(estudiante => {
                const nombre = estudiante.nombre_completo; // Nombre completo de la lista maestra
                const fila = cuerpoTabla.insertRow();
                
                // Compara el nombre completo de la lista maestra con los registros de hoy
                const registro = asistenciaHoy[nombre];
                
                let estado = 'Inasistencia';
                let hora = '---';
                let claseFila = 'inasistencia'; // Clase CSS para colorear
                
                if (registro) {
                    // Si el estudiante SÍ fue reconocido
                    estado = registro.estado; // 'Asistencia' o 'Atraso'
                    
                    // Convierte el timestamp a hora legible
                    let date = new Date(registro.timestamp * 1000); 
                    hora = date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    if (estado === 'Asistencia') {
                        claseFila = 'asistencia';
                    } else if (estado === 'Atraso') { 
                        claseFila = 'tardanza';
                    }
                }
                
                // Inserta las celdas en la fila
                fila.classList.add(claseFila);
                fila.insertCell(0).innerText = nombre;
                fila.insertCell(1).innerText = estado;
                fila.insertCell(2).innerText = hora;
            });
            
        } catch(e) {
             console.error("Error al cargar la tabla maestra:", e);
             // Mensaje corregido para reflejar el nombre de colección correcto
             alert("Error crítico: Verifica que la colección 'Estudiantes' exista y tenga documentos.");
        }
    });
}

// Inicia la carga de la tabla cuando la página esté lista
document.addEventListener('DOMContentLoaded', cargarTabla);