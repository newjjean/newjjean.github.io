#version 300 es

layout (location = 0) in vec3 aPos;

uniform float verticalMove;
uniform float horizontalMove;

void main() {
    gl_Position = vec4(aPos[0] + 0.01 * horizontalMove, aPos[1] + 0.01 * verticalMove , aPos[2], 1.0);
} 