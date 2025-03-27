import { resizeAspectRatio, setupText, updateText } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;   // shader program
let vao;      // vertex array object
let textOverlay; // for text output third line (see util.js)
let verticalMove = 0.0;
let horizontalMove = 0.0;

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 600;
    canvas.height = 600;

    resizeAspectRatio(gl, canvas);

    // Initialize WebGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    return true;
}


async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}


function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        const X = horizontalMove * 0.01;  //사각형 중심의 x좌표, 실제 위치 값
        const Y = verticalMove * 0.01;

        if (event.key === 'ArrowRight') {
            if (X + 0.1 + 0.01 <= 1.0) {  //실제 위치 + 사각형 오른쪽 절반 길이 + 이동 <= 경계
                horizontalMove += 1.0;
            }
        } else if (event.key === 'ArrowLeft') {
            if (X - 0.1 - 0.01 >= -1.0) {  //실제 위치 - 사각형 왼쪽 절반 길이 - 이동 >= 경계
                horizontalMove -= 1.0;
            }
        } else if (event.key === 'ArrowUp') {
            if (Y + 0.1 + 0.01 <= 1.0) {
                verticalMove += 1.0;
            }
        } else if (event.key === 'ArrowDown') {
            if (Y - 0.1 - 0.01 >= -1.0) {
                verticalMove -= 1.0;
            }
        }
    });
}





function setupBuffers() {
    const vertices = new Float32Array([
        -0.1, -0.1, 0.0,  // Bottom left
         0.1, -0.1, 0.0,  // Bottom right
         0.1,  0.1, 0.0,  // Top right
        -0.1,  0.1, 0.0   // Top left
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    shader.setFloat("verticalMove", verticalMove);
    shader.setFloat("horizontalMove", horizontalMove);

    // Bind VAO and draw
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // Request next frame
    requestAnimationFrame(() => render());
}

async function main() {
    try {
        
        // WebGL 초기화
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        
        // 셰이더 초기화
        await initShader();

        // setup text overlay
        setupText(canvas, "Use arrow keys to move the rectangle", 1);

        // 키보드 이벤트 설정
        setupKeyboardEvents();

        // 나머지 초기화
        setupBuffers();
        shader.use();
        
        // 렌더링 시작
        render();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
    // 성공한 경우 여기서 추가 작업을 할 수 있음
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});

