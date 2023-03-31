/**
 * 
 * @param {number} sphereRadius  球体半径
 * @param {number} horizontalCount  水平均分数量
 * @param {number} verticalCount  垂直均分数量
 */
function Sphere(horizontalCount,verticalCount){
    var sphereRadius = 1.0
    this.name = "sphere"
    this.verticePositions = []
    this.triangleIndices = []
    this.linesIndices = []
    for (var i=0;i<=horizontalCount;i++){
        var hAngle = i * Math.PI / horizontalCount
        var y = sphereRadius * Math.cos(hAngle)
        var verticalRadius = sphereRadius * Math.sin(hAngle)
        for(var j=0;j<=verticalCount;j++){
            var vAngle = j * Math.PI * 2 / verticalCount
            var x = verticalRadius * Math.cos(vAngle)
            var z = verticalRadius * Math.sin(vAngle)
            this.verticePositions.push(x,y,z)
        }
    }
    for (var i=0;i<horizontalCount;i++){
        for(var j=0;j<verticalCount;j++){
            var v0 = i*(verticalCount+1)+j
            var v1 = (i+1)*(verticalCount+1)+j
            var v2 = (i+1)*(verticalCount+1)+j+1
            var v3 = i*(verticalCount+1)+j+1
            //tirangles
            this.triangleIndices.push(v0,v1,v2,v2,v0,v3)
            //lines
            this.linesIndices.push(v0,v1,v1,v2,v2,v0,v0,v2,v2,v3,v3,v0)
        }
    }
}