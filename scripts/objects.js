
class Cell{
    constructor(cellPrototype, pos={x:0, y:0}, gs){
        this.proto = cellPrototype
        this.pos = pos // relative to screen
        this.size = this.proto.data.size // relative to grid units
        this.gs = gs
        this.color = this.proto.data.color
        this.tex = this.proto.tex
        this.behaviors = []
        this.data = this.proto.data
        this.proto.behaviors.forEach(b=>{
            try{
                let behavior = behaviorRegistry[b]
                let bvr = Object.assign({}, behavior)
                bvr.setup(this)
                this.behaviors.push(bvr)
            } catch (e) {
                console.log("these behaviors suck", e)
            }
        })
    }

    update(data){
        // call behavior update functions
        this.behaviors.forEach((behavior)=>{
        if (behavior.update)
            behavior.update(data)
        })
    }
    getSprite(){
        let sprite = {
            x: this.pos.x,
            y: this.pos.y,
            w: this.size.w * this.gs,
            h: this.size.h * this.gs,
            r: this.color.r,
            g: this.color.g,
            b: this.color.b,
            tex: this.tex
        }
        return sprite
    }
    getCell(){
        let cell = {
            x: this.pos.x,
            y: this.pos.y,
            w: this.size.w * this.gs,
            h: this.size.h * this.gs,
            isStatic: true,
            ref: this
        }
        //console.log(cell)
        return cell
    }
}

class Grid {
    constructor(canvasWidth, canvasHeight, cellPrototypes) {
        this.ww = canvasWidth
        this.wh = canvasHeight
        this.cells = []
        this.cellWidth = this.ww*.1
        this.grndLvl = this.wh*.5
        this.speed = 1
        this.portraitMode = this.wh > this.ww ? true : false
        this.cellPrototypes = cellPrototypes
        this.textures = {}
        this.buildOk = true
        messageBus.on("buildTimeout", _=>{this.buildOk = true})
        // load ground textures
    }
    loadTextures(){} // load from prototypes
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
    addCell(proto, pos){
        let cell = new Cell(proto, pos, this.cellWidth)
        //console.log(cell)
        this.cells.push(cell)
    }
    addCellPrototype(proto, pos){
        let cell = new Cell(proto, pos, this.cellWidth)
        this.cells.push(cell)
    }
    addGround(x){
        let proto = this.getCellPrototype("ground")
        this.addCell(proto, {x:x, y:this.wh*.5})
    }
    addObSmall(x){
        let proto = this.getCellPrototype("obSmall")
        this.addCell(proto, {x:x, y:(this.grndLvl)-this.cellWidth*3})
    } // fire hydrant, bush
    addObLarge(x){
        let proto = this.getCellPrototype("obLarge")
        this.addCell(proto, {x:x, y:(this.grndLvl)-this.cellWidth*4})
    } // foreground tree, truck, brick building
    addPlat(x){
        let proto = this.getCellPrototype("platform")
        this.addCell(proto, {x:x, y:(this.grndLvl)-this.cellWidth*6})
    } // tree limb, roof, construction platform
    initWorld(){
        this.addGround(0)
        //this.addObLarge(this.ww*1.5)
        //this.addObSmall(this.ww*.5)
        this.addPlat(this.ww*2)
        console.log(this.cells)
    }
    update(data){
        if (this.cells.length < 20 && this.buildOk){
            this.buildOk = false
            this.generateNext(data.probabilityMatrix)
            startTimer(1, ()=>{messageBus.emit("buildTimeout")})
        }
        this.cells.forEach((cell)=>{ // move all cells to the left
            let index = this.checkOffScreen(cell)
            if (index){            
                delete this.cells[index]
            } else {
                cell.update(data)
            }
        }) 
        if (this.cells.length >= 20){
            this.cells = this.cells.filter(element => element)
        }
        
    }
    clear(){
        this.cells = []
    }
    setSpeed(speed){
        this.speed=speed
    }
    generateNext(probabilityMatrix){
        let pm = probabilityMatrix
        let groundProb = Math.random()
        let smallProb = Math.random()
        let largeProb = Math.random()
        let platProb = Math.random()
        if (groundProb <= pm.ground)
            this.addGround(this.ww)
            
        if (smallProb <= pm.small)
            this.addObSmall(this.ww*2)
      
        if (largeProb <= pm.large)
            this.addObLarge(this.ww*3)
            
        if (platProb <= pm.platform)
            this.addPlat(this.ww*4)
            
    }
    checkOffScreen(cell){
        if (cell.x+cell.w < 0){
            let i = this.cells.indexOf(cell)
            return i
        }
        return false
    }
    async loadCellPrototypes(url){
        try{
            let response = await fetch(url)
            //console.log(JSON.stringify(response))
            let protos = await response.json()
            this.cellPrototypes = protos.cells
            return this.cellPrototypes
        } catch (e) {
            console.error("failed to get cell data", e.message)
        }
    }
    getCellPrototype(name){
        let proto = {}
        // console.log(this.cellPrototypes)
        this.cellPrototypes.forEach((cell)=>{
            if (cell.name == name){
                proto = cell
            }
        })
        return proto
    }
}

class Unit{
    constructor(unitPrototype, spawnX=0, spawnY=0, gridSize=100){
        this.proto = unitPrototype
        /*if (this.proto)
        console.log(JSON.stringify(this.proto))        
       */ this.tex
        this.x = spawnX;
        this.y = spawnY;
        this.vx = 0
        this.vy = 0
        this.fric = .06
        this.gs = gridSize;
        this.health
        this.maxHealth = 100
        this.maxJumps = 3
        this.speed = 1
        this.jumpStr = 20
        this.onGround = false
        this.target = null
        // composite behaviorals
        //if (this.proto)
        // console.log(JSON.stringify(this.proto))
        this.data = this.proto.data
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
        //console.log(this.x, this.y, this.vx, this.vy)
    }
    update(world){
        // call behavior update functions
        this.behaviors.forEach((behavior)=>{
            if (behavior.update)
                behavior.update(world)
        })
    }
    getSprite(){
        let sprite = {
            x: this.x, 
            y: this.y, 
            w: this.gs, 
            h: this.gs,
            tex: this.tex
        }
        return sprite
    }    
    getCell(){
        let sprite = {
            x: this.x, 
            y: this.y, 
            w: this.gs, 
            h: this.gs,
            ref: this
        }
        return sprite
    }    
    setTarget(target){
        this.target = target
    }    
}

class UnitManager{
    constructor(grid, phys){
        this.units = []
        this.textures = []
        this.grid = grid
        this.unitPrototypes
        this.addUnit = this.addUnit.bind(this);
        this.phys = phys
    }
    
    addUnit(unit, coord){
        // console.log(coord)
        let u = new Unit(unit, coord.x, coord.y, grid.cellWidth)
        this.textures.forEach(tex=>{
            if (tex.name == u.proto.name)
                u.tex = tex.texture
        })
        u.data.phys = this.phys
        this.units.push(u)
        //console.log(coord.ref.activeUnits)
        // coord.ref.activeUnits.push(u)
        //messageBus.off("mouseClick")
        console.log(this.units)
        return u
    }
    remUnit(coord){}
    clear(){
        this.units = []
    }
    getUnitsAround(coord, rad){}
    updateAll(){
        this.units.update()
    }
    async loadUnitPrototypes(url){
        try{
            let response = await fetch(url)
            // console.log(JSON.stringify(response))
            let protos = await response.json()
            this.unitPrototypes = protos.units
            units.unitPrototypes.forEach((unit)=>{
                units.textures.push({"name":unit.name, "texture":loadImage(unit.texture)})
            })
        } catch (e) {
            console.error("failed to get unit data", e.message)
        }
    }
    getUnitPrototype(name){
        let proto = {}
        console.log(this.unitPrototypes)
        this.unitPrototypes.forEach((unit)=>{
            if (unit.name == name){
                proto = unit
            }
        })
        return proto
    }
}

class Player{
    constructor(unitManager){
        this.activeUnits = []
        this.selectedUnit = null
        this.unitManager = unitManager
        this.data = {}
        this.gold = 1000 // match currency to place units
        this.diam = 100 // currency to unlock new units
        this.xp = 0 // upgrades units, for both the player and the AI
    }
    
    save(){} // serialize to localStorage
    load(){} // get from localStorage
    unlockUnit(unitPrototype){
        this.unlockedUnits.push(unitPrototype)
        //console.log(unitPrototype.name + " unlocked")
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
                //console.log(unit.name+" added to lineup")
            }
        })
    }
    selectUnit(unitName){
        console.log("selecting", unitName)
        let proto = this.unitManager.getUnitPrototype(unitName)
        let plyrSpawn = {x:0, y:0}
        let unit = this.unitManager.addUnit(proto, plyrSpawn)
        this.activeUnits.push(unit)
    }
}

class AI{
    constructor(unitManager, player){
        this.activeUnits = []
        this.selectedUnit = null
        this.player = player
        this.unitManager = unitManager
        
        this.gold = 1000 // match currency to place units
        this.diam = 100 // currency to unlock new units
        this.xp = 0 // upgrades units, for both the player and the AI
        this.selectUnit = this.selectUnit.bind(this)
        messageBus.on("aiSpawnRequest", this.selectUnit)
    }
    
    save(){} // serialize to localStorage
    load(){} // get from localStorage
    unlockUnit(unitPrototype){
        this.unlockedUnits.push(unitPrototype)
        //console.log(unitPrototype.name + " unlocked")
    }
    addToMatch(name){
        this.unlockedUnits.forEach(unit => {
            if (this.matchUnits.includes(unit)){
                //console.log(unit.name + " already in lineup")
                return
            }
            if (unit.name == name) {
                this.matchUnits.push(unit)
                console.log("ai match units", this.matchUnits)
                //console.log(unit.name+" added to lineup")
            }
        })
    }
    selectUnit(data){
        console.log("spawning", data.unit)
        let unit = this.unitManager.addUnit(this.unitManager.getUnitPrototype(data.unit), data.coord)
        this.activeUnits.push(unit)
    }
    update(){
        this.activeUnits.forEach(unit=>{
            let plyrUnit = this.player.activeUnits[0]
            if (plyrUnit.x < unit.x) unit.data.cmd = "left"
            if (plyrUnit.x > unit.x) unit.data.cmd = "right"
        })
    }
}

class Button{
    constructor(name, callback, x=0, y=0, w=100, h=50, container){
        this.button = document.createElement('button');
        this.button.innerText = name;
        this.button.style.position = 'absolute';
        this.button.style.left = `${x}px`;
        this.button.style.top = `${y}px`;
        this.button.style.width = `${w}px`;
        this.button.style.height = `${h}px`;
        this.button.style.zIndex = "1000";
        this.callback = callback
        //console.log(this.callback)
        this.keybind = null
        this.container = container

        this.pressed = this.pressed.bind(this)
        this.released = this.released.bind(this)
        this.button.addEventListener("mousedown", this.pressed)
        this.button.addEventListener("touchstart", this.pressed)
        this.button.addEventListener("mouseup", this.released)
        this.button.addEventListener("touchend", this.released)

        this.bindPressed = this.bindPressed.bind(this)
        this.bindReleased = this.bindReleased.bind(this)
        this.container.addEventListener("keydown", this.bindPressed)
        this.container.addEventListener("keyup", this.bindReleased)

        this.container.appendChild(this.button);
    }
    pressed(e){
        //console.log(this.callback)
        e.stopPropagation();
        this.callback(true)
        // console.log("pressed")
        //messageBus.emit(signal, true);
    }
    released(e){
        //console.log(this.callback)
        e.stopPropagation();
        this.callback(false)
        //messageBus.emit(signal, false);
    }
    bindPressed(e){
        if (!this.keybind)
            return
        console.log("pressing", e.key)
        e.stopPropagation()
        if (e.key == this.keybind){}
    }
    bindReleased(e){
        if (!this.keybind)
            return
        console.log("released", e.key)
        e.stopPropagation()
        if (e.key == this.keybind){}
    }
    bindKey(key){
        this.keybind = key
    }
}

class UI{
    constructor(id, schema){
        // Create a container div
        this.container = document.createElement("div")
        this.container.id = id
        this.container.style.position = "absolute"   // <-- MUST have position for z-index to work
        this.container.style.top = "0px"
        this.container.style.left = "0px"
        this.container.style.width = "100%"
        this.container.style.height = "100%"
        this.container.style.zIndex = "1000"        // higher than canvas
        this.container.style.pointerEvents = "auto" // make sure it receives mouse events
        this.screens = {}
        this.buttons = {}
        document.body.append(this.container)
    }
    getButton(name){
        if (this.buttons[name])
            return this.buttons[name]
    }
    addButton(name, callback, x=0, y=0, w=100, h=50){
        console.log(callback)
        let button = new Button(name, callback, x, y, w, h, this.container)
        this.buttons[name] =  button
    }
    addPara(id, text, x, y, w=100, h=50){
        let el = document.createElement('p');
        el.id = id;
        el.innerText = text;
        el.style.position = 'absolute';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.zIndex = "1000";

        this.container.appendChild(el);
    }
    updateText(id, text, x, y){
        let el = document.getElementById(id)
        el.innerText = text
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    }
    addScreen(name, buildFunc){
        this.screens[name] = buildFunc
    }
    showScreen(name){
        this.clear()
        this.screens[name]()
    }
    clear(){
        this.container.innerHTML = ""
    }
}
