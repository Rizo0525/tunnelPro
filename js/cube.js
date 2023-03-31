function Cube(){
    this.name = "cube"
    this.linesIndices = []
    this.verticePositions = new Float32Array([
        //正面
		-1.0,1.0,-1.0,  //左上  0
        -1.0,-1.0,-1.0, //左下  1
        1.0,-1.0,-1.0, //右下   2
        1.0,1.0,-1.0, //右上    3
        //背面
        1.0,1.0,1.0, //右上     4
        1.0,-1.0,1.0, //右下    5
        -1.0,-1.0,1.0, //左下   6
        -1.0,1.0,1.0 //左上     7
	]);
    //triangles
	this.triangleIndices = new Uint16Array([
		0,1,2,2,0,3, //front
        7,6,5,5,7,4, //back
        7,6,1,1,7,0, //left
        3,2,5,5,3,4, //right
        0,3,7,7,3,4, //top
        6,5,1,1,5,2//bottom
	]);
    //lines
    for(var i=0;i<this.triangleIndices.length/3;i++){
        this.linesIndices[i*6+0] = this.triangleIndices[i*3+0];
        this.linesIndices[i*6+1] = this.triangleIndices[i*3+1];
        this.linesIndices[i*6+2] = this.triangleIndices[i*3+0];
        this.linesIndices[i*6+3] = this.triangleIndices[i*3+2];
        this.linesIndices[i*6+4] = this.triangleIndices[i*3+1];
        this.linesIndices[i*6+5] = this.triangleIndices[i*3+2];
    }
}