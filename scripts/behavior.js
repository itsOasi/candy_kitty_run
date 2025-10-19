let behaviorRegistry = {
    controllerMove: {
        setup: function(obj){
            this.obj = obj
            this.speed = obj.speed
            this.moveLeftOk = false
            this.moveRightOk = false
            this.setMoveLeftOk = this.setMoveLeftOk.bind(this)
            this.setMoveRightOk = this.setMoveRightOk.bind(this)
            this.jump = this.jump.bind(this)
            this.jumpCount = 0
            messageBus.on("leftPressed", this.setMoveLeftOk)
            messageBus.on("rightPressed", this.setMoveRightOk)
            messageBus.on("jumpPressed", this.jump)
            this.debug = true
        },
        setMoveLeftOk: function(ok){
            //console.log(this.obj)
            this.moveLeftOk = ok
            this.update()
            //console.log(this.moveLeftOk, this.moveRightOk)
        },
        setMoveRightOk: function(ok){
            this.moveRightOk = ok
            this.update()
            //console.log(this.moveLeftOk, this.moveRightOk)
        },
        setJumpOk: function(ok){
            this.jumpOk = ok
        },
        moveLeft: function() {
         //   console.log(this.moveLeftOk)
            this.obj.data.phys.applyVelocity(this.obj, -this.obj.data.speed, 0)
        },
        moveRight: function() {
         //   console.log(this.moveRightOk)
            this.obj.data.phys.applyVelocity(this.obj, this.obj.data.speed, 0)
        },
        jump: function(ok) {
            if (!ok)
                return
            //console.log(this.jumpCount, this.obj.maxJumps)
            if (this.jumpCount < this.obj.maxJumps){
                this.obj.data.phys.applyVelocity(this.obj, 0, -this.obj.jumpStr)
                this.jumpCount ++
            }
        },
        update: function(world) {
            // console.log(this.obj.data.phys)
            let rayHit = this.obj.data.phys.castRay({x:this.obj.x, y:this.obj.y}, {x:0, y:1}, world, 100)
            this.obj.onGround = rayHit ? true : false
            //console.log(this.obj.onGround)
            if (!this.obj.onGround){
                this.obj.data.phys.applyGravity(this.obj)
                //console.log(this.obj.x, rayHit.point.x, this.obj.y, rayHit.point.y)
            }
            if (this.obj.onGround){
                //console.log(this.jumpCount)
                this.jumpCount = 0
                this.obj.data.phys.applyFriction(this.obj)
            }
            if (this.moveLeftOk)
                this.moveLeft()
            if (this.moveRightOk)            
                this.moveRight()            
        }
    },

    aiBasicMove: {  
        setup: function(obj){  
            this.obj = obj  
            this.obj.data.phys = this.obj.data.phys
            this.speed = obj.data.speed
            this.onGround = false 
        },  
        moveLeft: function() {
         //   console.log(this.moveLeftOk)
            this.obj.data.phys.applyVelocity(this.obj, -this.obj.data.speed, 0)
        },
        moveRight: function() {
         //   console.log(this.moveRightOk)
            this.obj.data.phys.applyVelocity(this.obj, this.obj.data.speed, 0)
        },
        jump: function(ok) {
            if (!ok)
                return
            //console.log(this.jumpCount, this.obj.maxJumps)
            if (this.jumpCount < this.obj.maxJumps){
                this.obj.data.phys.applyVelocity(this.obj, 0, -this.obj.jumpStr)
                this.jumpCount ++
            }
        },
        update: function(world) {
            let rayHit = this.obj.data.phys.castRay({x:this.obj.x, y:this.obj.y}, {x:0, y:1}, world, 100)
            this.obj.onGround = rayHit ? true : false
            //console.log(this.obj.onGround)
            if (!this.obj.onGround){
                this.obj.data.phys.applyGravity(this.obj)
                //console.log(this.obj.x, rayHit.point.x, this.obj.y, rayHit.point.y)
            }
            if (this.obj.onGround){
                //console.log(this.jumpCount)
                this.jumpCount = 0
                this.obj.data.phys.applyFriction(this.obj)
            }
            if (this.obj.data.cmd){
            //console.log(this.obj.data.cmd)
            switch (this.obj.data.cmd) {
                case "left":
                    //console.log("to the left")
                    this.moveLeft()
                    break
              
                case "right":
                    //console.log("to the right")
                    this.moveRight()
                    break
            }}
        }
    },  
    aiSpiderMove: {  
        setup: function(obj){  
            this.obj = obj  
            this.obj.data.phys = this.obj.data.phys
            this.speed = obj.data.speed
            this.onGround = false
            this.moveOk = false
        },  
        moveLeft: function() {
         //   console.log(this.moveLeftOk)
            this.obj.data.phys.applyVelocity(this.obj, -this.obj.data.speed, 0)
        },
        moveRight: function() {
         //   console.log(this.moveRightOk)
            this.obj.data.phys.applyVelocity(this.obj, this.obj.data.speed, 0)
        },
        jump: function(ok) {
            if (!ok)
                return
            //console.log(this.jumpCount, this.obj.maxJumps)
            if (this.jumpCount < this.obj.maxJumps){
                this.obj.data.phys.applyVelocity(this.obj, 0, -this.obj.jumpStr)
                this.jumpCount ++
            }
        },
        update: function(world) {
            let rayHit = this.obj.data.phys.castRay({x:this.obj.x, y:this.obj.y}, {x:0, y:1}, world, 100)
            this.obj.onGround = rayHit ? true : false
            //console.log(this.obj.onGround)
            if (!this.obj.onGround){
                this.obj.data.phys.applyGravity(this.obj)
                //console.log(this.obj.x, rayHit.point.x, this.obj.y, rayHit.point.y)
            }
            if (this.obj.onGround){
                //console.log(this.jumpCount)
                this.jumpCount = 0
                this.obj.data.phys.applyFriction(this.obj)
            }
            if (this.obj.data.cmd && this.moveOk){
            //console.log(this.obj.data.cmd)
            switch (this.obj.data.cmd) {
                case "left":
                    //console.log("to the left")
                    this.jump()
                    this.moveLeft()
                    break
              
                case "right":
                    //console.log("to the right")
                    this.jump()
                    this.moveRight()
                    break
            }}
        }
    },  
    basicGravity: {  
        setup: function(obj){  
            this.obj = obj  
            this.obj.data.phys = this.obj.data.phys  
        },  
        update: function(world){  
            let rayHit = this.obj.data.phys.castRay({x:this.obj.x, y:this.obj.y}, {x:0, y:1}, world, 100)
            this.obj.onGround = rayHit ? true : false
            //console.log(this.obj.onGround)
            if (!this.obj.onGround){
                this.obj.data.phys.applyGravity(this.obj)
                //console.log(this.obj.x, rayHit.point.x, this.obj.y, rayHit.point.y)
            }
        }  
    },
    cellBasicSpawnMove: {
        setup: function (cell) {
            this.cell = cell
            let collapse = Math.random()
            if (collapse < cell.data.spawnChance){
                console.log(cell.data, cell.pos)
                let coord = {x: this.cell.pos.x, y: this.cell.pos.y-(this.cell.size.h)-100}
                messageBus.emit("aiSpawnRequest", {"unit": cell.data.spawnUnit, "coord":coord})
            }
                
        },
        update: function (data) {
            //console.log(data)
            this.cell.pos.x -= data.speed
        }
    }

}

