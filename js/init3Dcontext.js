/**
 * 获取canvas上下文，判定其是否支持webgl
 * @param canvas    canvas元素对象
 * @param opt       创建类型参数
 * @return context
 * **/
function create3DContext(canvas,opt){
    //判定当前浏览器是否支持WebGL
    let container = canvas.parentNode;
    if(!window.WebGLRenderingContext){
        if (container){
            container.innerHTML='<div style="">' +   'This page requires a browser that supports WebGL.<br/>' +
                '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>' + '</div>'
        }
        return null;
    }
    //创建webgl的上下文
    let names=["webgl","experimental-webgl","webkit-3d","moz-webgl"];
    let context = null;
    for(let i=0;i<names.length;i++){
        try{
            context=canvas.getContext(names[i],opt);
        }catch (e) {}
        if(context){
            break;
        }
    }
    if(!context){
        if (container){
            container.innerHTML='<div style="">' + '' +
                "It doesn't appear your computer can support WebGL.<br/>" +
                '<a href="http://get.webgl.org/troubleshooting/">Click here for more information.</a>' + '</div>'
        }
        return null;
    }
    return context;
}