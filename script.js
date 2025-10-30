// ===== ESTADO DE LA APLICACIÓN =====
let appState = {
    currentPageIndex: 0, // 0 = portada, 1 = página vacía, 2 = índice, 3+ = páginas de contenido
    viewMode: false, // false = edición, true = visualización
    coverData: {
        title: 'Mi Diario de Viajes',
        subtitle: 'Memorias y Aventuras',
        color: '#8b4513',
        texture: 'leather',
        image: null
    },
    pages: [], // Páginas de contenido del usuario
    isFlipping: false,
    bookOpened: false,
    currentPageTemplate: null,
    currentTemplatePageIndex: null,
    // Estado de rotación 3D
    rotation: {
        x: 0,
        y: 355,
        isDragging: false,
        startX: 0,
        startY: 0,
        startRotX: 0,
        startRotY: 355
    },
    // Estado de arrastre de página
    pageDrag: {
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        direction: null // 'next' o 'prev'
    }
};

// ===== ELEMENTOS DEL DOM =====
const elements = {
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageCounter: document.getElementById('pageCounter'),
    addPageBtn: document.getElementById('addPageBtn'),
    viewIndexBtn: document.getElementById('viewIndexBtn'),
    frontCover: document.querySelector('.front-cover'),
    pagesContainer: document.querySelector('.pages-container'),
    leftPageContent: document.getElementById('leftPageContent'),
    frontPageContent: document.getElementById('frontPageContent'),
    backPageContent: document.getElementById('backPageContent'),
    rightPage: document.getElementById('currentPage'),
    coverTitle: document.getElementById('coverTitle'),
    coverSubtitle: document.getElementById('coverSubtitle'),
    customizeCoverBtn: document.getElementById('customizeCoverBtn'),
    coverModal: document.getElementById('coverModal'),
    closeCoverModal: document.getElementById('closeCoverModal'),
    templateModal: document.getElementById('templateModal'),
    closeTemplateModal: document.getElementById('closeTemplateModal'),
    coverImageInput: document.getElementById('coverImageInput'),
    // Nuevos elementos
    editModeBtn: document.getElementById('editModeBtn'),
    viewModeBtn: document.getElementById('viewModeBtn'),
    notebook: document.querySelector('.notebook-3d'),
    rotationSlider: document.getElementById('rotationSlider'),
    rotationValue: document.getElementById('rotationValue'),
    rotateLeftBtn: document.getElementById('rotateLeftBtn'),
    rotateRightBtn: document.getElementById('rotateRightBtn'),
    resetRotationBtn: document.getElementById('resetRotationBtn'),
    cornerBottomRight: document.getElementById('cornerBottomRight'),
    cornerBottomLeft: document.getElementById('cornerBottomLeft'),
    editModeControls: document.querySelectorAll('.edit-mode-controls'),
    viewModeControls: document.querySelectorAll('.view-mode-controls')
};

// ===== INICIALIZACIÓN =====
function init() {
    loadData();
    setupEventListeners();
    updateDisplay();
    applyRotation();
}

// ===== CARGAR Y GUARDAR DATOS =====
function loadData() {
    try {
        const savedCover = localStorage.getItem('diarioCoverData');
        const savedPages = localStorage.getItem('diarioPages');

        if (savedCover) {
            appState.coverData = JSON.parse(savedCover);
            applyCoverCustomization();
        }

        if (savedPages) {
            appState.pages = JSON.parse(savedPages);
        } else {
            // Crear páginas de ejemplo
            appState.pages = [
                { location: '', template: 'single', photos: [''], notes: '' },
                { location: '', template: 'single', photos: [''], notes: '' }
            ];
        }
    } catch (e) {
        console.error('Error cargando datos:', e);
    }
}

function saveData() {
    try {
        localStorage.setItem('diarioCoverData', JSON.stringify(appState.coverData));
        localStorage.setItem('diarioPages', JSON.stringify(appState.pages));
    } catch (e) {
        console.error('Error guardando datos:', e);
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Cambio de modo
    elements.editModeBtn.addEventListener('click', () => switchMode(false));
    elements.viewModeBtn.addEventListener('click', () => switchMode(true));

    // Navegación (modo edición)
    elements.prevBtn.addEventListener('click', goToPreviousPage);
    elements.nextBtn.addEventListener('click', goToNextPage);

    // Acciones
    elements.addPageBtn.addEventListener('click', addNewPage);
    elements.viewIndexBtn.addEventListener('click', showIndex);

    // Portada
    elements.customizeCoverBtn.addEventListener('click', () => {
        elements.coverModal.classList.add('show');
    });

    elements.coverTitle.addEventListener('input', (e) => {
        appState.coverData.title = e.target.textContent;
        saveData();
    });

    elements.coverSubtitle.addEventListener('input', (e) => {
        appState.coverData.subtitle = e.target.textContent;
        saveData();
    });

    // Modal de personalización de portada
    elements.closeCoverModal.addEventListener('click', () => {
        elements.coverModal.classList.remove('show');
    });

    elements.coverModal.addEventListener('click', (e) => {
        if (e.target === elements.coverModal) {
            elements.coverModal.classList.remove('show');
        }
    });

    // Botones de color
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = e.target.getAttribute('data-color');
            appState.coverData.color = color;
            applyCoverCustomization();
            saveData();
        });
    });

    // Botones de textura
    document.querySelectorAll('.texture-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const texture = e.target.getAttribute('data-texture');
            appState.coverData.texture = texture;
            applyCoverCustomization();
            saveData();
        });
    });

    // Imagen de portada
    elements.coverImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                appState.coverData.image = event.target.result;
                applyCoverCustomization();
                saveData();
            };
            reader.readAsDataURL(file);
        }
    });

    // Modal de plantillas
    elements.closeTemplateModal.addEventListener('click', () => {
        elements.templateModal.classList.remove('show');
    });

    elements.templateModal.addEventListener('click', (e) => {
        if (e.target === elements.templateModal) {
            elements.templateModal.classList.remove('show');
        }
    });

    // Opciones de plantillas
    document.querySelectorAll('.template-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const template = e.currentTarget.getAttribute('data-template');
            selectTemplate(template);
        });
    });

    // === EVENTOS DE MODO VISUALIZACIÓN ===

    // Rotación con slider
    elements.rotationSlider.addEventListener('input', (e) => {
        appState.rotation.y = parseInt(e.target.value);
        elements.rotationValue.textContent = appState.rotation.y + '°';
        applyRotation();
    });

    // Botones de rotación
    elements.rotateLeftBtn.addEventListener('click', () => {
        appState.rotation.y = (appState.rotation.y + 15) % 360;
        elements.rotationSlider.value = appState.rotation.y;
        elements.rotationValue.textContent = appState.rotation.y + '°';
        applyRotation();
    });

    elements.rotateRightBtn.addEventListener('click', () => {
        appState.rotation.y = (appState.rotation.y - 15 + 360) % 360;
        elements.rotationSlider.value = appState.rotation.y;
        elements.rotationValue.textContent = appState.rotation.y + '°';
        applyRotation();
    });

    elements.resetRotationBtn.addEventListener('click', () => {
        appState.rotation.y = 355;
        appState.rotation.x = 0;
        elements.rotationSlider.value = 355;
        elements.rotationValue.textContent = '355°';
        applyRotation();
    });

    // Rotación con arrastre del mouse
    elements.notebook.addEventListener('mousedown', startNotebookDrag);
    document.addEventListener('mousemove', handleNotebookDrag);
    document.addEventListener('mouseup', stopNotebookDrag);

    // Arrastre de páginas desde esquinas
    elements.cornerBottomRight.addEventListener('mousedown', (e) => startPageDrag(e, 'next'));
    elements.cornerBottomLeft.addEventListener('mousedown', (e) => startPageDrag(e, 'prev'));
    document.addEventListener('mousemove', handlePageDrag);
    document.addEventListener('mouseup', stopPageDrag);
}

// ===== CAMBIO DE MODO =====
function switchMode(viewMode) {
    appState.viewMode = viewMode;

    if (viewMode) {
        // Cambiar a modo visualización
        elements.editModeBtn.classList.remove('active');
        elements.viewModeBtn.classList.add('active');
        elements.notebook.classList.add('view-mode');

        // Ocultar controles de edición
        elements.editModeControls.forEach(el => el.style.display = 'none');
        // Mostrar controles de visualización
        elements.viewModeControls.forEach(el => el.style.display = 'flex');

        // Mostrar esquinas si el libro está abierto
        if (appState.bookOpened) {
            updateCornerVisibility();
        }
    } else {
        // Cambiar a modo edición
        elements.viewModeBtn.classList.remove('active');
        elements.editModeBtn.classList.add('active');
        elements.notebook.classList.remove('view-mode');

        // Mostrar controles de edición
        elements.editModeControls.forEach(el => el.style.display = 'flex');
        // Ocultar controles de visualización
        elements.viewModeControls.forEach(el => el.style.display = 'none');

        // Ocultar esquinas
        elements.cornerBottomRight.style.display = 'none';
        elements.cornerBottomLeft.style.display = 'none';
    }
}

// ===== ROTACIÓN 3D DEL CUADERNO =====
function applyRotation() {
    const { x, y } = appState.rotation;
    elements.notebook.style.setProperty('--rotation-x', `${x}deg`);
    elements.notebook.style.setProperty('--rotation-y', `${y}deg`);
}

function startNotebookDrag(e) {
    if (!appState.viewMode || appState.pageDrag.isDragging) return;

    appState.rotation.isDragging = true;
    appState.rotation.startX = e.clientX;
    appState.rotation.startY = e.clientY;
    appState.rotation.startRotX = appState.rotation.x;
    appState.rotation.startRotY = appState.rotation.y;
}

function handleNotebookDrag(e) {
    if (!appState.rotation.isDragging) return;

    const deltaX = e.clientX - appState.rotation.startX;
    const deltaY = e.clientY - appState.rotation.startY;

    appState.rotation.y = (appState.rotation.startRotY - deltaX * 0.5 + 360) % 360;
    appState.rotation.x = Math.max(-30, Math.min(30, appState.rotation.startRotX + deltaY * 0.2));

    elements.rotationSlider.value = appState.rotation.y;
    elements.rotationValue.textContent = Math.round(appState.rotation.y) + '°';

    applyRotation();
}

function stopNotebookDrag() {
    appState.rotation.isDragging = false;
}

// ===== ARRASTRE DE PÁGINAS DESDE ESQUINAS =====
function startPageDrag(e, direction) {
    if (!appState.viewMode || appState.isFlipping) return;

    e.preventDefault();
    appState.pageDrag.isDragging = true;
    appState.pageDrag.direction = direction;
    appState.pageDrag.startX = e.clientX;
    appState.pageDrag.startY = e.clientY;
    appState.pageDrag.currentX = e.clientX;
    appState.pageDrag.currentY = e.clientY;

    elements.rightPage.classList.add('dragging');
}

function handlePageDrag(e) {
    if (!appState.pageDrag.isDragging) return;

    e.preventDefault();
    appState.pageDrag.currentX = e.clientX;
    appState.pageDrag.currentY = e.clientY;

    const deltaX = appState.pageDrag.currentX - appState.pageDrag.startX;
    const deltaY = appState.pageDrag.currentY - appState.pageDrag.startY;

    // Calcular el ángulo de rotación basado en el arrastre
    let angle = 0;
    let foldShadow = 0;

    if (appState.pageDrag.direction === 'next') {
        // Arrastar hacia la izquierda
        angle = Math.max(-180, Math.min(0, deltaX * 0.5));
        foldShadow = Math.abs(angle) / 180;
    } else {
        // Arrastar hacia la derecha (para volver)
        angle = Math.max(0, Math.min(180, -deltaX * 0.5));
        foldShadow = Math.abs(angle) / 180;
    }

    // Aplicar transformación de doblez
    elements.rightPage.style.transform = `rotateY(${angle}deg)`;
    elements.rightPage.style.setProperty('--fold-shadow', foldShadow);
}

function stopPageDrag() {
    if (!appState.pageDrag.isDragging) return;

    const deltaX = appState.pageDrag.currentX - appState.pageDrag.startX;
    const threshold = 150; // Distancia mínima para cambiar de página

    let shouldChangePage = false;

    if (appState.pageDrag.direction === 'next' && deltaX < -threshold) {
        shouldChangePage = true;
        // Completar animación hacia adelante
        elements.rightPage.style.transition = 'transform 0.6s ease-out';
        elements.rightPage.style.transform = 'rotateY(-180deg)';

        setTimeout(() => {
            goToNextPage();
            elements.rightPage.classList.remove('dragging');
            elements.rightPage.style.transition = '';
            elements.rightPage.style.transform = '';
            elements.rightPage.style.setProperty('--fold-shadow', 0);
        }, 600);
    } else if (appState.pageDrag.direction === 'prev' && deltaX > threshold) {
        shouldChangePage = true;
        // Completar animación hacia atrás
        elements.rightPage.style.transition = 'transform 0.6s ease-out';
        elements.rightPage.style.transform = 'rotateY(180deg)';

        setTimeout(() => {
            goToPreviousPage();
            elements.rightPage.classList.remove('dragging');
            elements.rightPage.style.transition = '';
            elements.rightPage.style.transform = '';
            elements.rightPage.style.setProperty('--fold-shadow', 0);
        }, 600);
    } else {
        // Volver a la posición original
        elements.rightPage.style.transition = 'transform 0.4s ease-out';
        elements.rightPage.style.transform = 'rotateY(0deg)';
        elements.rightPage.style.setProperty('--fold-shadow', 0);

        setTimeout(() => {
            elements.rightPage.classList.remove('dragging');
            elements.rightPage.style.transition = '';
            elements.rightPage.style.transform = '';
        }, 400);
    }

    appState.pageDrag.isDragging = false;
    appState.pageDrag.direction = null;
}

// Actualizar visibilidad de esquinas
function updateCornerVisibility() {
    if (!appState.viewMode || !appState.bookOpened) {
        elements.cornerBottomRight.style.display = 'none';
        elements.cornerBottomLeft.style.display = 'none';
        return;
    }

    const totalPages = getTotalPages();

    // Mostrar esquina derecha si hay página siguiente
    if (appState.currentPageIndex < totalPages - 1) {
        elements.cornerBottomRight.style.display = 'block';
    } else {
        elements.cornerBottomRight.style.display = 'none';
    }

    // Mostrar esquina izquierda si hay página anterior
    if (appState.currentPageIndex > 1) {
        elements.cornerBottomLeft.style.display = 'block';
    } else {
        elements.cornerBottomLeft.style.display = 'none';
    }
}

// ===== PERSONALIZACIÓN DE PORTADA =====
function applyCoverCustomization() {
    const { color, texture, image, title, subtitle } = appState.coverData;

    elements.coverTitle.textContent = title;
    elements.coverSubtitle.textContent = subtitle;

    // Aplicar color
    let baseColor = color || '#8b4513';
    let darkerColor = adjustBrightness(baseColor, -20);

    elements.frontCover.style.background = `linear-gradient(135deg, ${baseColor} 0%, ${darkerColor} 100%)`;

    // Aplicar imagen
    if (image) {
        elements.frontCover.style.backgroundImage = `url(${image})`;
        elements.frontCover.style.backgroundSize = 'cover';
        elements.frontCover.style.backgroundPosition = 'center';
        elements.frontCover.style.backgroundBlend = 'overlay';
    }
}

function adjustBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// ===== NAVEGACIÓN =====
function goToPreviousPage() {
    if (appState.isFlipping || appState.currentPageIndex === 0) return;

    appState.isFlipping = true;

    if (appState.currentPageIndex === 1 && appState.bookOpened) {
        // Cerrar el libro
        elements.frontCover.classList.remove('open');
        elements.pagesContainer.classList.remove('visible');
        appState.bookOpened = false;
        appState.currentPageIndex = 0;

        setTimeout(() => {
            appState.isFlipping = false;
            updateDisplay();
            updateCornerVisibility();
        }, 600);
    } else {
        // Navegación normal
        elements.rightPage.classList.remove('flipping');

        setTimeout(() => {
            appState.currentPageIndex--;
            updateDisplay();
            updateCornerVisibility();
            appState.isFlipping = false;
        }, 800);
    }
}

function goToNextPage() {
    const totalPages = getTotalPages();
    if (appState.isFlipping || appState.currentPageIndex >= totalPages - 1) return;

    appState.isFlipping = true;

    if (appState.currentPageIndex === 0 && !appState.bookOpened) {
        // Abrir el libro
        elements.frontCover.classList.add('open');
        appState.bookOpened = true;

        setTimeout(() => {
            elements.pagesContainer.classList.add('visible');
            appState.currentPageIndex = 1;
            updateDisplay();
            updateCornerVisibility();
            appState.isFlipping = false;
        }, 600);
    } else {
        // Navegación normal
        elements.rightPage.classList.add('flipping');

        setTimeout(() => {
            appState.currentPageIndex++;
            elements.rightPage.classList.remove('flipping');
            updateDisplay();
            updateCornerVisibility();
            appState.isFlipping = false;
        }, 800);
    }
}

function goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= getTotalPages()) return;

    // Cerrar el modal de índice si está abierto
    elements.templateModal.classList.remove('show');

    // Simular navegación
    appState.currentPageIndex = pageIndex;

    if (!appState.bookOpened && pageIndex > 0) {
        elements.frontCover.classList.add('open');
        elements.pagesContainer.classList.add('visible');
        appState.bookOpened = true;
    }

    updateDisplay();
    updateCornerVisibility();
}

function getTotalPages() {
    // Portada + Página vacía + Índice + Páginas de contenido
    return 3 + appState.pages.length;
}

// ===== ACTUALIZAR DISPLAY =====
function updateDisplay() {
    const { currentPageIndex } = appState;

    // Actualizar botones
    elements.prevBtn.disabled = currentPageIndex === 0;
    elements.nextBtn.disabled = currentPageIndex >= getTotalPages() - 1;

    // Actualizar contador de página
    if (currentPageIndex === 0) {
        elements.pageCounter.textContent = 'Portada';
    } else if (currentPageIndex === 1) {
        elements.pageCounter.textContent = 'Inicio';
    } else if (currentPageIndex === 2) {
        elements.pageCounter.textContent = 'Índice';
    } else {
        elements.pageCounter.textContent = `Página ${currentPageIndex - 2}`;
    }

    // Actualizar contenido de páginas
    updatePageContent();
}

function updatePageContent() {
    const { currentPageIndex } = appState;

    // Determinar qué mostrar en la página izquierda
    if (currentPageIndex === 1) {
        // Página vacía tras la portada
        elements.leftPageContent.innerHTML = '<div style="height: 100%;"></div>';
    } else if (currentPageIndex === 2) {
        // Mostrar página vacía a la izquierda del índice
        elements.leftPageContent.innerHTML = '<div style="height: 100%;"></div>';
    } else if (currentPageIndex > 2) {
        const leftContentPageIndex = currentPageIndex - 3;
        if (leftContentPageIndex >= 0 && leftContentPageIndex < appState.pages.length) {
            elements.leftPageContent.innerHTML = renderPageReadOnly(appState.pages[leftContentPageIndex]);
        } else if (currentPageIndex === 3) {
            // Primera página de contenido, mostrar el índice a la izquierda
            elements.leftPageContent.innerHTML = renderIndex();
        }
    }

    // Determinar qué mostrar en la página derecha (frontal)
    if (currentPageIndex === 1) {
        // Página vacía
        elements.frontPageContent.innerHTML = '<div style="height: 100%;"></div>';
    } else if (currentPageIndex === 2) {
        // Índice
        elements.frontPageContent.innerHTML = renderIndex();
    } else if (currentPageIndex >= 3) {
        const frontContentPageIndex = currentPageIndex - 3;
        if (frontContentPageIndex >= 0 && frontContentPageIndex < appState.pages.length) {
            elements.frontPageContent.innerHTML = renderPageEditable(frontContentPageIndex);
            attachPageEventListeners(frontContentPageIndex, 'front');
        }
    }

    // Determinar qué mostrar en la página derecha (trasera)
    if (currentPageIndex === 1) {
        // Índice
        elements.backPageContent.innerHTML = renderIndex();
    } else if (currentPageIndex === 2) {
        const backContentPageIndex = 0;
        if (backContentPageIndex < appState.pages.length) {
            elements.backPageContent.innerHTML = renderPageEditable(backContentPageIndex);
            attachPageEventListeners(backContentPageIndex, 'back');
        }
    } else if (currentPageIndex >= 3) {
        const backContentPageIndex = currentPageIndex - 2;
        if (backContentPageIndex < appState.pages.length) {
            elements.backPageContent.innerHTML = renderPageEditable(backContentPageIndex);
            attachPageEventListeners(backContentPageIndex, 'back');
        } else {
            elements.backPageContent.innerHTML = '<p style="text-align: center; color: #bcaaa4; margin-top: 50px;">Fin del diario</p>';
        }
    }
}

// ===== RENDERIZAR PÁGINAS =====
function renderIndex() {
    const items = appState.pages
        .map((page, index) => {
            const title = page.location || `Página ${index + 1}`;
            const pageNum = index + 1;
            return `
                <li class="index-item" data-page-index="${index + 3}">
                    <span class="index-item-title">${title}</span>
                    <span class="index-item-page">Pág. ${pageNum}</span>
                </li>
            `;
        })
        .join('');

    return `
        <div class="index-page">
            <h2 class="index-title">Índice</h2>
            <ul class="index-list">
                ${items.length > 0 ? items : '<li style="text-align: center; color: #bcaaa4; padding: 20px;">No hay páginas aún</li>'}
            </ul>
        </div>
    `;
}

function renderPageReadOnly(pageData) {
    const photoHTML = pageData.photos && pageData.photos.filter(p => p).length > 0
        ? renderPhotoTemplateReadOnly(pageData.template, pageData.photos)
        : '';

    return `
        <div style="height: 100%; display: flex; flex-direction: column; gap: 15px;">
            <h3 style="color: #4e342e; font-size: 1.5em; margin-bottom: 10px;">${pageData.location || 'Sin título'}</h3>
            ${photoHTML}
            <div style="color: #6d4c41; line-height: 1.6; font-size: 1em; flex: 1; overflow-y: auto;">
                ${pageData.notes || 'Sin notas'}
            </div>
        </div>
    `;
}

function renderPageEditable(pageIndex) {
    const pageData = appState.pages[pageIndex];

    return `
        <input type="text"
               class="location-input"
               placeholder="Nombre del lugar o país"
               data-page-index="${pageIndex}"
               value="${pageData.location || ''}">

        <div class="photo-template-container ${pageData.template || 'template-single'}"
             id="photo-container-${pageIndex}">
            <div class="template-selector">
                <button class="select-template-btn" data-page-index="${pageIndex}">
                    📐 Cambiar diseño
                </button>
            </div>
            ${renderPhotoTemplate(pageData.template || 'single', pageData.photos || [''], pageIndex)}
        </div>

        <textarea class="notes-area"
                  placeholder="Escribe tus recuerdos aquí..."
                  data-page-index="${pageIndex}">${pageData.notes || ''}</textarea>
    `;
}

function renderPhotoTemplate(template, photos, pageIndex) {
    const templates = {
        'single': 1,
        'double-horizontal': 2,
        'double-vertical': 2,
        'triple': 3,
        'quad': 4,
        'collage': 3
    };

    const numSlots = templates[template] || 1;
    const slots = [];

    for (let i = 0; i < numSlots; i++) {
        const photo = photos[i] || '';
        slots.push(`
            <div class="photo-slot" data-slot-index="${i}">
                ${photo ? `<img src="${photo}" alt="Foto ${i + 1}">` : `
                    <label class="photo-slot-label" for="photo-input-${pageIndex}-${i}">
                        <span class="photo-slot-icon">📷</span>
                        <span>Agregar foto</span>
                    </label>
                `}
                <input type="file"
                       id="photo-input-${pageIndex}-${i}"
                       data-page-index="${pageIndex}"
                       data-slot-index="${i}"
                       accept="image/*">
            </div>
        `);
    }

    return slots.join('');
}

function renderPhotoTemplateReadOnly(template, photos) {
    const validPhotos = photos.filter(p => p);
    if (validPhotos.length === 0) return '';

    const photoElements = validPhotos.map(photo =>
        `<img src="${photo}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">`
    ).join('');

    return `<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">${photoElements}</div>`;
}

// ===== EVENTOS DE PÁGINA =====
function attachPageEventListeners(pageIndex, side) {
    // Input de ubicación
    const locationInput = document.querySelector(`input[data-page-index="${pageIndex}"]`);
    if (locationInput) {
        locationInput.addEventListener('input', (e) => {
            appState.pages[pageIndex].location = e.target.value;
            saveData();
        });
    }

    // Textarea de notas
    const notesArea = document.querySelector(`textarea[data-page-index="${pageIndex}"]`);
    if (notesArea) {
        notesArea.addEventListener('input', (e) => {
            appState.pages[pageIndex].notes = e.target.value;
            saveData();
        });
    }

    // Botón de cambiar plantilla
    const templateBtn = document.querySelector(`button[data-page-index="${pageIndex}"]`);
    if (templateBtn) {
        templateBtn.addEventListener('click', (e) => {
            appState.currentTemplatePageIndex = pageIndex;
            elements.templateModal.classList.add('show');
        });
    }

    // Inputs de fotos
    const photoInputs = document.querySelectorAll(`input[type="file"][data-page-index="${pageIndex}"]`);
    photoInputs.forEach(input => {
        input.addEventListener('change', handlePhotoUpload);
    });

    // Clicks en índice
    const indexItems = document.querySelectorAll('.index-item');
    indexItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const targetPage = parseInt(e.currentTarget.getAttribute('data-page-index'));
            goToPage(targetPage);
        });
    });
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const pageIndex = parseInt(e.target.getAttribute('data-page-index'));
    const slotIndex = parseInt(e.target.getAttribute('data-slot-index'));

    const reader = new FileReader();
    reader.onload = (event) => {
        if (!appState.pages[pageIndex].photos) {
            appState.pages[pageIndex].photos = [];
        }
        appState.pages[pageIndex].photos[slotIndex] = event.target.result;
        saveData();
        updatePageContent();
    };
    reader.readAsDataURL(file);
}

// ===== PLANTILLAS =====
function selectTemplate(template) {
    const pageIndex = appState.currentTemplatePageIndex;
    if (pageIndex === null) return;

    appState.pages[pageIndex].template = template;

    // Reiniciar fotos si cambia el template
    const templates = {
        'single': 1,
        'double-horizontal': 2,
        'double-vertical': 2,
        'triple': 3,
        'quad': 4,
        'collage': 3
    };

    const numSlots = templates[template] || 1;
    appState.pages[pageIndex].photos = new Array(numSlots).fill('');

    saveData();
    updatePageContent();
    elements.templateModal.classList.remove('show');
}

// ===== AGREGAR PÁGINA =====
function addNewPage() {
    appState.pages.push({
        location: '',
        template: 'single',
        photos: [''],
        notes: ''
    });

    saveData();

    // Feedback visual
    const originalText = elements.addPageBtn.textContent;
    elements.addPageBtn.textContent = '✓ Página agregada';
    elements.addPageBtn.style.background = 'linear-gradient(135deg, #66bb6a, #4caf50)';

    setTimeout(() => {
        elements.addPageBtn.textContent = originalText;
        elements.addPageBtn.style.background = '';
    }, 2000);
}

// ===== MOSTRAR ÍNDICE =====
function showIndex() {
    goToPage(2); // El índice está en la posición 2
}

// ===== INICIAR APLICACIÓN =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
