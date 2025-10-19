// --------------------------
// Basic p5.js setup
// --------------------------
let canvasWidth = window.innerWidth;
let canvasHeight = (canvasWidth/16)*9;
let phys = new Physics(1)
let grid = new Grid(canvasWidth, canvasHeight)
let units = new UnitManager(grid, phys)
let player = new Player(units)
let ai = new AI(units, player)
let ui = new UI("inGame")
//let menuUI = new UI("mainMenu")
//let settingsUI = new UI("settings")
let inGame = false

let gameSpeed = 1

let probabilityMatrix = {
    ground: .8,
    small: .6,
    large: .2,
    platform: .4
}

function preload(){
    messageBus.on("startGame", function(){console.log("hi");startGame})
    messageBus.on("quitGame", function(){console.log("bye");endGame})
}

async function setup() {
    let c = createCanvas(canvasWidth, canvasHeight, WEBGL);
    c.style("pointer-events", "none")
    phys.ctx = c
    frameRate(60); // smooth animation
    await grid.loadCellPrototypes("cell_data.json")
    grid.initWorld()
    await units.loadUnitPrototypes("unit_data.json")
    
    // if (!units.unitPrototypes || !units.unitPrototypes.units) {
    //     console.error("Unit prototypes not loaded!")
    //     //return
    // }
    // //units.spawnEnemies()
    // //console.log(units.unitPrototypes)
    ui.addScreen("main_menu", function(){
        ui.addButton("start", startGame, canvasWidth*.5, canvasHeight*.5)
    })
    ui.addScreen("in_game", function(){
        ui.addButton(">", function (state) {
            messageBus.emit("rightPressed", state)
        }, canvasWidth*.3, canvasHeight*.7)
        ui.addButton("<", function (state) {
            messageBus.emit("leftPressed", state)
        }, canvasWidth*.1, canvasHeight*.7)
        ui.addButton("^", function (state) {
            messageBus.emit("jumpPressed", state)
        }, canvasWidth*.7, canvasHeight*.6)
        ui.addButton("X", endGame, canvasWidth*.85, canvasHeight*.1, 50, 50)
    })
    endGame()
}



function draw() {
    background(80, 100, 255); // dark gray background
    if (!grid.portraitMode)
        translate(-canvasWidth/4, -canvasHeight/2)
    else
        translate(-canvasWidth/2, -canvasHeight/4)
    
    // TODO: Draw grid, units, and animations here
    // update game state
    if (inGame){
        let world = []    
        grid.cells.forEach((cell)=>{
            world.push(cell.getCell())
        })
        units.units.forEach((unit)=>{
            /*if (unit.x + unit.gs < 0 || unit.y + unit.gs < 0)
                endGame()*/
            console.log(unit.proto.name, unit.onGround)
            unit.update(world)
            if (unit.onGround)
                unit.x += -gameSpeed
            let vector = {x: unit.x, y: unit.y, w: unit.gs, h: unit.gs, isStatic:false, ref: unit}
            //console.log(vector.x, vector.y)
            world.push(vector)
        })
        ai.update()
        phys.update(world)
        grid.setSpeed(gameSpeed)
        grid.update({probabilityMatrix: probabilityMatrix, speed: gameSpeed})
    }
    // render output
    // console.log(JSON.stringify(units.units))
    grid.cells.forEach((cell)=>{
        debugCell(cell.getSprite())
    })
    units.units.forEach((unit)=>{
        drawSprite(unit.getSprite())
    })
    
    // ui.updateText("debug", "hi")
}

function startGame(e){
    if (!e) return
    //console.log("starting game")
    ui.showScreen("in_game")
    //console.log(coord)    
    // player.selectUnit("Candy")
 
    
    grid.setSpeed(1)
    inGame = true
}

function endGame(){
    //console.log("stopping game")
    grid.clear()
    units.clear()
    player.selectUnit("Candy")
    grid.initWorld()
    ui.showScreen("main_menu")
    grid.setSpeed(0)
    inGame = false
}

function debugCell(cell){
    push()
        // console.log(cell)
        fill(cell.r, cell.g, cell.b)
        noStroke()
        rect(cell.x, cell.y, cell.w, cell.h)
    pop()
}

function drawSprite(sprite){
    push()
        // console.log(JSON.stringify(cell))
        texture(sprite.tex)
        noStroke()
        if(sprite.sel)
            stroke(255)
        rect(sprite.x, sprite.y, sprite.w, sprite.h)
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
