var v_position;
var u_Matrix;
var f_color;
var deg = 0.1;
var shaderProgram;
var currentDeg = 0
function createBufferObject(gl,obj){
    obj.vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(obj.verticePositions),gl.STATIC_DRAW)

    obj.indexBufferTriangles = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(obj.triangleIndices),gl.STATIC_DRAW)

    obj.indexBufferLines = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferLines)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(obj.linesIndices),gl.STATIC_DRAW)

}
function initShader(gl){
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, shaderSource.vertex)
    gl.compileShader(vertexShader)

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, shaderSource.fragment)
    gl.compileShader(fragmentShader)

    shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    v_position = gl.getAttribLocation(shaderProgram,'v_position')
    u_Matrix = gl.getUniformLocation(shaderProgram, 'u_Matrix')
    f_color = gl.getUniformLocation(shaderProgram, 'f_color')
}
function initialize(gl,obj){
    createBufferObject(gl,obj)
    initShader(gl)
}
function createObj(){

}
function drawObject(gl,obj,fillColor,lineColor){
    gl.bindBuffer(gl.ARRAY_BUFFER,obj.vertexBuffer)
    gl.vertexAttribPointer(v_position,3,gl.FLOAT,false,3*4,0)
    gl.enableVertexAttribArray(v_position)

    gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(1.0, 1.0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,obj.indexBufferTriangles)
    gl.uniform3fv(f_color, fillColor)
    gl.drawElements(gl.TRIANGLES,obj.triangleIndices.length,gl.UNSIGNED_SHORT,0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,obj.indexBufferLines)
    gl.uniform3fv(f_color,lineColor)
    gl.drawElements(gl.LINES,obj.linesIndices.length,gl.UNSIGNED_SHORT,0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null)
    gl.disableVertexAttribArray(v_position)
    gl.bindBuffer(gl.ARRAY_BUFFER,null)
}
function drawobj(canvas,gl,obj){

    var width = canvas.clientWidth;
	var height = canvas.clientHeight;
	gl.viewport(0, 0, width, height);
	gl.clearColor(0.309, 0.505, 0.74, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projMat = SpiderGL.Math.Mat4.perspective(0.8,width/height,0.1,120)
    var viewMat;
    if(obj.name==='cube'){
		viewMat = SpiderGL.Math.Mat4.lookAt([0,2,6], [0,0,0], [0,1,0]);
        deg = 0.1;
    }else if (obj.name == "sphere") {
		viewMat = SpiderGL.Math.Mat4.lookAt([0,-1,4], [0,0.1,0], [0,1,-1]); 
        deg = 0.1;
	}
	else if (obj.name == "cone") {
		viewMat = SpiderGL.Math.Mat4.lookAt([0,-1.5,4], [0,0.1,0], [0,1,0]); 
        deg = 0.1;
	}	
	else if (obj.name == "circular") {
		viewMat = SpiderGL.Math.Mat4.lookAt([0,1000,0], [0,-1,0], [0,-100,0]);
        deg = 0.005
	}
    var modelMat = SpiderGL.Math.Mat4.rotationAngleAxis(SpiderGL.Math.degToRad(-currentDeg),[0,1,0])
    var modelviewprojMat = SpiderGL.Math.Mat4.mul(projMat,SpiderGL.Math.Mat4.mul(viewMat,modelMat))
    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(shaderProgram)
    gl.uniformMatrix4fv(u_Matrix, false, modelviewprojMat)

    drawObject(gl,obj,new Float32Array([0.82, 0.82, 0.82]),new Float32Array([0,0,0]))

    currentDeg +=deg
    if(currentDeg>360){
        currentDeg -=360
    }
}
