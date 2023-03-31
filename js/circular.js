/**
 * 
 * @param {number} resolution  将圆环分成多少份
 * @param {number} innerRadius 小圆半径
 * @param {number} outerRadius 大圆半径
 */
function Circular(resolution,width){
    this.name = "circular"
    // this.width = outerRadius - innerRadius
    this.verticePositions = []
    this.triangleIndices = []
    this.linesIndices = []
    var radius = 1000.0
    for(i=0;i<resolution;i++){
        var angle = i * Math.PI * 2 / resolution
        // var innerX = Math.cos(angle)*innerRadius
        var innerX = Math.cos(angle) * (radius - width/2.0)
        var innerY = 0.0
        var innerZ = Math.sin(angle) * (radius - width/2.0)
        // var innerZ = Math.sin(angle)*innerRadius
        // var outerX = Math.cos(angle)*outerRadius
        var outerX = Math.cos(angle) * (radius + width/2.0)
        var outerY = 0.0
        // var outerZ = Math.sin(angle)*outerRadius
        var outerZ = Math.sin(angle) * (radius + width/2.0)
        this.verticePositions.push(innerX,innerY,innerZ,
            outerX,outerY,outerZ)
        var v0 = i*2
        var v1 = v0+1
        var v2 = v0+2
        var v3 = v0+3
        if(i==resolution-1){
            v2 = 0
            v3 = 1
        }
        //triangles
        this.triangleIndices.push(v0,v1,v2,v2,v1,v3)
        this.linesIndices.push(v0,v1,v1,v2,v2,v0,v1,v2,v2,v3,v3,v0)
    }
}