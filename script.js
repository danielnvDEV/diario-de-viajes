// Estado de la aplicación
let currentPageIndex = 0;
let pages = [];
let isFlipping = false;

// Elementos del DOM
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageCounter = document.getElementById('pageCounter');
const addPageBtn = document.getElementById('addPageBtn');
const rightPage = document.getElementById('currentPage');
const leftPage = document.querySelector('.left-page .page-content');

// Inicializar la aplicación
function init() {
    // Cargar páginas guardadas del localStorage
    loadPages();

    // Si no hay páginas guardadas, crear las primeras dos
    if (pages.length === 0) {
        pages = [
            { location: '', photo: '', notes: '' },
            { location: '', photo: '', notes: '' }
        ];
        savePages();
    }

    // Configurar event listeners
    prevBtn.addEventListener('click', goToPreviousPage);
    nextBtn.addEventListener('click', goToNextPage);
    addPageBtn.addEventListener('click', addNewPage);

    // Configurar inputs de foto para las páginas iniciales
    setupPhotoInputs();

    // Actualizar la vista inicial
    updatePageDisplay();
    updateNavigationButtons();
}

// Configurar event listeners para inputs de foto
function setupPhotoInputs() {
    // Para la página frontal (índice 0)
    const photoInput0 = document.getElementById('photo-input-0');
    if (photoInput0) {
        photoInput0.addEventListener('change', (e) => handlePhotoUpload(e, 0));
    }

    // Para la página trasera (índice 1)
    const photoInput1 = document.getElementById('photo-input-1');
    if (photoInput1) {
        photoInput1.addEventListener('change', (e) => handlePhotoUpload(e, 1));
    }

    // Guardar datos cuando el usuario escribe
    const location0 = document.getElementById('location-0');
    const location1 = document.getElementById('location-1');
    const notes0 = document.getElementById('notes-0');
    const notes1 = document.getElementById('notes-1');

    if (location0) location0.addEventListener('input', () => saveCurrentPageData(0));
    if (location1) location1.addEventListener('input', () => saveCurrentPageData(1));
    if (notes0) notes0.addEventListener('input', () => saveCurrentPageData(0));
    if (notes1) notes1.addEventListener('input', () => saveCurrentPageData(1));
}

// Manejar la carga de fotos
function handlePhotoUpload(event, pageIndex) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const photoData = e.target.result;
            pages[pageIndex].photo = photoData;

            // Mostrar la foto en el preview
            const preview = document.getElementById(`preview-${pageIndex}`);
            const uploadLabel = document.querySelector(`#photo-area-${pageIndex} .upload-label`);

            if (preview && uploadLabel) {
                preview.src = photoData;
                preview.style.display = 'block';
                uploadLabel.style.display = 'none';
            }

            savePages();
        };

        reader.readAsDataURL(file);
    }
}

// Guardar datos de la página actual
function saveCurrentPageData(pageIndex) {
    const locationInput = document.getElementById(`location-${pageIndex}`);
    const notesInput = document.getElementById(`notes-${pageIndex}`);

    if (locationInput && notesInput) {
        pages[pageIndex].location = locationInput.value;
        pages[pageIndex].notes = notesInput.value;
        savePages();
    }
}

// Ir a la página anterior
function goToPreviousPage() {
    if (isFlipping || currentPageIndex === 0) return;

    isFlipping = true;
    currentPageIndex--;

    // Animación de voltear hacia atrás
    rightPage.classList.remove('flipping');

    setTimeout(() => {
        updatePageDisplay();
        updateNavigationButtons();
        isFlipping = false;
    }, 800);
}

// Ir a la página siguiente
function goToNextPage() {
    if (isFlipping || currentPageIndex >= pages.length - 2) return;

    isFlipping = true;

    // Animación de voltear hacia adelante
    rightPage.classList.add('flipping');

    setTimeout(() => {
        currentPageIndex++;
        rightPage.classList.remove('flipping');
        updatePageDisplay();
        updateNavigationButtons();
        isFlipping = false;
    }, 800);
}

// Actualizar la visualización de las páginas
function updatePageDisplay() {
    // Actualizar página izquierda
    if (currentPageIndex === 0) {
        leftPage.innerHTML = `
            <h2>Bienvenido</h2>
            <p>Guarda tus recuerdos de viajes aquí</p>
            <div class="decorative-line"></div>
        `;
    } else {
        const leftPageData = pages[currentPageIndex - 1];
        leftPage.innerHTML = createPageHTML(leftPageData, 'left');
    }

    // Actualizar páginas derecha (frontal y trasera)
    const frontPageData = pages[currentPageIndex];
    const backPageData = pages[currentPageIndex + 1];

    document.querySelector('.page-front .page-content').innerHTML = createPageHTML(frontPageData, 'front', currentPageIndex);
    document.querySelector('.page-back .page-content').innerHTML = createPageHTML(backPageData, 'back', currentPageIndex + 1);

    // Reconfigurar los event listeners después de actualizar el HTML
    setupPhotoInputs();

    // Restaurar las fotos si existen
    if (frontPageData.photo) {
        const preview = document.getElementById(`preview-0`);
        const uploadLabel = document.querySelector(`#photo-area-0 .upload-label`);
        if (preview && uploadLabel) {
            preview.src = frontPageData.photo;
            preview.style.display = 'block';
            uploadLabel.style.display = 'none';
        }
    }

    if (backPageData && backPageData.photo) {
        const preview = document.getElementById(`preview-1`);
        const uploadLabel = document.querySelector(`#photo-area-1 .upload-label`);
        if (preview && uploadLabel) {
            preview.src = backPageData.photo;
            preview.style.display = 'block';
            uploadLabel.style.display = 'none';
        }
    }
}

// Crear HTML para una página
function createPageHTML(pageData, position, actualIndex = null) {
    if (!pageData) {
        return '<p style="text-align: center; color: #bcaaa4;">No hay más páginas</p>';
    }

    if (position === 'left') {
        return `
            <div class="location-display" style="font-size: 1.5em; color: #4e342e; font-weight: bold; margin-bottom: 15px;">
                ${pageData.location || 'Sin título'}
            </div>
            ${pageData.photo ? `<img src="${pageData.photo}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">` : ''}
            <div class="notes-display" style="color: #6d4c41; line-height: 1.6; font-size: 1em;">
                ${pageData.notes || 'Sin notas'}
            </div>
        `;
    }

    const index = actualIndex !== null ? actualIndex % 2 : 0;

    return `
        <input type="text" class="location-input" placeholder="Nombre del lugar o país"
               id="location-${index}" value="${pageData.location || ''}">
        <div class="photo-upload-area" id="photo-area-${index}">
            <label for="photo-input-${index}" class="upload-label">
                <span class="upload-icon">📷</span>
                <span class="upload-text">Click para agregar foto</span>
            </label>
            <input type="file" id="photo-input-${index}" class="photo-input" accept="image/*">
            <img class="uploaded-photo" id="preview-${index}" style="display: none;">
        </div>
        <textarea class="notes-area" placeholder="Escribe tus recuerdos aquí..."
                  id="notes-${index}">${pageData.notes || ''}</textarea>
    `;
}

// Actualizar botones de navegación
function updateNavigationButtons() {
    prevBtn.disabled = currentPageIndex === 0;
    nextBtn.disabled = currentPageIndex >= pages.length - 2;
    pageCounter.textContent = `Página ${currentPageIndex + 1}`;
}

// Agregar nueva página
function addNewPage() {
    // Agregar dos páginas nuevas (una vista completa del cuaderno)
    pages.push(
        { location: '', photo: '', notes: '' },
        { location: '', photo: '', notes: '' }
    );

    savePages();
    updateNavigationButtons();

    // Mensaje de confirmación
    const originalText = addPageBtn.textContent;
    addPageBtn.textContent = '✓ Páginas agregadas';
    addPageBtn.style.background = 'linear-gradient(135deg, #66bb6a, #4caf50)';

    setTimeout(() => {
        addPageBtn.textContent = originalText;
        addPageBtn.style.background = '';
    }, 2000);
}

// Guardar páginas en localStorage
function savePages() {
    try {
        localStorage.setItem('travelPages', JSON.stringify(pages));
    } catch (e) {
        console.error('Error al guardar páginas:', e);
    }
}

// Cargar páginas desde localStorage
function loadPages() {
    try {
        const savedPages = localStorage.getItem('travelPages');
        if (savedPages) {
            pages = JSON.parse(savedPages);
        }
    } catch (e) {
        console.error('Error al cargar páginas:', e);
        pages = [];
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
