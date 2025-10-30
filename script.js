// ===== ESTADO DE LA APLICACIÓN =====
let appState = {
    currentPageIndex: 0, // 0 = portada, 1 = página vacía, 2 = índice, 3+ = páginas de contenido
    viewMode: true, // true = visualización, false = edición
    coverData: {
        title: 'Mi Diario de Viajes',
        subtitle: 'Memorias y Aventuras',
        color: '#8b4513',
        texture: 'leather',
        image: null
    },
    pages: [], // Array de páginas con elementos posicionados
    isFlipping: false,
    bookOpened: false,
    selectedElement: null,
    draggedElement: null,
    nextElementId: 1
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
    coverImageInput: document.getElementById('coverImageInput'),
    editModeToggle: document.getElementById('editModeToggle'),
    notebook: document.querySelector('.notebook-3d'),
    leftArrow: document.getElementById('leftArrow'),
    rightArrow: document.getElementById('rightArrow'),
    navArrows: document.getElementById('navArrows'),
    sidebarMenu: document.getElementById('sidebarMenu'),
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
            // Actualizar nextElementId basado en los elementos existentes
            let maxId = 0;
            appState.pages.forEach(page => {
                if (page.elements) {
                    page.elements.forEach(el => {
                        if (el.id > maxId) maxId = el.id;
                    });
                }
            });
            appState.nextElementId = maxId + 1;
        } else {
            // Crear páginas de ejemplo vacías
            appState.pages = [
                { elements: [] },
                { elements: [] }
            ];
        }
    } catch (e) {
        console.error('Error cargando datos:', e);
        appState.pages = [{ elements: [] }, { elements: [] }];
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

    // Navegación
    elements.prevBtn.addEventListener('click', goToPreviousPage);
    elements.nextBtn.addEventListener('click', goToNextPage);
    elements.leftArrow.addEventListener('click', goToPreviousPage);
    elements.rightArrow.addEventListener('click', goToNextPage);

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

    // Drag and Drop de elementos desde el sidebar
    setupDragAndDrop();
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

        // Mostrar flechas de navegación
        elements.navArrows.style.display = 'flex';
        updateArrowVisibility();
    } else {
        // Cambiar a modo edición
        elements.editModeToggle.classList.add('active');
        elements.notebook.classList.remove('view-mode');

        // Mostrar controles de edición
        elements.editModeControls.forEach(el => el.style.display = 'flex');

        // Ocultar flechas de navegación
        elements.navArrows.style.display = 'none';
    }

    // Actualizar display para reflejar el nuevo modo
    updateDisplay();
}

// ===== ACTUALIZAR VISIBILIDAD DE FLECHAS =====
function updateArrowVisibility() {
    if (!appState.viewMode) {
        elements.navArrows.style.display = 'none';
        return;
    }

    const totalPages = getTotalPages();

    // Deshabilitar flecha izquierda si estamos en la portada
    if (appState.currentPageIndex === 0) {
        elements.leftArrow.disabled = true;
    } else {
        elements.leftArrow.disabled = false;
    }

    // Deshabilitar flecha derecha si estamos en la última página
    if (appState.currentPageIndex >= totalPages - 1) {
        elements.rightArrow.disabled = true;
    } else {
        elements.rightArrow.disabled = false;
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
            updateArrowVisibility();
        }, 600);
    } else {
        // Navegación normal - animación hacia atrás
        elements.rightPage.style.transform = 'rotateY(180deg)';

        setTimeout(() => {
            appState.currentPageIndex--;
            updateDisplay();
            elements.rightPage.style.transform = '';
            updateArrowVisibility();
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
            updateArrowVisibility();
            appState.isFlipping = false;
        }, 600);
    } else {
        // Navegación normal
        elements.rightPage.classList.add('flipping');

        setTimeout(() => {
            appState.currentPageIndex++;
            elements.rightPage.classList.remove('flipping');
            updateDisplay();
            updateArrowVisibility();
            appState.isFlipping = false;
        }, 800);
    }
}

function goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= getTotalPages()) return;

    appState.currentPageIndex = pageIndex;

    if (!appState.bookOpened && pageIndex > 0) {
        elements.frontCover.classList.add('open');
        elements.pagesContainer.classList.add('visible');
        appState.bookOpened = true;
    }

    updateDisplay();
    updateArrowVisibility();
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
            elements.leftPageContent.innerHTML = renderPage(appState.pages[leftContentPageIndex], false);
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
            elements.frontPageContent.innerHTML = renderPage(appState.pages[frontContentPageIndex], !appState.viewMode);
            if (!appState.viewMode) {
                attachElementEventListeners(frontContentPageIndex, 'front');
            }
        }
    }

    // Determinar qué mostrar en la página derecha (trasera)
    if (currentPageIndex === 1) {
        // Índice
        elements.backPageContent.innerHTML = renderIndex();
    } else if (currentPageIndex === 2) {
        const backContentPageIndex = 0;
        if (backContentPageIndex < appState.pages.length) {
            elements.backPageContent.innerHTML = renderPage(appState.pages[backContentPageIndex], !appState.viewMode);
            if (!appState.viewMode) {
                attachElementEventListeners(backContentPageIndex, 'back');
            }
        }
    } else if (currentPageIndex >= 3) {
        const backContentPageIndex = currentPageIndex - 2;
        if (backContentPageIndex < appState.pages.length) {
            elements.backPageContent.innerHTML = renderPage(appState.pages[backContentPageIndex], !appState.viewMode);
            if (!appState.viewMode) {
                attachElementEventListeners(backContentPageIndex, 'back');
            }
        } else {
            elements.backPageContent.innerHTML = '<p style="text-align: center; color: #bcaaa4; margin-top: 50px;">Fin del diario</p>';
        }
    }
}

// ===== RENDERIZAR PÁGINAS =====
function renderIndex() {
    const items = appState.pages
        .map((page, index) => {
            // Buscar el primer título en la página
            const titleElement = page.elements?.find(el => el.type === 'title');
            const title = titleElement ? titleElement.content : `Página ${index + 1}`;
            const pageNum = index + 1;
            return `
                <li class="index-item" data-page-index="${index + 3}">
                    <span class="index-item-title">${title}</span>
                    <span class="index-item-page">Pág. ${pageNum}</span>
                </li>
            `;
        })
        .join('');

    setTimeout(() => {
        document.querySelectorAll('.index-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetPage = parseInt(e.currentTarget.getAttribute('data-page-index'));
                goToPage(targetPage);
            });
        });
    }, 0);

    return `
        <div class="index-page">
            <h2 class="index-title">Índice</h2>
            <ul class="index-list">
                ${items.length > 0 ? items : '<li style="text-align: center; color: #bcaaa4; padding: 20px;">No hay páginas aún</li>'}
            </ul>
        </div>
    `;
}

function renderPage(pageData, editable) {
    if (!pageData || !pageData.elements) {
        return '<div style="height: 100%; position: relative;"></div>';
    }

    const elementsHTML = pageData.elements.map(el => renderElement(el, editable)).join('');

    return `<div style="height: 100%; position: relative;">${elementsHTML}</div>`;
}

function renderElement(element, editable) {
    const { id, type, x, y, width, height, content } = element;
    const deleteBtn = editable ? '<span class="delete-btn" onclick="deleteElement(' + id + ')">×</span>' : '';

    let innerContent = '';
    const editableAttr = editable ? 'contenteditable="true"' : '';

    switch (type) {
        case 'title':
            innerContent = `<div ${editableAttr} data-element-id="${id}" data-field="content">${content || 'Título'}</div>`;
            break;
        case 'text':
            innerContent = `<div ${editableAttr} data-element-id="${id}" data-field="content">${content || 'Texto'}</div>`;
            break;
        case 'image':
            if (content) {
                innerContent = `<img src="${content}" alt="Imagen">`;
            } else {
                innerContent = editable ? `<label style="cursor:pointer; display:block; padding:20px; text-align:center; background:rgba(0,0,0,0.05);">
                    <input type="file" accept="image/*" data-element-id="${id}" style="display:none;" onchange="handleImageUpload(event, ${id})">
                    📷 Click para subir imagen
                </label>` : '';
            }
            break;
        case 'icon':
            innerContent = `<div ${editableAttr} data-element-id="${id}" data-field="content">${content || '⭐'}</div>`;
            break;
        case 'sticker':
            innerContent = `<div ${editableAttr} data-element-id="${id}" data-field="content">${content || '🎨'}</div>`;
            break;
    }

    const widthStyle = width ? `width: ${width}px;` : '';
    const heightStyle = height ? `height: ${height}px;` : '';

    return `
        <div class="placed-element element-${type}"
             data-element-id="${id}"
             style="left: ${x}px; top: ${y}px; ${widthStyle} ${heightStyle}">
            ${deleteBtn}
            ${innerContent}
        </div>
    `;
}

// ===== DRAG AND DROP SYSTEM =====
function setupDragAndDrop() {
    // Drag start desde elementos del sidebar
    document.querySelectorAll('.element-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            const elementType = e.target.getAttribute('data-element-type');
            e.dataTransfer.setData('elementType', elementType);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    // Configurar drop zones en las páginas
    setupDropZones();
}

function setupDropZones() {
    [elements.frontPageContent, elements.backPageContent].forEach(pageContent => {
        pageContent.addEventListener('dragover', (e) => {
            if (!appState.viewMode) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                pageContent.classList.add('drop-zone-active');
            }
        });

        pageContent.addEventListener('dragleave', (e) => {
            pageContent.classList.remove('drop-zone-active');
        });

        pageContent.addEventListener('drop', (e) => {
            e.preventDefault();
            pageContent.classList.remove('drop-zone-active');

            if (appState.viewMode) return;

            const elementType = e.dataTransfer.getData('elementType');
            if (!elementType) return;

            // Calcular posición relativa al page-content
            const rect = pageContent.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Determinar qué página estamos editando
            const pageIndex = getCurrentEditablePageIndex(pageContent);
            if (pageIndex === -1) return;

            // Crear nuevo elemento
            const newElement = createNewElement(elementType, x, y);

            // Asegurar que la página existe
            if (!appState.pages[pageIndex]) {
                appState.pages[pageIndex] = { elements: [] };
            }
            if (!appState.pages[pageIndex].elements) {
                appState.pages[pageIndex].elements = [];
            }

            // Agregar elemento a la página
            appState.pages[pageIndex].elements.push(newElement);

            saveData();
            updateDisplay();
        });
    });
}

function getCurrentEditablePageIndex(pageContentElement) {
    const { currentPageIndex } = appState;

    if (pageContentElement === elements.frontPageContent) {
        return currentPageIndex - 3;
    } else if (pageContentElement === elements.backPageContent) {
        if (currentPageIndex === 2) return 0;
        return currentPageIndex - 2;
    }

    return -1;
}

function createNewElement(type, x, y) {
    const element = {
        id: appState.nextElementId++,
        type: type,
        x: Math.max(0, Math.min(x, 400)), // Limitar dentro de la página
        y: Math.max(0, Math.min(y, 500)),
        content: getDefaultContent(type)
    };

    // Agregar dimensiones para imágenes
    if (type === 'image') {
        element.width = 200;
        element.height = 150;
    }

    return element;
}

function getDefaultContent(type) {
    switch (type) {
        case 'title': return 'Nuevo Título';
        case 'text': return 'Nuevo texto';
        case 'icon': return '⭐';
        case 'sticker': return '🎨';
        case 'image': return null;
        default: return '';
    }
}

// ===== MANIPULACIÓN DE ELEMENTOS =====
function attachElementEventListeners(pageIndex, side) {
    const pageContent = side === 'front' ? elements.frontPageContent : elements.backPageContent;

    // Listener para editar contenido
    pageContent.querySelectorAll('[contenteditable="true"]').forEach(editableEl => {
        editableEl.addEventListener('input', (e) => {
            const elementId = parseInt(e.target.getAttribute('data-element-id'));
            const field = e.target.getAttribute('data-field');
            const value = e.target.textContent;

            updateElementField(pageIndex, elementId, field, value);
        });
    });

    // Listener para mover elementos (drag dentro de la página)
    pageContent.querySelectorAll('.placed-element').forEach(placedEl => {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        placedEl.addEventListener('mousedown', (e) => {
            // Evitar drag si estamos haciendo click en el botón delete o en un contenteditable
            if (e.target.classList.contains('delete-btn') ||
                e.target.hasAttribute('contenteditable') ||
                e.target.tagName === 'INPUT') {
                return;
            }

            isDragging = true;
            const elementId = parseInt(placedEl.getAttribute('data-element-id'));
            appState.selectedElement = elementId;

            startX = e.clientX;
            startY = e.clientY;
            initialX = placedEl.offsetLeft;
            initialY = placedEl.offsetTop;

            placedEl.classList.add('selected');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newX = initialX + deltaX;
            let newY = initialY + deltaY;

            // Limitar dentro de la página (establecer límites)
            const pageRect = pageContent.getBoundingClientRect();
            const elementRect = placedEl.getBoundingClientRect();

            newX = Math.max(0, Math.min(newX, pageRect.width - elementRect.width));
            newY = Math.max(0, Math.min(newY, pageRect.height - elementRect.height));

            placedEl.style.left = newX + 'px';
            placedEl.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;

                const elementId = appState.selectedElement;
                const newX = parseInt(placedEl.style.left);
                const newY = parseInt(placedEl.style.top);

                updateElementPosition(pageIndex, elementId, newX, newY);

                placedEl.classList.remove('selected');
                appState.selectedElement = null;
            }
        });
    });
}

function updateElementField(pageIndex, elementId, field, value) {
    const page = appState.pages[pageIndex];
    if (!page || !page.elements) return;

    const element = page.elements.find(el => el.id === elementId);
    if (element) {
        element[field] = value;
        saveData();
    }
}

function updateElementPosition(pageIndex, elementId, x, y) {
    const page = appState.pages[pageIndex];
    if (!page || !page.elements) return;

    const element = page.elements.find(el => el.id === elementId);
    if (element) {
        element.x = x;
        element.y = y;
        saveData();
    }
}

// Función global para eliminar elementos (llamada desde HTML)
window.deleteElement = function(elementId) {
    const { currentPageIndex } = appState;
    const pageIndex = currentPageIndex - 3;

    if (pageIndex < 0 || pageIndex >= appState.pages.length) return;

    const page = appState.pages[pageIndex];
    if (!page || !page.elements) return;

    page.elements = page.elements.filter(el => el.id !== elementId);
    saveData();
    updateDisplay();
};

// Función global para manejar upload de imágenes
window.handleImageUpload = function(event, elementId) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const { currentPageIndex } = appState;
        const pageIndex = currentPageIndex - 3;

        if (pageIndex < 0 || pageIndex >= appState.pages.length) return;

        const page = appState.pages[pageIndex];
        if (!page || !page.elements) return;

        const element = page.elements.find(el => el.id === elementId);
        if (element) {
            element.content = e.target.result;
            saveData();
            updateDisplay();
        }
    };
    reader.readAsDataURL(file);
};

// ===== AGREGAR PÁGINA =====
function addNewPage() {
    appState.pages.push({ elements: [] });
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
