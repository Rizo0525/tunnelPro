/**
 * 初始化着色器
 * @param gl        webgl上下文对象实例
 * @param vShaderName  顶点着色器路径
 * @param fShaderName  片元着色器路径
 * @return program
 * **/
function initShaders(gl,vShaderName,fShaderName){
    function getShader(gl,shaderName,type) {
        let shader=gl.createShader(type);
        let shaderScript = loadFileAJAX(shaderName);
        if(!shaderScript){
            alert("Could not find shader source:"+shaderName);
        }
        gl.shaderSource(shader,shaderScript);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
    let vertexShader = getShader(gl,vShaderName,gl.VERTEX_SHADER);
    let fragmentShader=getShader(gl,fShaderName,gl.FRAGMENT_SHADER);
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
        return null;
    }
    return program;
}

/**
 * 加载着色器文件
 * @param name  着色器文件路径
 * @return xhr.responseText
 * **/
function loadFileAJAX(name){
    let xhr = new XMLHttpRequest(),
        okStatus=document.location.protocol === 'file'?0:200;
    xhr.open('GET',name,false);
    xhr.send(null);
    // console.log(xhr.responseText);
    return xhr.status==okStatus?xhr.responseText:null;
}