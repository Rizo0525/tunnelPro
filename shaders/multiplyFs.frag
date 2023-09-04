precision highp float;

varying vec3 v_normal;
varying vec3 v_surfaceToView;
varying vec2 v_texcoord;
varying vec4 v_color;

uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform sampler2D evironmentMap;
uniform vec3 emissive;
uniform vec3 specular;
uniform sampler2D specularMap;
uniform sampler2D mirrorMap;
uniform float shininess;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;
uniform vec4 u_colorMult;

void main () {
    vec3 normal = normalize(v_normal);

    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

    float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
    float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);

    vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
    vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
    float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

    vec4 specularMapColor = texture2D(specularMap, v_texcoord);
    vec4 mirrorMapColor = texture2D(mirrorMap, v_texcoord);
    vec4 evironmentMapColor = texture2D(evironmentMap, v_texcoord);

    gl_FragColor = vec4(
    emissive *evironmentMapColor.rgb+
    ambient * u_ambientLight +
    effectiveDiffuse * fakeLight +
    specular *specularMapColor.rgb*mirrorMapColor.rgb* pow(specularLight, shininess),
    effectiveOpacity)*u_colorMult;
//    gl_FragColor = u_colorMult;
}