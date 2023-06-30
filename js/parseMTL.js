/**
 * 加载MTL文件
 * **/
function loadMTLFiles(url){
    let script = loadFileAJAX(url);
    let material=parseMTL(script);
    return material;
}


function parseMapArgs(unparsedArgs){
    return unparsedArgs;
}
function parseMTL(text) {
    const materials = {};
    let material;

    const keywords = {
        newmtl(parts, unparseArgs) {
            material = {};
            materials[unparseArgs] = material;
        },
        //关于点光源的镜面光泽度设置
        Ns(parts) {material.shininess = parseFloat(parts[0]);},
        //材质的环境光
        Ka(parts) {material.ambient = parts.map(parseFloat);},
        //散射光
        Kd(parts) {material.diffuse = parts.map(parseFloat);},
        //镜面光
        Ks(parts) {material.specular = parts.map(parseFloat);},
        //放射光
        Ke(parts) {material.emissive = parts.map(parseFloat);},
        map_Kd(parts,unparsedArgs) {material.diffuseMap = parseMapArgs(unparsedArgs);},
        map_Ns(parts,unparsedArgs) {material.specularMap = parseMapArgs(unparsedArgs);},
        map_Bump(parts,unparsedArgs) {material.normalMap = parseMapArgs(unparsedArgs);},
        map_Ka(parts,unparsedArgs) {material.evironmentMap = parseMapArgs(unparsedArgs);},
        map_Ks(parts,unparseArgs){material.mirrorMap = parseMapArgs(unparseArgs);},
        //光学密度
        Ni(parts){material.opticalDensity = parseFloat(parts[0]);},
        //滤光透射率
        Tf(parts){material.tf=parts.map(parseFloat)},
        //材质透明度
        Tr(parts){material.tr=parts.map(parseFloat)},
        //溶解，透明度
        d(parts){material.opacity=parseFloat(parts[0]);},
        //指定材质的光照模型，有11种类型
        illum(parts){material.illum=parseInt(parts[0]);},
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split("\n");
    for(let lineNo=0; lineNo<lines.length; lineNo++) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);
            continue;
        }
        handler(parts, unparsedArgs);
    }

    return materials;
}

/**
 * 加载文件
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