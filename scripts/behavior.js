let behaviorRegistry = {
    controllerMove: {
        setup: function(obj){
            this.phys = new Physics(1)
            this.obj = obj
            this.speed = obj.speed
            this.moveLeftOk = false
            this.moveRightOk = false
            this.setMoveLeftOk = this.setMoveLeftOk.bind(this)
            this.setMoveRightOk = this.setMoveRightOk.bind(this)
            this.onGround = false
            messageBus.on("leftPressed", this.setMoveLeftOk)
            messageBus.on("rightPressed", this.setMoveRightOk)
            this.debug = true
        },
        setMoveLeftOk: function(ok){
            this.moveLeftOk = ok
        },
        setMoveRightOk: function(ok){
            this.moveRightOk = ok
        },
        moveLeft: function() {
            console.log("moving left")
            this.phys.applyVelocity(this.obj, -this.obj.speed, 0)
            this.phys.applyFriction(this.obj)
        },
        moveRight: function() {
            console.log("moving right")
            this.phys.applyVelocity(this.obj, this.obj.speed, 0)
            this.phys.applyFriction(this.obj)
        },
        update: function() {
            this.phys.applyGravity(this.obj)
            console.log(this.obj)
            if (this.moveLeftOk){
                this.moveLeft()
            }
            if (this.moveRightOk){
                this.moveRight()
            }
        }
    },

    basicMove: {  
        setup: function(obj){  
            this.phys = new Physics(1)  
            this.obj = obj  
            this.speed = obj.speed  
            this.onGround = false  
        },  
        moveLeft: function() {  
            this.phys.applyVelocity(this.obj, -this.obj.speed, 0)  
            this.phys.applyFriction(this.obj)  
        },  
        moveRight: function() {  
            this.phys.applyVelocity(this.obj, this.obj.speed, 0)  
            this.phys.applyFriction(this.obj)  
        },  
        update: function() {  
            if (this.obj.target < this.obj.x) this.moveLeft()  
            if (this.obj.target > this.obj.x) this.moveRight()  
        }  
    },  

    basicGravity: {  
        setup: function(obj){  
            this.phys = new Physics(1)  
            this.obj = obj  
        },  
        update: function(){  
            this.phys.applyGravity(this.obj)
        }  
    }

}

