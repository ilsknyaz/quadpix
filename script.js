// Theme switching functionality
const lightModeBtn = document.getElementById('lightModeBtn');
const darkModeBtn = document.getElementById('darkModeBtn');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButtons(savedTheme);
}

lightModeBtn.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    updateThemeButtons('light');
});

darkModeBtn.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    updateThemeButtons('dark');
});

function updateThemeButtons(theme) {
    if (theme === 'dark') {
        darkModeBtn.style.backgroundColor = 'var(--button-hover)';
        lightModeBtn.style.backgroundColor = 'var(--button-bg)';
    } else {
        lightModeBtn.style.backgroundColor = 'var(--button-hover)';
        darkModeBtn.style.backgroundColor = 'var(--button-bg)';
    }
}

// Initialize theme buttons
updateThemeButtons(savedTheme || 'light');

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pixelCanvas');
    const ctx = canvas.getContext('2d');
    const tools = document.querySelectorAll('.tool');
    
    // Canvas settings
    const BASE_CANVAS_SIZE = 600;
    let PIXEL_SIZE = 20;
    const GRID_COLS = BASE_CANVAS_SIZE / 20; // base grid cols
    const GRID_ROWS = BASE_CANVAS_SIZE / 20; // base grid rows
    let zoomLevel = 1;
    const MIN_ZOOM = 1; // Don't allow zooming out below 1x
    const MAX_ZOOM = 4;
    
    // Initialize canvas
    canvas.width = BASE_CANVAS_SIZE;
    canvas.height = BASE_CANVAS_SIZE;
    
    // Drawing state
    let currentTool = 'pencil';
    let isDrawing = false;
    let currentColor = '#000000';
    let startX = 0;
    let startY = 0;
    let layers = [{
        name: 'Layer 1',
        visible: true,
        canvas: createNewLayer()
    }];
    let currentLayerIndex = 0;
    
    // Layer management
    function createNewLayer() {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = BASE_CANVAS_SIZE;
        layerCanvas.height = BASE_CANVAS_SIZE;
        const layerCtx = layerCanvas.getContext('2d');
        layerCtx.fillStyle = 'rgba(255, 255, 255, 0)';
        layerCtx.fillRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);
        return layerCanvas;
    }
    
    function renderLayers() {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);
        
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].visible) {
                ctx.drawImage(layers[i].canvas, 0, 0);
            }
        }
        
        drawGrid();
    }
    
    function updateLayersList() {
        const layersList = document.querySelector('.layers-list');
        layersList.innerHTML = '';
        
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const layerElement = document.createElement('div');
            layerElement.className = `layer${i === currentLayerIndex ? ' active' : ''}`;
            
            const visibilityCheckbox = document.createElement('input');
            visibilityCheckbox.type = 'checkbox';
            visibilityCheckbox.className = 'layer-visibility';
            visibilityCheckbox.checked = layer.visible;
            
            const layerName = document.createElement('span');
            layerName.className = 'layer-name';
            layerName.textContent = layer.name;
            
            layerElement.appendChild(visibilityCheckbox);
            layerElement.appendChild(layerName);
            
            layerElement.addEventListener('click', (e) => {
                if (e.target !== visibilityCheckbox) {
                    document.querySelectorAll('.layer').forEach(l => l.classList.remove('active'));
                    layerElement.classList.add('active');
                    currentLayerIndex = i;
                }
            });
            
            visibilityCheckbox.addEventListener('change', (e) => {
                e.stopPropagation();
                layer.visible = visibilityCheckbox.checked;
                renderLayers();
            });
            
            layersList.appendChild(layerElement);
        }
    }
    
    // Initialize grid
    function drawGrid() {
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= BASE_CANVAS_SIZE; x += PIXEL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, BASE_CANVAS_SIZE);
            ctx.stroke();
        }
        
        for (let y = 0; y <= BASE_CANVAS_SIZE; y += PIXEL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(BASE_CANVAS_SIZE, y);
            ctx.stroke();
        }
    }
    
    // Drawing functions
    function drawLine(startX, startY, endX, endY, color) {
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const sx = startX < endX ? 1 : -1;
        const sy = startY < endY ? 1 : -1;
        let err = dx - dy;

        while (true) {
            fillPixel(startX, startY, color);
            
            if (startX === endX && startY === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                startX += sx;
            }
            if (e2 < dx) {
                err += dx;
                startY += sy;
            }
        }
    }

    function drawRectangle(startX, startY, endX, endY, color, filled = false) {
        const x1 = Math.floor(startX / PIXEL_SIZE) * PIXEL_SIZE;
        const y1 = Math.floor(startY / PIXEL_SIZE) * PIXEL_SIZE;
        const x2 = Math.floor(endX / PIXEL_SIZE) * PIXEL_SIZE;
        const y2 = Math.floor(endY / PIXEL_SIZE) * PIXEL_SIZE;
        if (filled) {
            // Filled rectangle
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y += PIXEL_SIZE) {
                for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x += PIXEL_SIZE) {
                    fillPixel(x, y, color);
                }
            }
        } else {
            // Outline rectangle
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x += PIXEL_SIZE) {
                fillPixel(x, y1, color);
                fillPixel(x, y2, color);
            }
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y += PIXEL_SIZE) {
                fillPixel(x1, y, color);
                fillPixel(x2, y, color);
            }
        }
    }
    
    function drawCircle(startX, startY, endX, endY, color, filled = false) {
        // Calculate center and radius in pixel grid
        const x0 = Math.floor(startX / PIXEL_SIZE) * PIXEL_SIZE;
        const y0 = Math.floor(startY / PIXEL_SIZE) * PIXEL_SIZE;
        const x1 = Math.floor(endX / PIXEL_SIZE) * PIXEL_SIZE;
        const y1 = Math.floor(endY / PIXEL_SIZE) * PIXEL_SIZE;
        const dx = x1 - x0;
        const dy = y1 - y0;
        let r = Math.round(Math.sqrt(dx * dx + dy * dy) / PIXEL_SIZE);
        let cx = Math.round(x0 / PIXEL_SIZE);
        let cy = Math.round(y0 / PIXEL_SIZE);
        if (filled) {
            // Scanline fill for pixel-art circle
            for (let y = -r; y <= r; y++) {
                let xSpan = Math.floor(Math.sqrt(r * r - y * y));
                for (let x = -xSpan; x <= xSpan; x++) {
                    fillPixel((cx + x) * PIXEL_SIZE, (cy + y) * PIXEL_SIZE, color);
                }
            }
        } else {
            // Outline circle
            drawCircleOutline(cx, cy, r, color);
        }
    }
    function drawCircleOutline(cx, cy, r, color) {
        let x = r;
        let y = 0;
        let err = 0;
        while (x >= y) {
            fillPixel((cx + x) * PIXEL_SIZE, (cy + y) * PIXEL_SIZE, color);
            fillPixel((cx + y) * PIXEL_SIZE, (cy + x) * PIXEL_SIZE, color);
            fillPixel((cx - y) * PIXEL_SIZE, (cy + x) * PIXEL_SIZE, color);
            fillPixel((cx - x) * PIXEL_SIZE, (cy + y) * PIXEL_SIZE, color);
            fillPixel((cx - x) * PIXEL_SIZE, (cy - y) * PIXEL_SIZE, color);
            fillPixel((cx - y) * PIXEL_SIZE, (cy - x) * PIXEL_SIZE, color);
            fillPixel((cx + y) * PIXEL_SIZE, (cy - x) * PIXEL_SIZE, color);
            fillPixel((cx + x) * PIXEL_SIZE, (cy - y) * PIXEL_SIZE, color);
            y++;
            if (err <= 0) {
                err += 2 * y + 1;
            } else {
                x--;
                err -= 2 * x + 1;
            }
        }
    }
    
    // Fill pixel at coordinates
    function fillPixel(x, y, color) {
        const pixelX = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE;
        const pixelY = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE;
        
        const layerCtx = layers[currentLayerIndex].canvas.getContext('2d');
        
        if (color === '#ffffff') {
            layerCtx.clearRect(pixelX, pixelY, PIXEL_SIZE, PIXEL_SIZE);
        } else {
            layerCtx.fillStyle = color;
            layerCtx.fillRect(pixelX, pixelY, PIXEL_SIZE, PIXEL_SIZE);
        }
        
        layerCtx.strokeStyle = '#ddd';
        layerCtx.strokeRect(pixelX, pixelY, PIXEL_SIZE, PIXEL_SIZE);
        
        renderLayers();
    }
    
    // Event Listeners
    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        // Adjust for scroll and zoom
        const x = (e.clientX - rect.left) / zoomLevel;
        const y = (e.clientY - rect.top) / zoomLevel;
        return { x, y };
    }

    canvas.addEventListener('mousedown', (e) => {
        const { x, y } = getCanvasCoords(e);
        isDrawing = true;
        startX = x;
        startY = y;
        if (currentTool === 'pencil') {
            fillPixel(x, y, currentColor);
        } else if (currentTool === 'eraser') {
            fillPixel(x, y, '#ffffff');
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const { x, y } = getCanvasCoords(e);
        if (currentTool === 'pencil') {
            fillPixel(x, y, currentColor);
        } else if (currentTool === 'eraser') {
            fillPixel(x, y, '#ffffff');
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        const { x, y } = getCanvasCoords(e);
        if (currentTool === 'line') {
            drawLine(
                Math.floor(startX / PIXEL_SIZE) * PIXEL_SIZE,
                Math.floor(startY / PIXEL_SIZE) * PIXEL_SIZE,
                Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE,
                Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE,
                currentColor
            );
        } else if (currentTool === 'rectangle') {
            drawRectangle(startX, startY, x, y, currentColor, false);
        } else if (currentTool === 'rectangle-filled') {
            drawRectangle(startX, startY, x, y, currentColor, true);
        } else if (currentTool === 'circle') {
            drawCircle(startX, startY, x, y, currentColor, false);
        } else if (currentTool === 'circle-filled') {
            drawCircle(startX, startY, x, y, currentColor, true);
        }
        isDrawing = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
    
    // Tool selection
    tools.forEach(tool => {
        tool.addEventListener('click', () => {
            tools.forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            currentTool = tool.dataset.tool;
        });
    });

    // Color picker
    let colorPicker = new iro.ColorPicker("#picker", {
        width: 220,
        color: "#fff000",
        borderWidth: 1,
        borderColor: "#ddd",
    });

    colorPicker.on(['color:init', 'color:change'], function(color) {
        currentColor = color.hexString;
        console.log(color.hexString);
    });
    
    // Color presets
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', (e) => {
            let clickTarget = e.target;
            document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            currentColor = preset.style.backgroundColor;
            if (clickTarget.dataset.color) {
                colorPicker.color.set(clickTarget.dataset.color);
            }
        });
    });

    let values = document.getElementById('values');
    colorPicker.on(["color:init", "color:change"], function(color) {
        values.innerHTML = [
            "hex: " + color.hexString,
        ]
    });
    
    // Layer controls
    document.getElementById('addLayer').addEventListener('click', () => {
        const newLayer = {
            name: `Layer ${layers.length + 1}`,
            visible: true,
            canvas: createNewLayer()
        };
        layers.push(newLayer);
        currentLayerIndex = layers.length - 1;
        updateLayersList();
        renderLayers();
    });
    
    document.getElementById('deleteLayer').addEventListener('click', () => {
        if (layers.length > 1) {
            layers.splice(currentLayerIndex, 1);
            currentLayerIndex = Math.min(currentLayerIndex, layers.length - 1);
            updateLayersList();
            renderLayers();
        }
    });
    
    // Initialize
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);
    drawGrid();
    updateLayersList();
    
    // Set initial active tool and color
    document.querySelector('[data-tool="pencil"]').classList.add('active');
    // document.querySelector('.color-preset').classList.add('active');

    // Clear canvas functionality
    document.getElementById('clearButton').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите очистить холст?')) {
            layers.forEach(layer => {
                const layerCtx = layer.canvas.getContext('2d');
                layerCtx.clearRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);
            });
            renderLayers();
        }
    });

    // Save functionality
    document.getElementById('saveButton').addEventListener('click', () => {
        // Create a temporary canvas to merge all layers without the grid
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = BASE_CANVAS_SIZE;
        tempCanvas.height = BASE_CANVAS_SIZE;
        const tempCtx = tempCanvas.getContext('2d');

        // Fill with white background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, BASE_CANVAS_SIZE, BASE_CANVAS_SIZE);

        // Draw all visible layers
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].visible) {
                tempCtx.drawImage(layers[i].canvas, 0, 0);
            }
        }

        // Create download link
        const link = document.createElement('a');
        link.download = 'pixel-art.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    });

    // Update canvas zoom and scroll wrapper
    function updateCanvasZoom() {
        const wrapper = document.querySelector('.canvas-scroll-wrapper');
        const container = document.querySelector('.canvas-container');
        canvas.style.transform = `scale(${zoomLevel})`;
        canvas.style.transformOrigin = 'top left';
        wrapper.style.width = BASE_CANVAS_SIZE * zoomLevel + 'px';
        wrapper.style.height = BASE_CANVAS_SIZE * zoomLevel + 'px';
        // Hide scrollbars at min zoom, show otherwise
        if (zoomLevel === MIN_ZOOM) {
            wrapper.classList.add('no-scrollbars');
            container.classList.add('center-canvas');
        } else {
            wrapper.classList.remove('no-scrollbars');
            container.classList.remove('center-canvas');
        }
    }

    function reactivateCurrentTool() {
        const activeTool = document.querySelector('.tool.active');
        if (activeTool) activeTool.click();
    }

    document.getElementById('zoomInBtn').addEventListener('click', () => {
        if (zoomLevel < MAX_ZOOM) {
            zoomLevel *= 2;
            updateCanvasZoom();
            reactivateCurrentTool();
        }
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        if (zoomLevel > MIN_ZOOM) {
            zoomLevel /= 2;
            updateCanvasZoom();
            reactivateCurrentTool();
        }
    });

    // Initial zoom
    updateCanvasZoom();
}); 