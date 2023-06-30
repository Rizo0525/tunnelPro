function bindViewEvent(cameraPosition){
    tb = new ObserverCamera(cameraPosition);
    this.onmousedown=function (event){
        tb.mouseButtonDown(event.clientX,event.clientY);
    }
    this.onmouseup=function (event){
        tb.mouseButtonUp();
    }
    this.onmousemove=function (event){
        tb.mouseMove(event.clientX,event.clientY);
    }
    this.onkeyup=function (event){
        tb.keyUp(event.code);
    }
    this.onkeydown=function (event){
        tb.keyDown(event.code);
    }
}

function ObserverCamera(position) {
    //this.modes=		{wasd=0,trackball=1};
    this.currentMode = 0;
    this.V =  SpiderGL.Math.Mat4.identity();

    SpiderGL.Math.Mat4.col$(this.V,3,position);//定义第四行

    this.position =[];
    // variables for the wasd mode
    this.t_V = [0, 0, 0, 0];
    this.alpha = 0;
    this.beta = 0;

    // variables for the trackball mode
    this.height = 0;
    this.width = 0;
    this.start_x = 0;
    this.start_y = 0;
    this.projectionMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    this.tbMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    this.updateCamera = function () {
        if (this.currentMode == 1)
            return;

        var dir_world = SpiderGL.Math.Mat4.mul4(this.V, this.t_V);//视角矩阵乘，视角变化向量


        var newPosition = [];
        newPosition = SpiderGL.Math.Mat4.col(this.V,3);//记录下视角矩阵的第4行
        newPosition = SpiderGL.Math.Mat4.add(newPosition, dir_world);//旧的视角矩阵第四行与变换后的视角矩阵第四行相加。
        SpiderGL.Math.Mat4.col$(this.V,3,[0.0,0.0,0.0,1.0]);//将视角矩阵第四行置为0.0，0.0，0.0，1.0；
        var R_alpha = SpiderGL.Math.Mat4.rotationAngleAxis(SpiderGL.Math.degToRad(this.alpha/10), [0, 1, 0]);
        var R_beta = SpiderGL.Math.Mat4.rotationAngleAxis(SpiderGL.Math.degToRad(this.beta/10), [1, 0, 0]);
        this.V = SpiderGL.Math.Mat4.mul(SpiderGL.Math.Mat4.mul(R_alpha, this.V), R_beta);//视角矩阵乘旋转矩阵
        SpiderGL.Math.Mat4.col$(this.V,3,newPosition);//置为变换后的第四行
        this.position = newPosition;
        this.alpha = 0;
        this.beta = 0;
    };

    this.forward 		= function (on) {this.t_V = [0, 0, -on / 1.0,0.0]	;};
    this.backward 	    = function (on) {this.t_V = [0, 0, on / 1.0,0.0]	;};
    this.left 			= function (on) {this.t_V = [-on / 1.0, 0, 0,0.0]	;};
    this.right 			= function (on) {this.t_V = [on / 1.0, 0, 0,0.0]	;};
    this.up 			= function (on) {this.t_V = [ 0.0, on/3.0, 0,0.0]	;};
    this.down 			= function (on) {this.t_V = [0.0, -on/3.0, 0,0.0]	;};

    me = this;
    this.handleKeyObserver = {};
    this.handleKeyObserver["KeyW"] = function (on) {me.forward(on)	;};
    this.handleKeyObserver["KeyS"] = function (on) {me.backward(on);	};
    this.handleKeyObserver["KeyA"] = function (on) {me.left(on);		};
    this.handleKeyObserver["KeyD"] = function (on) {me.right(on);		};
    this.handleKeyObserver["KeyQ"] = function (on) {me.up(on);			};
    this.handleKeyObserver["KeyE"] = function (on) {me.down(on);		};

    this.keyDown = function (keyCode) {
        this.handleKeyObserver[keyCode] && this.handleKeyObserver[keyCode](true);
    };
    this.keyUp = function (keyCode) {
        this.handleKeyObserver[keyCode] && this.handleKeyObserver[keyCode](false);
    };

    this.mouseButtonDown = function (x,y) {
        if (this.currentMode == 0) {
            this.aiming = true;
            this.start_x = x;
            this.start_y = y;
        }
    };
    this.mouseButtonUp = function (event) {//line 144,Listing pag 137{
        this.aiming = false;
    };
    this.mouseMove = function (x,y) {
        if (this.currentMode == 0) {
            if (this.aiming) {
                this.alpha = x - this.start_x;
                this.beta = -(y - this.start_y);
                this.start_x = x;
                this.start_y = y;
                this.updateCamera();
            }
            return;
        }
    }
    this.setView = function (stack) {
        this.updateCamera();
        var invV = SpiderGL.Math.Mat4.inverse(this.V);
        stack.multiply(invV);
        stack.multiply(this.tbMatrix);
    }
};