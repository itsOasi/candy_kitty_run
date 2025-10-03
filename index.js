// --------------------------
// Basic p5.js setup
// --------------------------
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let phys = new Physics(1)
let grid = new Grid(canvasWidth, canvasHeight)
let units = new UnitManager(grid)
let player = new Player()
let ui = new UI()

async function setup() {
    let c =createCanvas(canvasWidth, canvasHeight, WEBGL);
    c.style("pointer-events", "none")
    phys.ctx = c
    frameRate(60); // smooth animation
    grid.initWorld(10, 10, 1, 2)
    await units.loadUnitPrototypes("unit_data.json")
    .then(_=>{
        units.unitPrototypes.units.forEach((unit)=>{
            units.textures.push({"name":unit.name, "texture":loadImage(unit.texture)})
        })
    })
    if (!units.unitPrototypes || !units.unitPrototypes.units) {
        console.error("Unit prototypes not loaded!")
        //return
    }
    //units.spawnEnemies()
    //console.log(units.unitPrototypes)
    units.unitPrototypes.units.forEach((unit)=>{
        player.unlockUnit(unit)
        player.addToMatch(unit.name)
    })
    player.selectUnit("Candy")
    
    ui.addButton(">", "rightPressed", canvasWidth*.6, canvasHeight*.3)
    ui.addButton("<", "leftPressed", canvasWidth*.4, canvasHeight*.3)
}

function draw() {
    background(80, 100, 255); // dark gray background
    if (!grid.portraitMode)
        translate(-canvasWidth/4, -canvasHeight/2)
    else
        translate(-canvasWidth/2, -canvasHeight/4)
    // TODO: Draw grid, units, and animations here
    // update game state
    let world = []    
    grid.cells.forEach((cell)=>{
        let vector = {x: cell.x, y: cell.y, w: cell.w, h: cell.h, isStatic:true, ref: cell}
        world.push(vector)
    })
    units.units.forEach((unit)=>{
        unit.update()
        let vector = {x: unit.x, y: unit.y, w: unit.gs, h: unit.gs, isStatic:false, ref: unit}
        //console.log(vector.x, vector.y)
        world.push(vector)
    })
    phys.update(world)
        
    grid.update()
    // render output
    // console.log(JSON.stringify(units.units))
    grid.cells.forEach((cell)=>{
        debugCell(cell) // replace with draw sprite
    })
    units.units.forEach((unit)=>{
        drawSprite(unit.getCell(), unit.tex)
    })
}

function debugCell(cell){
    push()
        // console.log(cell)
        fill(cell.r, cell.g, cell.b)
        noStroke()
        rect(cell.x, cell.y, cell.w, cell.h)
    pop()
}

function drawSprite(cell, tex, sel){
    push()
        // console.log(JSON.stringify(cell))
        texture(tex)
        noStroke()
        if(sel)
            stroke(255)
        rect(cell.x, cell.y, cell.w, cell.h)
    pop()
}

// Responsive canvas
function windowResized() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    resizeCanvas(canvasWidth, canvasHeight);
}

// --------------------------
// Optional: Mouse interactions
// --------------------------
