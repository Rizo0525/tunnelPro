"use strict";

// This is not a full .obj parser.
// see http://paulbourke.net/dataformats/obj/



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


async function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    const vs = loadFileAJAX("./shaders/multiplyVs.frag");

    const fs = loadFileAJAX("./shaders/multiplyFs.frag");

    const pickingVs = loadFileAJAX("./shaders/pickVertex.frag")
    const pickingFs = loadFileAJAX("./shaders/pickFragment.frag");

    // compiles and links the shaders, looks up attribute and uniform locations
    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

    const pickingProgramInfo = webglUtils.createProgramInfo(gl,[pickingVs, pickingFs]);

    const objHref = './model/computer/pc98.obj';
    const baseHref = new URL(objHref, window.location.href);
    const obj = loadOBJFiles(objHref);
    const materials=loadMTLFiles("./model/computer/pc98.mtl");


    const textures = {
        defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
    };

    // load texture for materials
    for (const material of Object.values(materials)) {
        Object.entries(material)
            .filter(([key]) => key.endsWith('Map'))
            .forEach(([key, filename]) => {
                let texture = textures[filename];
                if (!texture) {
                    const textureHref = new URL(filename, baseHref).href;
                    texture = createTexture(gl, textureHref);
                    textures[filename] = texture;
                }
                material[key] = texture;
            });
    }

    const defaultMaterial = {
        diffuse: [1, 1, 1],
        diffuseMap: textures.defaultWhite,
        ambient: [0, 0, 0],
        specular: [1, 1, 1],
        shininess: 400,
        opacity: 1,
        specularMap: textures.defaultWhite,
        evironmentMap:textures.defaultWhite,
        mirrorMap:textures.defaultWhite,
    };

    const parts = obj.geometries.map(({material, data}) => {


        if (data.color) {
            if (data.position.length === data.color.length) {
                // it's 3. The our helper library assumes 4 so we need
                // to tell it there are only 3.
                data.color = { numComponents: 3, data: data.color };
            }
        } else {
            // there are no vertex colors so just use constant white
            data.color = { value: [1, 1, 1, 1] };
        }

        // create a buffer for each array by calling
        // gl.createBuffer, gl.bindBuffer, gl.bufferData
        const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
        return {
            material: {
                ...defaultMaterial,
                ...materials[material],
            },
            bufferInfo,
        };
    });

    const objects=[];
    const objectsToDraw=[]

    const numObjects=5;
    for(let i = 0; i <numObjects ; i++) {
        const id = i+1;
        const object = {
            uniforms:{
                u_colorMult:[0.3,0.3,0.3,0.3],
                u_id: [
                    ((id >>  0) & 0xFF) / 0xFF,
                    ((id >>  8) & 0xFF) / 0xFF,
                    ((id >> 16) & 0xFF) / 0xFF,
                    ((id >> 24) & 0xFF) / 0xFF,
                ],
                u_lightDirection: m4.normalize([-1, 3, 5]),
                u_view: m4.identity(),
                u_projection: m4.identity(),
                // u_matrix:SpiderGL.Math.Quat.identity(),
                u_viewWorldPosition: m4.identity(),
            },
        }
        objects.push(object);
        objectsToDraw.push({
            programInfo:meshProgramInfo,
            bufferInfo:parts,
            uniforms:object.uniforms,
            translation:[Math.random()*4,Math.random()*4,Math.random()*4]
        })
    }

    //----------------------------------------------------------------
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);

    function setFramebufferAttachmentSizes(width, height) {
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        // define size and format of level 0
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = null;
        // const data = texture
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border,
            format, type, data);

        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    }

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const attachment = gl.COLOR_ATTACHMENT0;
    const level = 0;

    gl.framebufferTexture2D(gl.FRAMEBUFFER,attachment,gl.TEXTURE_2D,targetTexture,level);

    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthBuffer);

    //----------------------------------------------------------------

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

    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    // amount to move the object so its center is at the origin
    const objOffset = m4.scaleVector(
        m4.addVectors(
            extents.min,
            m4.scaleVector(range, 0.5)),
        -1);
    const cameraTarget = [0, 0, 0];
    // figure out how far away to move the camera so we can likely
    // see the object.
    const radius = m4.length(range) * 1.2;
    const cameraPosition = m4.addVectors(cameraTarget, [
        0,
        0,
        radius,
    ]);
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    const zNear = radius / 100;
    const zFar = radius * 3;

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    let mouseX = -1;
    let mouseY = -1;
    let oldPickNdx = -1;
    let oldPickColor;
    let frameCount = 0;

    function render(time) {
        time *= 0.001;  // convert to seconds


        if(webglUtils.resizeCanvasToDisplaySize(gl.canvas)){
            setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
        }

        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.width / gl.canvas.height;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        const up = [0, 1, 0];
        // Compute the camera's matrix using look at.
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);

        // Make a view matrix from the camera matrix.
        const view = m4.inverse(camera);


        objects.forEach(function (object) {
            object.uniforms.u_view=view;
            object.uniforms.u_projection=projection;
            object.uniforms.u_viewWorldPosition=cameraPosition;
        })

        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);/
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(1, 1, 1, 1);   // clear to white
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);




        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


            objectsToDraw.forEach(function (object) {
                // const programInfo = object.programInfo;
                const programInfo = pickingProgramInfo;
                gl.useProgram(programInfo.program);

                // calls gl.uniform
                webglUtils.setUniforms(programInfo, object.uniforms);

                // compute the world matrix once since all parts
                // are at the same space.
                let u_world = m4.yRotation(time);
                const offset = m4.addVectors(objOffset, object.translation);
                u_world = m4.translate(u_world, ...offset);

                for (const {bufferInfo, material} of object.bufferInfo) {
                    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
                    webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
                    // calls gl.uniform
                    webglUtils.setUniforms(programInfo,{
                        u_world
                    });
                    // calls gl.drawArrays or gl.drawElements
                    webglUtils.drawBufferInfo(gl, bufferInfo);
                }
            })
        }


        //----------------------------------------------------------------
        {
            const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
            const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
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

            if (oldPickNdx >= 0) {
                const object = objects[oldPickNdx];
                object.uniforms.u_colorMult = oldPickColor;
                oldPickNdx = -1;
            }

            if (id > 0) {
                const pickNdx = id - 1;
                oldPickNdx = pickNdx;
                const object = objects[pickNdx];
                oldPickColor = object.uniforms.u_colorMult;
                object.uniforms.u_colorMult = (frameCount & 0x8) ? [1, 0, 0, 1] : [1, 1, 0, 1];
            }
        }

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            objectsToDraw.forEach(function (object) {
                const programInfo = object.programInfo;
                // const programInfo = pickingProgramInfo;
                gl.useProgram(programInfo.program);

                // calls gl.uniform
                webglUtils.setUniforms(programInfo, object.uniforms);

                // compute the world matrix once since all parts
                // are at the same space.
                let u_world = m4.yRotation(time);
                const offset = m4.addVectors(objOffset, object.translation);
                u_world = m4.translate(u_world, ...offset);

                for (const {bufferInfo, material} of object.bufferInfo) {
                    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
                    webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
                    // calls gl.uniform
                    webglUtils.setUniforms(programInfo, {
                        u_world,
                    }, material);
                    // calls gl.drawArrays or gl.drawElements
                    webglUtils.drawBufferInfo(gl, bufferInfo);
                }
            })
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    gl.canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
}

main();