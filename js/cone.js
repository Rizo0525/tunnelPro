/**
 * 
 * @param {number} topRadius  上半径
 * @param {number} bottomRadius  下半径
 * @param {number} height  高
 * @param {number} horizontalCount 水平均分数量
 * @param {number} verticalCount 垂直均分数量
 */

function Cone(topRadius,bottomRadius,verticalCount){
    var height = 2.0
    var horizontalCount = 1
    this.name = "cone"
    this.verticePositions = []
    this.triangleIndices = []
    this.linesIndices = []
    for(var i=-1;i<=horizontalCount+1;i++){
        var y = (1/2-i/horizontalCount)*height
        var radius = topRadius + i*(bottomRadius-topRadius)/horizontalCount
        if(i==-1){
            radius = 0
            y = 1/2*height
        }else if(i==horizontalCount+1){
            radius = 0
            y = -1/2*height
        }
        for(var j=0;j<=verticalCount;j++){
            var x = radius * Math.cos(j*Math.PI*2/verticalCount)
            var z = radius * Math.sin(j*Math.PI*2/verticalCount)
            this.verticePositions.push(x,y,z)
        }
    }
    for(var i=0;i<=horizontalCount+1;i++){
        for(var j=0;j<verticalCount;j++){
            var v0 = i*(verticalCount+1)+j
            var v1 = (i+1)*(verticalCount+1)+j
            var v2 = (i+1)*(verticalCount+1)+j+1
            var v3 = i*(verticalCount+1)+j+1
            this.triangleIndices.push(v0,v1,v2,v2,v0,v3)
            this.linesIndices.push(v0,v1,v1,v2,v2,v0,v0,v2,v2,v3,v3,v0)
        }
    }
}