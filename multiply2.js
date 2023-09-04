window.onload = function(){
    /*获取canvas，gl上下文*/
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl');
    this.stackSpace=new SpiderGL.Space.MatrixStack();

    /*加载绘制物体shaders文件*/
    // const vs = loadFileAJAX('./shaders/multiplyVs.frag');
    // const fs = loadFileAJAX('./shaders/multiplyFs.frag');
    const vs = loadFileAJAX('./shaders/noMirrorVer.frag');
    const fs = loadFileAJAX('./shaders/noMirrorFrag.frag');
    const meshProgramInfo = webglUtils.createProgramInfo(gl,[vs, fs]);

    /*加载抓取物体shaders文件*/
    const pickingVs = loadFileAJAX('./shaders/pickVertex.frag');
    const pickingFs = loadFileAJAX('./shaders/pickFragment.frag');
    const pickingProgramInfo = webglUtils.createProgramInfo(gl,[pickingVs,pickingFs])

    /*加载物体文件*/
    const objHref ='./model/computer/pc98.obj';
    const mtlHref ='./model/computer/pc98.mtl';
    const object=loadObject(objHref,mtlHref);

    /*创建对应纹理*/
    setMaterial(gl,object,objHref);

    /*创建缓冲区*/
    const parts=createBuffer(gl,object);

    /*构建物体对象集*/
    const numObjects=5;
    const objForDraw=createObjects(parts,numObjects,meshProgramInfo);

    /*创建帧缓冲区与渲染缓冲区，为实现鼠标抓取*/
    // const frame=createFrame(gl);

    //绘制
    // draw(gl,object,frame,objForDraw,{meshProgramInfo,pickingProgramInfo});
    draw(gl,object,objForDraw,{meshProgramInfo,pickingProgramInfo})
}

/**
 * @param {string} pathToOBJFile obj文件路径
 * @param {string} pathToMTLFile mtl文件路径
 * @return {{materials: *, obj: *}} 包含解析后物体数据的对象
 */
function loadObject(pathToOBJFile,pathToMTLFile) {
    //加载并解析OBJ文件
    const obj=loadOBJFiles(pathToOBJFile);
    //加载并解析mtl文件
    const materials=loadMTLFiles(pathToMTLFile);

    return{
        obj,
        materials,
    }
}
/**
 * 设置纹理
 * @param {object}  gl
 * @param {object}  object  物体数据对象
 * @param {string}  objHref 物体文件存储路径
 * */
function setMaterial(gl,object,objHref){
    //纹理图片存储路径拼接
    const baseHref =new URL(objHref,window.location.href);
    //创建默认纹理，在无纹理内容时填充
    const textures = {
        defaultWhite:create1PixelTexture(gl,[255,255,255,255])
    }
    /*加载对应纹理*/
    for(const material of Object.values(object.materials)){
        Object.entries(material)
            .filter(([key])=>key.endsWith('Map'))
            .forEach(([key,filename])=>{
                let texture =textures[filename];
                if(!texture){
                    const textureHref = new URL(filename,baseHref).href;
                    texture = createTexture(gl,textureHref);
                    textures[filename]=texture;
                }
                material[key]=texture;
            })
    }

    object.textures = textures;
}
/**
 * 创建缓冲区
 * @param gl
 * @param object 物体数据对象
 * @return parts
 */
function createBuffer(gl,object){

    //设置shader变量默认参数
    const defaultMaterial = {
        diffuse: [1, 1, 1],
        diffuseMap: object.textures.defaultWhite,
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        shininess: 400,
        opacity: 1,
        specularMap: object.textures.defaultWhite,
        evironmentMap:object.textures.defaultWhite,
        mirrorMap:object.textures.defaultWhite,
    };

    //创建buffer
    const parts = object.obj.geometries.map(({material,data})=>{
        if(data.color){
            if (data.position.length === data.color.length){
                data.color = {numComponents:3,data:data.color};
            }
        }else{
            data.color = {value:[1,1,1,1]}
        }
        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl,data);
        return {
            material:{
                ...defaultMaterial,
                ...object.materials[material],
            },
            bufferInfo,
        }
    })
    return parts;
}
/**
 * 创建多个物体对象数据集，包含uniforms数据
 * @param {object} parts  单个物体数据对象
 * @param {Number} numObjects 包含的物体个数
 * @param programInfo 用于绘制的program
 */
function createObjects(parts,numObjects,programInfo){
    const objects=[];
    const objectsToDraw=[];
    for(let i =0;i<numObjects;i++){
        const id = i+1;
        const object ={
            uniforms:{
                u_colorMult:[0.3,0.3,0.3,0.3],
                u_id: [
                    ((id >>  0) & 0xFF) / 0xFF,
                    ((id >>  8) & 0xFF) / 0xFF,
                    ((id >> 16) & 0xFF) / 0xFF,
                    ((id >> 24) & 0xFF) / 0xFF,
                ],
                u_lightDirection: SpiderGL.Math.Vec3.normalize([-1,3,5]),
                // u_view: m4.identity(),
                // u_projection: m4.identity(),
                u_matrix:SpiderGL.Math.Quat.identity(),
                u_viewWorldPosition: SpiderGL.Math.Quat.identity(),
            }
        }
        objects.push(object);
        objectsToDraw.push({
            programInfo:programInfo,
            bufferInfo:parts,
            uniforms:object.uniforms,
            translation:[Math.random()*4,Math.random()*4,Math.random()*4]
        })
    }
    return{
        objects,
        objectsToDraw
    }
}
/**
 * 创建帧缓冲区、渲染缓冲区
 * @param gl
 */
function createFrame(gl){
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,targetTexture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);

    //创建渲染buffer
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);

    //创建帧buffer
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);

    const attachment = gl.COLOR_ATTACHMENT0;
    const level = 0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER,attachment,gl.TEXTURE_2D,targetTexture,level);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthBuffer);

    return {
        targetTexture,
        depthBuffer,
        framebuffer,
    }
}

function getAttributes(object){
    const extents = getGeometriesExtents(object.obj.geometries);
    const range = SpiderGL.Math.Vec3.sub(extents.max,extents.min);
    const objOffset =  SpiderGL.Math.Vec3.muls(
        SpiderGL.Math.Vec3.add(extents.min,
            SpiderGL.Math.Vec3.muls(range,0.5)
        ),-1)
    const cameraTarget = [0, 0, 0];
    const radius = SpiderGL.Math.Vec3.length(range)*1.2;
    const cameraPosition = SpiderGL.Math.Vec3.add(cameraTarget,[0,0,radius]);

    const zNear = radius / 100;
    const zFar = radius * 3;

    return {
        objOffset,
        cameraPosition,
        cameraTarget,
        zNear,
        zFar,
    }
}

function draw(gl,object,objForDraw,programInfo){
    const {objOffset, cameraPosition,cameraTarget, zNear, zFar}=getAttributes(object);
    let mouseX = -1;
    let mouseY = -1;
    let oldPickNdx = -1;
    let oldPickColor;
    let frameCount=0;
    let stack = this.stackSpace;

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
    let frame=createFrame(gl)
    requestAnimationFrame(render);

    function render(){

        if(webglUtils.resizeCanvasToDisplaySize(gl.canvas)){
            gl.bindTexture(gl.TEXTURE_2D,frame.targetTexture);

            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.canvas.width,
                gl.canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);

            gl.bindRenderbuffer(gl.RENDERBUFFER,frame.depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,gl.canvas.width,gl.canvas.height);
        }
        stack.loadIdentity();
        const aspect=gl.canvas.width/gl.canvas.height;
        const projection = SpiderGL.Math.Mat4.perspective(SpiderGL.Math.degToRad(60),aspect,zNear,zFar);
        stack.multiply(projection);
        tb.setView(stack)


        objForDraw.objects.forEach(function (object){
            object.uniforms.u_matrix=stack.matrix;
            object.uniforms.u_viewWorldPosition=cameraPosition;
        })

        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
        gl.clearColor(1,1,1,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        drawToFrame(frame,objForDraw.objectsToDraw)

        pick(objForDraw.objects);

        drawToCanvas(frame,objForDraw.objectsToDraw);
        requestAnimationFrame(render);
    }


    function drawToFrame(frame,objectsToDraw){
        gl.bindFramebuffer(gl.FRAMEBUFFER,frame.framebuffer);
        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

        objectsToDraw.forEach(function (object){
            const ProgramInfo = programInfo.pickingProgramInfo
            gl.useProgram(ProgramInfo.program);

            webglUtils.setUniforms(ProgramInfo,object.uniforms);

            let u_world = SpiderGL.Math.Mat4.rotationAngleAxis(SpiderGL.Math.degToRad(60),[0,1,0]);
            const offset = SpiderGL.Math.Vec3.add(objOffset,object.translation);
            u_world = SpiderGL.Math.Mat4.translate$(u_world,[...offset,1]);

            for(const {bufferInfo,material} of object.bufferInfo){
                webglUtils.setBuffersAndAttributes(gl,ProgramInfo,bufferInfo);
                webglUtils.setUniforms(ProgramInfo,{u_world});
                webglUtils.drawBufferInfo(gl,bufferInfo);
            }
        })
    }

    function pick(objects){
        const pixelX=mouseX * gl.canvas.width / gl.canvas.clientWidth;
        const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight -1;
        const data = new Uint8Array(4);
        gl.readPixels(
            pixelX,            // x
            pixelY,            // y
            1,                 // width
            1,                 // height
            gl.RGBA,           // format
            gl.UNSIGNED_BYTE,  // type
            data);             // typed array to hold result

        const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

        if(oldPickNdx>=0){
            const object = objects[oldPickNdx];
            object.uniforms.u_colorMult = oldPickColor;
            oldPickNdx = -1;
        }

        if(id>0){
            const pickNdx = id-1;
            oldPickNdx=pickNdx;
            const object = objects[pickNdx];
            oldPickColor = object.uniforms.u_colorMult;
            object.uniforms.u_colorMult = (frameCount & 0x8) ? [1,0,0,1]:[1,1,1,1];
        }
    }

    function drawToCanvas(frame,objectsToDraw){
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

        objectsToDraw.forEach(function(object){
            const ProgramInfo = programInfo.meshProgramInfo;
            gl.useProgram(ProgramInfo.program);

            webglUtils.setUniforms(ProgramInfo,object.uniforms);

            let u_world = SpiderGL.Math.Mat4.rotationAngleAxis(SpiderGL.Math.degToRad(60),[0,1,0]);
            const offset = SpiderGL.Math.Vec3.add(objOffset,object.translation);
            u_world = SpiderGL.Math.Mat4.translate$(u_world,[...offset,1]);

            for(const {bufferInfo,material} of object.bufferInfo){
                webglUtils.setBuffersAndAttributes(gl,ProgramInfo,bufferInfo);
                webglUtils.setUniforms(ProgramInfo,{
                    u_world,
                },material);
                webglUtils.drawBufferInfo(gl,bufferInfo);
            }
        })
    }

    gl.canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
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
