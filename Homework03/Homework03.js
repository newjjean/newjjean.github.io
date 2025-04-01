/*-------------------------------------------------------------------------
Homework03.js
-------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;  // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null;  // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치
let lines = []; // 그려진 선분들을 저장하는 array
let textOverlay; // 1st line segment 정보 표시
let textOverlay2; // 2nd line segment 정보 표시
let textOverlay3;
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)
let radius; // 원의 radius
let inters = []; // 원과 직선의 교점

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) { // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
        console.log("Already initialized");
        return;
    }
    main().then(success => { // call main function
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;

    resizeAspectRatio(gl, canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);

    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

    gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,  // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
        -((y / canvas.height) * 2 - 1) // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
    ];
}



function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
        event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

        const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
        const x = event.clientX - rect.left;  // canvas 내 x 좌표
        const y = event.clientY - rect.top;   // canvas 내 y 좌표
        
        if (!isDrawing && lines.length < 2) { 
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            startPoint = [glX, glY];
            isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
        }
    }

    function handleMouseMove(event) {
        if (isDrawing && startPoint) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            let [glX, glY] = convertToWebGLCoordinates(x, y);
            tempEndPoint = [glX, glY];

            // 원에서 radius 계산
            if (lines.length == 0) {
                let dx = startPoint[0] - tempEndPoint[0];
                let dy = startPoint[1] - tempEndPoint[1];
                radius = Math.sqrt(dx * dx + dy * dy);
            }
            render();
        }
        
    }

    function handleMouseUp() {
        if (isDrawing && tempEndPoint) {

            // 원 확정
            if (lines.length == 0) {
                lines.push({
                    shape: 'circle',
                    center: [startPoint[0], startPoint[1]],
                    radius: radius
                });
                updateText(textOverlay, "Circle: center (" + lines[0].center[0].toFixed(2) + ", " + lines[0].center[1].toFixed(2) + 
                            ") radius = " + lines[0].radius.toFixed(2));
            }
            // 선분 확정
            else {
                lines.push({
                    shape: 'line',
                    start: [startPoint[0], startPoint[1]],
                    end: [tempEndPoint[0], tempEndPoint[1]]
                });
                updateText(textOverlay2, "Line segment: (" + lines[1].start[0].toFixed(2) + ", " + lines[1].start[1].toFixed(2) +
                            ") ~ (" + lines[1].end[0].toFixed(2) + ", " + lines[1].end[1].toFixed(2) + ")");
                inters = calInters(lines[0],lines[1]);
                if (inters.length === 2){
                    inters.sort((a,b) => a[0] - b[0]);
                    const p1 = inters[0];
                    const p2 = inters[1];
                    const text = "Intersection Points: 2 Point 1: (" + p1[0].toFixed(2) + ", " + p1[1].toFixed(2) + "), Point 2: (" + p2[0].toFixed(2) + ", " + p2[1].toFixed(2) + ")";
                    updateText(textOverlay3, text);
                } else if (inters.length === 1){
                    const p3 = inters[0];
                    const text = "Intersection Points: 1 Point 1: (" + p3[0].toFixed(2) + ", " + p3[1].toFixed(2) + ")";
                    updateText(textOverlay3, text);
                } else{
                    updateText(textOverlay3, "No intersection");
                }
                    
                }
            }

            startPoint = null;
            tempEndPoint = null;
            isDrawing = false;
            render();
        }
    

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function calInters(circle, line){
    //line; parametric form
    const [p,q] = circle.center;
    const [x1,y1] = line.start;
    const [x2,y2] = line.end;
    const dx = x2 - x1;
    const dy = y2 - y1;

    const a = dx*dx + dy*dy;
    const b = 2*(dx*(x1-p)+dy*(y1-q));
    const c = x1*x1 + y1*y1 + p*p + q*q - circle.radius * circle.radius - 2*(x1*p + y1*q);

    const d = b*b - 4*a*c; //discriminant d
    if (d < 0) return [];

    const t1 = (-b + Math.sqrt(d))/(2*a);
    const t2 = (-b - Math.sqrt(d))/(2*a);

    const points = [];
    for (const t of [t1,t2]){
        if (t >= 0 && t <= 1){
            const xt = x1 + dx * t;
            const yt = y1 + dy * t;
            points.push([xt, yt]);
        }
    }
    return points;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();

    let num = 0;
    for (let i = 0; i < lines.length; i++) {
        let item = lines[i];
        if (item.shape == 'circle') { // 원 그리기 (붉은색 실선으로 확정하는 부분)
            shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
            let points = [];
            for (let i = 0; i<100; i++)
            {
                points.push(item.radius * Math.cos(Math.PI*i/50) + item.center[0]);
                points.push(item.radius * Math.sin(Math.PI*i/50) + item.center[1]);
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points),gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, 100);
        }
        else { // 선분 그리기 (흰색 실선으로 확정하는 부분)
            shader.setVec4("u_color", [1.0, 1.0, 1.0, 1.0]);
            let lineData = [item.start[0], item.start[1], item.end[0], item.end[1]];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineData), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
        
        num++;
    }

    // 임시 원 그리기
    if (isDrawing && startPoint && tempEndPoint && lines.length == 0)
    {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 원의 color는 회색
        let points = [];
        for (let i = 0; i<100; i++)
        {
            points.push(radius * Math.cos(Math.PI*i/50) + startPoint[0]);
            points.push(radius * Math.sin(Math.PI*i/50) + startPoint[1]);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points),gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINE_LOOP, 0, 100);
    }

    // 임시 선 그리기
    if (isDrawing && startPoint && tempEndPoint && lines.length == 1) {
        shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // 임시 선분의 color는 회색
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 교점 표시
    if (inters.length > 0){
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inters.flat()), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, inters.length);
    }

    // axes 그리기
    axes.draw(mat4.create(), mat4.create()); // 두 개의 identity matrix를 parameter로 전달
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
            return false; 
        }
        // 셰이더 초기화
        await initShader();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();

        // 텍스트 초기화
        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        // 마우스 이벤트 설정
        setupMouseEvents();
        
        // 초기 렌더링
        render();

        return true;
        
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
