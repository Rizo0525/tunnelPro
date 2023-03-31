var shaderSource = (()=>{
    var vertex = `
        attribute vec3 v_position;
        attribute vec4 v_color;
        /*varying vec4 f_color;*/
        uniform mat4 u_Matrix;
        attribute vec2 v_texCoord;
        varying vec2 f_texCoord;
        void main(){
            gl_Position = u_Matrix * vec4(v_position,1);
            gl_PointSize = 10.0;
            /*f_color = v_color;*/
            /*f_texCoord=v_texCoord;*/
        }
    `
    var fragment = `
        precision mediump float;
        uniform vec3 f_color;
        varying vec2 v_texCoord;
        uniform sampler2D u_sampler;
        void main(){
            /*gl_FragColor = texture2D(u_sampler, v_texCoord);*/
            gl_FragColor = vec4(f_color,1.0);
        }
    `
    return {
        vertex,fragment
    }
})();
