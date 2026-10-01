// app.js - Gestor de tareas universitarias (Laboratorio 04)

const CLAVE_STORAGE = 'tareas-lab04';

const form = document.querySelector('#form-tarea');
const inputTitulo = document.querySelector('#titulo');
const inputCurso = document.querySelector('#curso');
const inputFecha = document.querySelector('#fecha-entrega');
const alertas = document.querySelector('#alertas');
const lista = document.querySelector('#lista-tareas');
const filtros = document.querySelector('#filtros');
const resumen = document.querySelector('#resumen');

// ===== Ejercicio 1: gestión del estado y estructuras de datos =====
// Arreglo global de tareas: [{ id, titulo, curso, fechaEntrega, completada }]
let tareas = [];
let filtroActual = 'todas';

const crearTarea = ({ titulo, curso, fechaEntrega }) => ({
  id: Date.now().toString(),
  titulo,
  curso,
  fechaEntrega,
  completada: false,
});

const agregarTarea = (tarea) => {
  tareas = [...tareas, tarea];
};

const alternarTarea = (id) => {
  tareas = tareas.map((tarea) =>
    tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea
  );
};

const eliminarTarea = (id) => {
  tareas = tareas.filter((tarea) => tarea.id !== id);
};

const buscarTarea = (id) => tareas.find((tarea) => tarea.id === id);

const FILTROS = {
  todas: () => true,
  pendientes: (tarea) => !tarea.completada,
  completadas: (tarea) => tarea.completada,
};

const contarCompletadas = () =>
  tareas.reduce((total, { completada }) => (completada ? total + 1 : total), 0);

// ===== Ejercicio 2: captura y validación con JavaScript =====
// Fecha local de hoy en formato YYYY-MM-DD (igual que el input type="date").
const obtenerHoy = () => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
};

const validarTarea = ({ titulo, curso, fechaEntrega }) => {
  const errores = [];
  if (!titulo) errores.push('El título es obligatorio.');
  if (!curso) errores.push('El curso es obligatorio.');
  if (!fechaEntrega) {
    errores.push('La fecha de entrega es obligatoria.');
  } else if (fechaEntrega <= obtenerHoy()) {
    errores.push('La fecha de entrega debe ser posterior a la fecha actual.');
  }
  return errores;
};

const mostrarAlerta = (mensajes, tipo) => {
  alertas.innerHTML = '';
  if (mensajes.length === 0) return;

  const div = document.createElement('div');
  div.className = `alert alert-${tipo}`;
  const ul = document.createElement('ul');
  ul.className = 'mb-0';
  mensajes.forEach((mensaje) => {
    const li = document.createElement('li');
    li.textContent = mensaje;
    ul.appendChild(li);
  });
  div.appendChild(ul);
  alertas.appendChild(div);
};

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const datos = {
    titulo: inputTitulo.value.trim(),
    curso: inputCurso.value.trim(),
    fechaEntrega: inputFecha.value,
  };

  const errores = validarTarea(datos);
  if (errores.length > 0) {
    mostrarAlerta(errores, 'danger');
    return;
  }

  agregarTarea(crearTarea(datos));
  guardarTareas();
  renderTareas();
  form.reset();
  mostrarAlerta(['Tarea agregada correctamente.'], 'success');
});

// ===== Ejercicio 3: manipulación dinámica del DOM =====
// Se usa textContent (no innerHTML) para los datos del usuario y evitar XSS.
const crearElementoTarea = ({ id, titulo, curso, fechaEntrega, completada }) => {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-center gap-3';
  li.classList.toggle('tarea-completada', completada);
  li.dataset.id = id;

  const info = document.createElement('div');
  info.className = 'tarea-info';
  const spanTitulo = document.createElement('span');
  spanTitulo.className = 'tarea-titulo fw-semibold';
  spanTitulo.textContent = titulo;
  const detalle = document.createElement('small');
  detalle.className = 'd-block text-muted';
  detalle.textContent = `${curso} · Entrega: ${fechaEntrega}`;
  info.append(spanTitulo, detalle);

  const acciones = document.createElement('div');
  acciones.className = 'd-flex gap-2 flex-shrink-0';
  const btnEstado = document.createElement('button');
  btnEstado.type = 'button';
  btnEstado.className = `btn btn-sm ${completada ? 'btn-secondary' : 'btn-success'}`;
  btnEstado.dataset.accion = 'alternar';
  btnEstado.textContent = completada ? 'Marcar pendiente' : 'Completar';
  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'btn btn-sm btn-danger';
  btnEliminar.dataset.accion = 'eliminar';
  btnEliminar.textContent = 'Eliminar';
  acciones.append(btnEstado, btnEliminar);

  li.append(info, acciones);
  return li;
};

const renderTareas = () => {
  lista.innerHTML = '';
  const visibles = tareas.filter(FILTROS[filtroActual]);

  if (visibles.length === 0) {
    const vacio = document.createElement('li');
    vacio.className = 'list-group-item text-muted';
    vacio.textContent = 'No hay tareas para mostrar.';
    lista.appendChild(vacio);
  } else {
    visibles.map(crearElementoTarea).forEach((li) => lista.appendChild(li));
  }

  const completadas = contarCompletadas();
  resumen.textContent = `Total: ${tareas.length} · Pendientes: ${tareas.length - completadas} · Completadas: ${completadas}`;
};

// Delegación de eventos: un solo listener en la lista para todos los botones.
lista.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-accion]');
  if (!boton) return;

  const { id } = boton.closest('li').dataset;
  if (!buscarTarea(id)) return;

  if (boton.dataset.accion === 'alternar') alternarTarea(id);
  if (boton.dataset.accion === 'eliminar') eliminarTarea(id);

  guardarTareas();
  renderTareas();
});

// Filtro visual: Todas / Pendientes / Completadas.
filtros.addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-filtro]');
  if (!boton) return;

  filtroActual = boton.dataset.filtro;
  filtros.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn === boton);
  });
  renderTareas();
});

// ===== Ejercicio 4: persistencia de datos =====
const guardarTareas = () => {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(tareas));
  } catch (error) {
    console.error('No se pudo guardar en localStorage:', error);
    mostrarAlerta(['No se pudieron guardar los cambios en el navegador.'], 'warning');
  }
};

const cargarTareas = () => {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error('Datos inválidos en localStorage:', error);
    return [];
  }
};

document.addEventListener('DOMContentLoaded', () => {
  tareas = cargarTareas();
  renderTareas();
});
