export default `
varying vec2 vUv;

uniform float u_shrink;
uniform vec3 u_base_color_1;
uniform vec3 u_base_color_2;
uniform vec3 u_mid_color;
uniform float u_vignette;
uniform float u_brightness;
uniform float u_darkness;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm (in vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

float length2( vec2 p ) {
    vec2 q = p*p*p*p;
    return pow( q.x + q.y, 1.0/4.0 );
}

void main() {
    vec2 st = vec2(.5) - vUv;
    st.x *= 6.28318531; // 2Pi
    st.y *= 3.14159265359; // Pi

    float r = length(st) * 1.3;
    float a = atan(st.y, st.x);

    float pulsing = 1. + clamp(1. - r, 0., 1.) * u_shrink;

    // noisy fullscreen mix of 2 colors
    float f = fbm(5. * st);
    vec3 col = mix(u_base_color_1, u_base_color_2, f);

    // blury spot in the middle
    col = mix(col, u_mid_color, 1. - smoothstep(0.2, 0.6, r * (.2 + .8 * pulsing)));

    // white streaks
    a += .05 * fbm(20. * st) * fbm(20. * st);
    f = smoothstep((1. - u_brightness), 1., fbm(vec2(20. * a, 6. * r * pulsing)));
    col = mix(col, vec3(1.), f);

    // dark insertions
    a = fbm(vec2(15. * a, 10. * r * pulsing));
    f = smoothstep(.4, .9,  a);
    col *= 1. - u_darkness * f;

    // vignette
    col *= 1. - u_vignette * smoothstep(.6, .8, r * (.9 + .1 * pulsing));

    // pupil
    f = 1. - smoothstep(.2, .25, r * pulsing);
    col = mix(col, vec3(.0), f);

    // clip the eye
    col = mix(col, vec3(1.), smoothstep(.79, 0.85, r));

    gl_FragColor = vec4(col, 1.);
}
`