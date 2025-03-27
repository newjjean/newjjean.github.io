// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 현재 window 전체를 canvas로 사용
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.1, 0.2, 0.3, 1.0);

// Start rendering
render();

// Render loop
function render() {
    const halfWidth = canvas.width/2;
    const halfHeight = canvas.height/2;

    gl.enable(gl.SCISSOR_TEST);
    //BLUE
    gl.viewport(0,0,halfWidth,halfHeight);
    gl.scissor(0,0,halfWidth,halfHeight);
    gl.clearColor(0.0,0.0,1.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);    
    //RED
    gl.viewport(0,halfHeight,halfWidth,halfHeight);
    gl.scissor(0,halfHeight,halfWidth,halfHeight);
    gl.clearColor(1.0,0.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //YELLOW
    gl.viewport(halfWidth,0,halfWidth,halfHeight);
    gl.scissor(halfWidth,0,halfWidth,halfHeight);
    gl.clearColor(1.0,1.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT); 
    //GREEN
    gl.viewport(halfWidth,halfHeight,halfWidth,halfHeight);
    gl.scissor(halfWidth,halfHeight,halfWidth,halfHeight);
    gl.clearColor(0.0,1.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.disable(gl.SCISSOR_TEST);

}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    const size = Math.min(window.innerWidth, window.innerHeight);

    canvas.width = size;
    canvas.height = size;
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});

