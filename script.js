// ===== ESTADO DE LA APLICACIÓN =====
let appState = {
    currentPageIndex: 0, // 0 = portada, 1 = página vacía, 2 = índice, 3+ = páginas de contenido
    viewMode: true, // true = visualización por defecto, false = edición
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
    // Estado de arrastre de página
    pageDrag: {
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        progress: 0 // 0 a 1 para animación suave
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
    // Elementos actualizados
    editModeToggle: document.getElementById('editModeToggle'),
    notebook: document.querySelector('.notebook-3d'),
    cornerAreaRight: document.getElementById('cornerAreaRight'),
    cornerAreaLeft: document.getElementById('cornerAreaLeft'),
    viewModeHint: document.getElementById('viewModeHint'),
    editModeControls: document.querySelectorAll('.edit-mode-controls')
};

// ===== INICIALIZACIÓN =====
function init() {
    loadData();
    setupEventListeners();
    switchMode(true); // Iniciar en modo visualización
    updateDisplay();
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
    // Cambio de modo con icono de brocha
    elements.editModeToggle.addEventListener('click', () => {
        switchMode(!appState.viewMode);
    });

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

    // === EVENTOS DE ARRASTRE DE PÁGINAS ===
    elements.cornerAreaRight.addEventListener('mousedown', (e) => startPageDrag(e, 'next'));
    elements.cornerAreaLeft.addEventListener('mousedown', (e) => startPageDrag(e, 'prev'));
    document.addEventListener('mousemove', handlePageDrag);
    document.addEventListener('mouseup', stopPageDrag);

    // Touch events para móviles
    elements.cornerAreaRight.addEventListener('touchstart', (e) => startPageDrag(e.touches[0], 'next'));
    elements.cornerAreaLeft.addEventListener('touchstart', (e) => startPageDrag(e.touches[0], 'prev'));
    document.addEventListener('touchmove', (e) => {
        if (appState.pageDrag.isDragging) {
            e.preventDefault();
            handlePageDrag(e.touches[0]);
        }
    }, { passive: false });
    document.addEventListener('touchend', stopPageDrag);
}

// ===== CAMBIO DE MODO =====
function switchMode(viewMode) {
    appState.viewMode = viewMode;

    if (viewMode) {
        // Cambiar a modo visualización
        elements.editModeToggle.classList.remove('active');
        elements.notebook.classList.add('view-mode');

        // Ocultar controles de edición
        elements.editModeControls.forEach(el => el.style.display = 'none');

        // Mostrar mensaje de ayuda
        if (elements.viewModeHint) {
            elements.viewModeHint.style.display = 'block';
        }

        // Mostrar esquinas si el libro está abierto
        if (appState.bookOpened) {
            updateCornerVisibility();
        }
    } else {
        // Cambiar a modo edición
        elements.editModeToggle.classList.add('active');
        elements.notebook.classList.remove('view-mode');

        // Mostrar controles de edición
        elements.editModeControls.forEach(el => el.style.display = 'flex');

        // Ocultar mensaje de ayuda
        if (elements.viewModeHint) {
            elements.viewModeHint.style.display = 'none';
        }

        // Ocultar esquinas
        elements.cornerAreaRight.classList.remove('visible');
        elements.cornerAreaLeft.classList.remove('visible');
    }
}


// ===== ARRASTRE DE PÁGINAS MEJORADO =====
function startPageDrag(e, direction) {
    if (!appState.viewMode || appState.isFlipping) return;

    e.preventDefault();

    // Determinar si se puede avanzar o retroceder
    const totalPages = getTotalPages();
    if (direction === 'next' && appState.currentPageIndex >= totalPages - 1) return;
    if (direction === 'prev' && appState.currentPageIndex <= 1) return;

    appState.pageDrag.isDragging = true;
    appState.pageDrag.startX = e.clientX || e.pageX;
    appState.pageDrag.startY = e.clientY || e.pageY;
    appState.pageDrag.currentX = appState.pageDrag.startX;
    appState.pageDrag.currentY = appState.pageDrag.startY;
    appState.pageDrag.progress = 0;

    // Guardar dirección según la esquina
    appState.pageDrag.direction = direction;

    elements.rightPage.classList.add('dragging');

    // Ocultar esquinas durante el arrastre
    elements.cornerAreaRight.style.opacity = '0';
    elements.cornerAreaLeft.style.opacity = '0';
}

function handlePageDrag(e) {
    if (!appState.pageDrag.isDragging) return;

    e.preventDefault();
    appState.pageDrag.currentX = e.clientX || e.pageX;
    appState.pageDrag.currentY = e.clientY || e.pageY;

    const deltaX = appState.pageDrag.currentX - appState.pageDrag.startX;
    const maxDrag = 300; // Distancia máxima de arrastre

    // Calcular progreso (0 a 1)
    let progress = 0;

    if (appState.pageDrag.direction === 'next') {
        // Arrastar hacia la izquierda (negativo)
        progress = Math.max(0, Math.min(1, -deltaX / maxDrag));
    } else {
        // Arrastar hacia la derecha (positivo)
        progress = Math.max(0, Math.min(1, deltaX / maxDrag));
    }

    appState.pageDrag.progress = progress;

    // Ángulo de rotación suave
    const angle = appState.pageDrag.direction === 'next'
        ? -180 * progress
        : 180 * (1 - progress);

    // Aplicar transformación
    elements.rightPage.style.transform = `rotateY(${angle}deg)`;
    elements.rightPage.style.setProperty('--fold-shadow', progress);
}

function stopPageDrag() {
    if (!appState.pageDrag.isDragging) return;

    const threshold = 0.5; // 50% de progreso mínimo

    // Restaurar visibilidad de esquinas
    elements.cornerAreaRight.style.opacity = '';
    elements.cornerAreaLeft.style.opacity = '';

    if (appState.pageDrag.progress >= threshold) {
        // Completar el volteo
        elements.rightPage.style.transition = 'transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1)';

        if (appState.pageDrag.direction === 'next') {
            elements.rightPage.style.transform = 'rotateY(-180deg)';
            setTimeout(() => {
                goToNextPage();
                resetPageDragState();
            }, 500);
        } else {
            elements.rightPage.style.transform = 'rotateY(180deg)';
            setTimeout(() => {
                goToPreviousPage();
                resetPageDragState();
            }, 500);
        }
    } else {
        // Volver a la posición original (cancelar)
        elements.rightPage.style.transition = 'transform 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)';
        elements.rightPage.style.transform = 'rotateY(0deg)';
        elements.rightPage.style.setProperty('--fold-shadow', 0);

        setTimeout(() => {
            resetPageDragState();
        }, 300);
    }

    appState.pageDrag.isDragging = false;
}

function resetPageDragState() {
    elements.rightPage.classList.remove('dragging');
    elements.rightPage.style.transition = '';
    elements.rightPage.style.transform = '';
    elements.rightPage.style.setProperty('--fold-shadow', 0);
    appState.pageDrag.progress = 0;
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
