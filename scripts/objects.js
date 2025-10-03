class Grid {
    constructor(canvasWidth, canvasHeight, textureLocations) {
        this.ww = canvasWidth
        this.wh = canvasHeight
        this.cells = []
        this.cellWidth = this.wh*.125
        this.speed = 1
        this.portraitMode = this.wh > this.ww ? true : false
        this.texLoc = textureLocations
        this.textures = {}
        this.buildOk = true
        messageBus.on("buildTimeout", _=>{this.buildOk = true})
        // load ground textures
    }
    loadTextures(){}
    addDebugCell(row, col, width, height, isObstacle=false){
        let cell = {
            x: row, 
            y: col, 
            w: width, 
            h: height,
            z: 0,
            r: Math.floor(col*(255/this.width)),
            g: Math.floor(row*(255/this.depth)),
            b: 0,
            o: isObstacle
        }
        //console.log(cell)
        this.cells.push(cell)
    }
    addCell(pos, size, color, tex, isObst){
        let cell = {
            x: pos.x, 
            y: pos.y, 
            w: size.w, 
            h: size.h,
            r: color.r,
            g: color.g,
            b: color.b,
            tex: tex ? tex : null
        }
        //console.log(cell)
        this.cells.push(cell)
    }
    addGround(x){
        this.addCell({x:x, y:this.wh*.5}, 
            {w:this.portraitMode ? this.ww : this.ww/2, 
                h:this.wh*.6},
            {r: 0, g: 200, b: 0}, null)
    }
    addObSmall(x){
        this.addCell({x:x, y:(this.wh*.5)-this.cellWidth}, 
            {w:this.cellWidth*2, h:this.cellWidth},
            {r: 200, g: 150, b: 120}, null)
    } // fire hydrant, bush
    addObLarge(x){
        this.addCell({x:x, y:(this.wh*.5)-this.cellWidth*2}, 
            {w:this.cellWidth*2, h:this.cellWidth*2},
            {r: 200, g: 200, b: 200}, null)
    } // foreground tree, truck, brick building
    addPlat(x){
        this.addCell({x:x, y:(this.wh*.5)-this.cellWidth*3}, 
            {w:this.cellWidth*2, h:this.cellWidth*.5},
            {r: 100, g: 100, b: 100}, null)
    } // tree limb, roof, construction platform
    initWorld(){
        this.addGround(0)
        this.addObLarge(this.ww*.55)
        this.addObSmall(this.ww*.5)
        this.addPlat(this.ww*.75)
    }
    update(){
        if (this.cells.length < 20 && this.buildOk){
            this.buildOk = false
            this.generateNext()
            startTimer(1, ()=>{messageBus.emit("buildTimeout")})
        }
        this.cells.forEach((cell)=>{
            cell.x -= this.speed;
            let index = this.checkOffScreen(cell)
            if (index){            
                delete this.cells[index]
            }
        }) // move all cells to the left
        if (this.cells.length >= 20){
            this.cells = this.cells.filter(element => element)
        }
        
    }
    setSpeed(speed){
        this.speed=speed
    }
    generateNext(){
        let noise = Math.random()
        if (noise > .8){
            // console.log("spawning ground")
            this.addGround(this.ww)
            return
        }else if (noise > .6){
            // console.log("spawning small obstacle")
            this.addObSmall(this.ww*2)
            return
        }else if (noise > .3){
            // console.log("spawning large obstacle")
            this.addObLarge(this.ww*3)
            return
        }else if (noise > .0){
            // console.log("spawning air platform")
            this.addPlat(this.ww*4)
            return
        }
    }
    checkOffScreen(cell){
        if (cell.x+cell.w < 0){
            let i = this.cells.indexOf(cell)
            return i
        }
        return false
    }
}

class Unit{
    constructor(unitPrototype, spawnX=0, spawnY=0, gridSize=100){
        this.proto = unitPrototype
        this.tex
        this.x = spawnX;
        this.y = spawnY;
        this.vx = 0
        this.vy = 0
        this.fric = .08
        this.gs = gridSize;
        this.health
        this.maxHealth = this.proto.maxHealth
        this.speed = 10
        this.target
        // composite behaviorals
        this.behaviors = []
        this.proto.behaviors.forEach(b=>{
            try{
                let behavior = behaviorRegistry[b]
                let bvr = Object.assign({}, behavior)
                bvr.setup(this)
                this.behaviors.push(bvr)
            } catch {
                console.log("these behaviors suck")
            }
        })
        console.log(this.x, this.y, this.vx, this.vy)
    }
    update(){
        // call behavior update functions
        this.behaviors.forEach((behavior)=>{
            behavior.update()
        })
    }
    getCell(){
        let cell = {
            x: this.x, 
            y: this.y, 
            w: this.gs, 
            h: this.gs,
            z: 0
        }
        return cell
    }
    
}

class UnitManager{
    constructor(grid){
        this.units = []
        this.textures = []
        this.grid = grid
        this.unitPrototypes
        this.addUnit = this.addUnit.bind(this);
        messageBus.on("unitSpawnRequest", this.addUnit)
    }
    
    addUnit(coord){
        let unit = new Unit(player.selectedUnit, coord.x, coord.y, grid.cellWidth)
        this.textures.forEach(tex=>{
            if (tex.name == unit.proto.name)
                unit.tex = tex.texture
        })
        this.units.push(unit)
        //messageBus.off("mouseClick")
        // console.log(this.units)
    }
    remUnit(coord){}
    getUnitsAround(coord, rad){}
    isCellEmpty(coord){}
    updateAll(){
        this.units.update()
    }
    async loadUnitPrototypes(url){
        try{
            let response = await fetch(url)
            let protos = await response.json()
            this.unitPrototypes = protos
            //console.log(this.unitPrototypes)
            return this.unitPrototypes
        } catch {
            console.log("failed to get unit data")
        }
    }
    getUnitPrototype(name){
        let proto = {}
        //console.log(this.unitPrototypes)
        this.unitPrototypes.units.forEach((unit)=>{
            if (unit.name == name){
                proto = unit
            }
        })
        return proto
    }
}

class Player{
    constructor(){
        this.unlockedUnits = []
        this.matchUnits = []
        this.activeUnits = []
        this.selectedUnit = null
        this.gold = 1000 // match currency to place units
        this.diam = 100 // currency to unlock new units
        this.xp = 0 // upgrades units, for both the player and the AI
    }
    
    save(){} // serialize to localStorage
    load(){} // get from localStorage
    unlockUnit(unitPrototype){
        this.unlockedUnits.push(unitPrototype)
        console.log(unitPrototype.name + " unlocked")
    }
    addToMatch(name){
        this.unlockedUnits.forEach(unit => {
            if (this.matchUnits.includes(unit)){
                //console.log(unit.name + " already in lineup")
                return
            }
            if (unit.name == name) {
                this.matchUnits.push(unit)
                //console.log(this.matchUnits)
                console.log(unit.name+" added to lineup")
            }
        })
    }
    selectUnit(unitName){
        this.matchUnits.forEach(unit=>{
            if (unit.name == unitName){
                this.selectedUnit = unit
                messageBus.emit("unitSpawnRequest", {x: 0, y:0})
                console.log(unit.name+" selected")
            }
        })
    }
}

class UI{
    constructor(schema){
        this.buttons = []
        this.text = []

        // Create a container div
        this.container = document.createElement("div")
        this.container.style.position = "absolute"   // <-- MUST have position for z-index to work
        this.container.style.top = "0px"
        this.container.style.left = "0px"
        this.container.style.width = "100%"
        this.container.style.height = "100%"
        this.container.style.zIndex = "1000"        // higher than canvas
        this.container.style.pointerEvents = "auto" // make sure it receives mouse events

        document.body.append(this.container)
    }
    
    addButton(name, signal, x, y, w=100, h=50){
        let button = document.createElement('button');
        button.innerText = name;
        button.style.position = 'absolute';
        button.style.left = `${x}px`;
        button.style.top = `${y}px`;
        button.style.width = `${w}px`;
        button.style.height = `${h}px`;
        button.style.zIndex = "1000";
        button.onmousedown = function(e){
            e.stopPropagation();
            messageBus.emit(signal, true);
        }

        button.onmouseup = function(e){
            e.stopPropagation();
            messageBus.emit(signal, false);
        }

        this.container.appendChild(button);
    }
    addPara(text, x, y, w=100, h=50){
        let el = document.createElement('p');
        el.innerText = text;
        el.style.position = 'absolute';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.zIndex = "1000";

        this.container.appendChild(el);
    }
}