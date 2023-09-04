/**
 * 加载OBJ文件
 * **/
function loadOBJFiles(url) {
    let script = loadFileAJAX(url);
    let obj =parseOBJ(script);
    return obj;
}

/**
 * 转义OBJ文件
 * @param {String} text OBJ字符串内容
 * @return {Object}} object
 **/
function parseOBJ(text){
    //因为索引是从1开始的，所以填充索引为0的位置
    const objPositions = [[0,0,0]];
    const objTexcoord = [[0,0,]];
    const objNormals = [[0,0,0]];
    const objColors =[[0,0,0]];
    const materialLibs = [];//用来存储mtllib指定材质信息

    const objVertexData = [
        objPositions,
        objTexcoord,
        objNormals,
        objColors,
    ];

    let webglVertexData =[
      [],//顶点
      [],//纹理坐标
      [],//法线
      [],//颜色  并不是所有obj文件中都包含颜色信息
    ];

    //出炉usemtl
    const geometries = [];
    let geometry;
    let material = 'default';
    let object='default';
    let groups = ['default'];

    function newGeometry(){
        //如果有存在的几何体并且不是空的，销毁
        if(geometry && geometry.data.position.length){
            geometry=undefined;
        }
    }

    function setGeometry(){
        if(!geometry){
            const position = [];
            const texcoord = [];
            const normal = [];
            const color = [];
            webglVertexData=[
                position,
                texcoord,
                normal,
                color,
            ];
            geometry={
                object,
                groups,
                material,
                data:{
                    position,
                    texcoord,
                    normal,
                    color,
                },
            };
            geometries.push(geometry);
        }
    }

    const noop=()=>{};

    function addVertex(vert){
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr,i)=>{
            if(!objIndexStr) return;
            const objIndex = parseInt(objIndexStr);
            const index=objIndex + (objIndex>=0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);

            //如果这是位置索引并且解析到了颜色值，将顶点的颜色值复制到webgl顶点的颜色中
            if(i===0&&objColors.length>1){
                geometry.data.color.push(...objColors[index]);
            }
        })
    }
    //对应关键字方法
    const keywords={
        v(parts){
            // objPositions.push(parts.map(parseFloat));
            //如果超过3个值，就是顶点颜色
            if(parts.length>3){
                objPositions.push(parts.slice(0,3).map(parseFloat));
                objColors.push(parts.slice(3).map(parseFloat));
            }else{
                objPositions.push(parts.map(parseFloat));
            }
        },
        vn(parts){
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts){
            objTexcoord.push(parts.map(parseFloat));
        },
        f(parts){
            setGeometry();
            const numTriangles = parts.length -2;
            for(let tri = 0; tri < numTriangles; tri++){
                addVertex(parts[0]);
                addVertex(parts[tri+1]);
                addVertex(parts[tri+2]);
            }
        },
        usemtl(parts,unparseArgs){
            material=unparseArgs;
            newGeometry();
        },
        mtllib(parts, unparsedArgs) {
            materialLibs.push(unparsedArgs);
        },
        o(parts, unparsedArgs){
            object = unparsedArgs;
            newGeometry();
        },
        s:noop,//忽略掉s对应smoothing group。
        //smoothing groups让我们指定计算顶点法线时哪些面需要被包含
        // 大部分obj文件内部都包含法线
        g(parts){
            groups = parts;
            newGeometry()
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split("\n");
    //按行拆分
    for(let lineNo=0;lineNo<lines.length;++lineNo){
        const line = lines[lineNo].trim();//除去每行的两头空白
        if(line==='' || line.startsWith('#')){
            continue;
        }
        const m = keywordRE.exec(line);//匹配每句的开头关键字，和未解析内容
        if(!m){
            continue;
        }
        const [,keyword,unparseArgs]=m;
        const parts = line.split(/\s+/).slice(1);//以空格为划分标准，分隔后删除数组第一个字符
        const handler = keywords[keyword];
        if(!handler){
            console.warn("unhandled keyword: " + keyword,"at line",lineNo+1);
            continue;
        }
        handler(parts,unparseArgs);
    }

    //移除空数组
    for(const geometry of geometries){
        geometry.data = Object.fromEntries(
            Object.entries(geometry.data).filter(
                ([,array])=>array.length>0
            )
        );
    }

    return {
        materialLibs,
        geometries
    };
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