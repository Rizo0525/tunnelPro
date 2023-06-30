let stackSpace = new SpiderGL.Space.MatrixStack();
window.onload = function (){
    const canvas = document.querySelector('#canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const gl = create3DContext(canvas);

    //绘制图形着色器
    const vs = loadFileAJAX('./shaders/mainVer.frag');
    const fs = loadFileAJAX('./shaders/mainFrag.frag');
    //抓取的着色器
    // const pickVs=  loadFileAJAX('./shaders/pickVertex.frag');
    // const pickFs= loadFileAJAX('./shaders/pickFragment.frag');

    const programInfo = webglUtils.createProgramInfo(gl,[vs,fs]);
    // const pickingProgramInfo = webglUtils.createProgramInfo(gl,[pickVs,pickFs]);

    const objHref = './model/car/Pony_cartoon.obj';
    const mtlHref = './model/car/Pony_cartoon.mtl';

    createObjects(objHref,mtlHref);

    setMaterial(gl);

    setAttributes(gl,programInfo);
}

async function createObjects(pathToOBJFile,pathToMTLFile){
    this.obj = loadOBJFiles(pathToOBJFile);
    this.materials=loadMTLFiles(pathToMTLFile);
    this.baseHref = new URL(pathToOBJFile,window.location.href);

}

function setMaterial(gl){
    this.textures = {
        defaultWhite:create1PixelTexture(gl,[255,255,255,255])
    }
    const baseHref = this.baseHref;
    const materials= this.materials;
    const textures= this.textures;

    //加载texture
    for(const material of Object.values(materials)){
        Object.entries(material)
            .filter(([key])=>key.endsWith('Map'))
            .forEach(([key,filename])=>{
                let texture = textures[filename];
                if(!texture){
                    const textureHref = new URL(filename,baseHref).href;
                    texture = createTexture(gl,textureHref);
                    textures[filename]=texture;
                }
                material[key] = texture;
            });
    }

}

function setAttributes(gl,programInfo){
    const obj = this.obj;
    const materials = this.materials;
    const textures = this.textures;

    const defaultMaterial={
        diffuse: [1, 1, 1],
        diffuseMap: textures.defaultWhite,
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        shininess: 400,
        opacity: 1,
        specularMap: textures.defaultWhite,
        evironmentMap:textures.defaultWhite,
        mirrorMap:textures.defaultWhite,
    }

    const parts = obj.geometries.map(({material,data})=>{
        if(data.color){
            if(data.position.length === data.color.length){
                data.color = {numComponents:3,data:data.color};
            }
        }else{
            data.color = {value:[1,1,1,1]};
        }
        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl,data);
        return {
            material:{
                ...defaultMaterial,
                ...materials[material],
            },
            bufferInfo,
        };
    });
    console.log(parts)

    const extents = getGeometriesExtents(obj.geometries);
    const range = SpiderGL.Math.Vec3.sub(extents.max,extents.min);

    const objOffset =  SpiderGL.Math.Vec3.muls(
        SpiderGL.Math.Vec3.add(extents.min,
            SpiderGL.Math.Vec3.muls(range,0.5)
        ),-1)
    console.log(objOffset)
    const cameraTarget = [0,0,0];
    const radius = SpiderGL.Math.Vec3.length(range)*1.2;
    const cameraPosition = SpiderGL.Math.Vec3.add(cameraTarget,[0,0,radius]);

    tb= new ObserverCamera([...cameraPosition,1]);//定义相机初始位置
    this.onmousedown=function (event){
        tb.mouseButtonDown(event.clientX,event.clientY);}
    this.onmouseup=function (event){
        tb.mouseButtonUp();}
    this.onmousemove=function (event){
        tb.mouseMove(event.clientX,event.clientY);}
    this.onkeyup=function (event){
        tb.keyUp(event.code);}
    this.onkeydown=function (event){
        tb.keyDown(event.code);}

    const zNear = radius/100;
    const zFar = radius*3;

    function render(){
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        let stack = stackSpace;
        stack.loadIdentity();

        const fieldOfViewRadians=SpiderGL.Math.degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = SpiderGL.Math.Mat4.perspective(fieldOfViewRadians,aspect,zNear,zFar);

        stack.multiply(projection);// projection视角矩阵

        tb.setView(stack);//设置相机位置和观察位置，同时绑定移动视角

        const sharedUniforms = {
            u_lightDirection: SpiderGL.Math.Vec3.normalize([-1, 3, 5]),
            // u_view: view,
            // u_projection: projection,
            u_colorMult:[1,1,1,1],
            u_matrix:stack.matrix,
            u_viewWorldPosition: cameraPosition,
        };

        gl.useProgram(programInfo.program);

        webglUtils.setUniforms(programInfo,sharedUniforms);

        let u_world = SpiderGL.Math.Mat4.rotationAngleAxis(SpiderGL.Math.degToRad(60),[0,1,0]);
        u_world=SpiderGL.Math.Mat4.translate$(u_world,objOffset);

        for (const {bufferInfo, material} of parts) {
            // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
            webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
            // calls gl.uniform
            webglUtils.setUniforms(programInfo, {
                u_world,
            }, material);
            // calls gl.drawArrays or gl.drawElements
            webglUtils.drawBufferInfo(gl, bufferInfo);
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function create1PixelTexture(gl, pixel) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(pixel));
    return texture;
}

function createTexture(gl, url) {
    const texture = create1PixelTexture(gl, [128, 192, 255, 255]);
    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

        // Check if the image is a power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });
    return texture;
}

function getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
        for (let j = 0; j < 3; ++j) {
            const v = positions[i + j];
            min[j] = Math.min(v, min[j]);
            max[j] = Math.max(v, max[j]);
        }
    }
    return {min, max};
}

function getGeometriesExtents(geometries) {
    return geometries.reduce(({min, max}, {data}) => {
        const minMax = getExtents(data.position);
        return {
            min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
            max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
    }, {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
    });
}