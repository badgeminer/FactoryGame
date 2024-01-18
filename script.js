const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const wctx = new Wctx(ctx)
canvas.width = window.innerWidth - 3;
canvas.height = window.innerHeight - 2.5;
ctx.imageSmoothingEnabled = false;
assets["rubble"] = document.getElementById('rubble')
assets["derelict"] = document.getElementById('derelict')

var money = 5000
var ui = []
var grid = []

ctx.font = "12px monospace";

const colorize = (col) => { ctx.fillStyle = colors[col]; }

var tileDirection = 1
var tileType = "Conveyor"

var cursorMode = 0
/*
0: place
1: copy P1
2: copy P2
*/

var tileList = [
    "Repair"
]
var mouse = { x: 0, y: 0, tx: 0, ty: 0, t: null, d: false }

var TileRegistry = new Registry((id, c, a) => {
    tileList.push(id)
})

function createTile(place, tileType, x, y) {
    var c = TileRegistry.aquire(tileType)
    if (!c) {
        switch (tileType) {
            case "Repair":
                if (place) {
                    grid[x][y].hp = clamp(grid[x][y].hp + 10, grid[x][y].mhp, 0);
                } else {
                    return new UIdrawable(x, y, "Wrench")
                }
                break;
            default:
                return new buggedTile(x, y, 1)
        }; return
    } else {
        return new c(x, y)
    }
}
function place(x, y) {
    var t = createTile(true, tileType, x, y)
    if (t) {
        grid[x][y] = t
        t.placed()
    }
    mouse.t = grid[x][y]
}




class drawable {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    render() {
        this.draw(this.x * tileSz, this.y * tileSz)
    }
    draw(x, y) {
        ctx.fillStyle = "black";
        ctx.fillRect(x, y, tileSz, tileSz);
        wctx.fillText('text', `HOW?`, (x), (y) + 16, tileSz)
    }
}
class UIdrawable extends drawable {
    constructor(x, y, img) {
        super(x, y)
        this.img = assets[img]
    }
    draw(x, y) {
        ctx.drawImage(this.img, x, y, tileSz, tileSz)
    }
}
class inventory {
    constructor(amount) {
        this.a = amount
        this.items = []
        this.protected = []
        this.list = []
    }
    alowed(itm) {
        return !this.list.includes(itm)
    }
    restrict(itms) {
        for (i of itms) { this.list.push(i) }
    }
    notFull() {
        return !(this.items.length + this.protected.length >= this.a)
    }
    length() {
        return this.items.length + this.protected.length
    }
    canPush(i) {
        if (!this.alowed(i)) { 
            console.log('bock')
            return false
        }
        return !(this.items.length + this.protected.length >= this.a)
    }
    addItem(item) {
        if (this.items.length + this.protected.length >= this.a) { return false }
        if (item == null) { return false }
        this.protected.push(item)
    }
    nextItem() {
        if (this.items.length >= 1) {
            return this.items[0]
        }
        return null
    }
    nextItemForce() {
        if (this.items.length >0) {
            return this.items[0]
        } else if (this.protected.length >0) {
            return this.protected[0]
        }
        return null
    }
    sendNextItem() {
        if (this.items.length >= 1) {
            return this.items.shift()
        }
        return null
    }
    sendNextOfItem(itm) {
        if (this.items.length >= 1) {
            for (var i in this.items) {
                if (this.items[i] == itm) {
                    return this.items.splice(i, 1)
                }
            }
        }
        return false
    }

    hasItem(itm) {
        for (var i in this.items) {
            if (this.items[i] == itm) {
                return true
            }
        }
        return false
    }
    tick() {
        for (var _ of this.protected) {
            this.items.push(this.protected.shift())
        }
    }
}
class restrictedInventory extends inventory {
    constructor(amt, r) {
        super(amt)
        this.list = r
    }
    alowed(itm) { return Boolean(this.list.includes(itm)) }
}
class MultiInventory {
    constructor(amt, r) {
        this.invs = {}
        this.INVS = []
        for (i of r) {
            var I = new restrictedInventory(amt, [i, "TeSt"])
            this.invs[i] = I
            this.INVS.push(I)
        }
    }
    aquire(i) {
        if (this.invs[i]) {
            return (this.invs[i])
        }
    }
    tick() {
        for (i of this.INVS) {
            i.tick()
        }
    }
    hasItem(i) {
        if (this.invs[i]) {
            return (this.invs[i].hasItem(i))
        }
    }
    sendNextOfItem(i) {
        return this.invs[i].sendNextOfItem(i)
    }
}
function aquireInv(tInv, i) {
    if (tInv instanceof MultiInventory) {
        return tInv.aquire(i)
    } else {
        return tInv
    }
}

class tile extends drawable {
    resip = {}
    Inventory = null
    InputInventory = null
    FluidInventory = null
    outDir = 0

    direction = null
    cost = 0
    constructor(x, y, hp) {
        super(x, y)

        this.hp = hp
        this.mhp = hp

    }
    placed() {
        money -= this.cost
    }
    draw(x, y) {
        ctx.fillStyle = "grey";
        ctx.fillRect(x, y, tileSz, tileSz)
    }
    tick() {
        if (this.hp < 0 && this instanceof FactoryTile) {
            grid[this.x][this.y] = new derelictTile(this.x, this.y, this)
        }
    }
    surounding() {
        var tilez = []
        for (let i = 0; i < 4; i++) {
            var [x, y] = directionCoord(i);
            x = this.x + x;
            y = this.y + y;
            if ((x > 50) || (x < 0) || (y > 50) || (y < 0)) {
                
            } else {
                var t = grid[x][y];
                tilez.push(t);
            };
        }
        return tilez;
    }
    outputTo(t) {
        return !(t == this.nextInLine())
    }
    checkOutput() {
        var s = this.surounding()
        this.outDir = (this.outDir + 1) % s.length
        if (this.outDir == this.sout) {
            this.outDir = (this.outDir + 1) % s.length
            return null
        }

        var t = null

        if (s.length > 0) {
            var T = s[this.outDir]
            if (T instanceof FactoryTile) {
                t = T
            } else {
                t = this.checkOutput()
            }

        }
        return t
    }
    nextOutput() {
        this.sout = this.outDir
        return this.checkOutput()
    }
    nextInLine() {
        var [x, y] = directionCoord(this.direction)
        x = this.x + x
        y = this.y + y
        if ((x > 50) || (x < 0) || (y > 50) || (y < 0)) {
            return null
        }
        var row = grid[x]
        return row[y]
    }
}
class derelictTile extends tile {
    constructor(x, y, old) {
        super(x, y, 0);
        this.old = old
    }
    draw(x, y) {
        this.old.draw(x, y)
        ctx.fillStyle = "rgba(10,10,10,0.5)";
        ctx.fillRect(x, y, tileSz, tileSz);
        ctx.globalCompositeOperation = "color"
        ctx.drawImage(assets["rubble"], x, y, tileSz, tileSz)
        ctx.drawImage(assets["derelict"], x, y, tileSz, tileSz)
        ctx.globalCompositeOperation = "source-over"
    }
}
class buggedTile extends tile {
    draw(x, y) {
        ctx.fillStyle = "black";
        ctx.fillRect(x, y, tileSz, tileSz)
        wctx.fillText(`?! ?!`, (x), (y) + 16, tileSz)
    }
}
class FactoryTile extends tile {
    constructor(x, y, isz, i, hp) {
        super(x, y, hp);
        if (!i) {
            this.Inventory = new inventory(isz)
        } else {
            this.Inventory = i
        }
    }
    draw(x, y) {
        ctx.fillStyle = "blue";
        ctx.fillRect(x, y, tileSz, tileSz)
        wctx.fillText(`${this.x},${this.y}`, (this.x * tileSz), (this.y * tileSz) + 16)
    }
    tick() {
        super.tick()
        this.Inventory.tick()
    }
}
class TransportTile extends FactoryTile {

    constructor(x, y, s, hp) {
        super(x, y, s, false, hp);
        this.direction = tileDirection
        this.arrow = tileDirz[this.direction]
    }

    send() {
        var ni = this.Inventory.nextItem()
        var next = this.nextInLine()
        if (ni) {
            if (next instanceof FactoryTile) {
                var inv = null
                if (next instanceof ProductionTile) {
                    inv = aquireInv(next.InputInventory, ni)
                } else {
                    inv = aquireInv(next.Inventory, ni)
                }
                if (inv) {
                    if (inv.canPush(ni)) {
                        inv.addItem(this.Inventory.sendNextItem())
                    }
                }
            }
        }
    }
    tick() {
        this.send()
        super.tick()

    }
}
class ProductionTile extends TransportTile {
    constructor(x, y, isz, oisz, requirements, cooldown, hp, deteriorate) {
        super(x, y, oisz, hp)
        this.requirements = requirements
        this.cooldown = cooldown
        this.timer = cooldown
        this.deteriorate = deteriorate
        this.InputInventory = new MultiInventory(isz, requirements)

    }
    process() { }
    send() {
        var tils = this.surounding()
        var ni = this.Inventory.nextItem()
        var next = tils[randomInt(0, tils.length) - 1]
        if (ni) {
            if (next instanceof FactoryTile) {
                if (next.outputTo(this)) {
                    var inv = null
                    if (next instanceof ProductionTile) {
                        inv = aquireInv(next.InputInventory, ni)
                    } else {
                        inv = aquireInv(next.Inventory, ni)
                    }
                    if (inv) {
                        if (inv.canPush(ni)) {
                            inv.addItem(this.Inventory.sendNextItem())
                        }
                    }
                }
            }
        }
    }
    tick() {
        super.tick()
        this.InputInventory.tick()

        for (var i of this.requirements) {
            if (!this.InputInventory.hasItem(i)) { return }
        }

        if (this.Inventory.notFull()) {
            if (this.timer > 0) {
                this.timer--
            } else {
                this.process()
                this.hp -= this.deteriorate
                this.timer = this.cooldown
            }
        }
    }
}
class Chipsetter extends ProductionTile {
    rend = (new renderer(ctx)).add(new renderer_image('Chipsetter', 0, 0, false)).add(new renderer_item_output(0, 0, false))
    cost = 1000
    constructor(x, y, i, In) {
        super(x, y, 10, 2, [
            "PrintedCircuitBoard",
            In
        ], 2, 10, 0.01);
        this.outputItem = i
    }
    draw(x, y) {
        //wctx.fillRect("Chipsetter",x, y, tileSz, tileSz)
        //wctx.fillText(`${this.arrow} ${this.timer}`, (x), (y) + 16, tileSz)
        //wctx.fillText(` ${this.outputItem}`, (x), (y) + 30, tileSz)
        this.rend.draw(x, y, (this.direction - 1) * 90, this)
    }
    process() {
        for (i of this.requirements) {
            this.InputInventory.sendNextOfItem(i)
        }
        this.Inventory.addItem(this.outputItem)
    }
}
function baseMaterialsEtch(i) {
    switch (i) {
        case "Si":
            return [
                "Si",
                'Si Wafer'
            ]
        case "PCB":
            return [
                "CircuitBoard",
                "Copper"
            ]
        default:
            return [
                'ERROR',
                "R"
            ]
    }
}
class Etcher extends ProductionTile {
    rend = (new renderer(ctx)).add(new renderer_image('Etcher', 0, 0, false)).add(new renderer_item_output(0, 0, false))
    cost = 1000
    constructor(x, y, i, t) {
        super(x, y, 10, 2, baseMaterialsEtch(t), 2, 10, 0.01);
        this.outputItem = i
    }
    draw(x, y) {
        //wctx.fillRect("Chipsetter",x, y, tileSz, tileSz)
        //wctx.fillText(`${this.arrow} ${this.timer}`, (x), (y) + 16, tileSz)
        //wctx.fillText(` ${this.outputItem}`, (x), (y) + 30, tileSz)
        this.rend.draw(x, y, (this.direction - 1) * 90, this)
    }
    process() {
        for (i of this.requirements) {
            this.InputInventory.sendNextOfItem(i)
        }
        this.Inventory.addItem(this.outputItem)
    }
}

var Recips = {
    "Quary": { i: [], o: 'Sand' },
    "SiliconSmelter": { i: ["Sand"], o: 'Si' },
    "Waferizer": { i: ['Si'], o: 'Si Wafer' },
    "CPU_Chipsetter": { i: ['CPU_Die',"PrintedCircuitBoard"], o: 'CPU0' },
    "RAM_Chipsetter": { i: ['Microchip0',"PrintedCircuitBoard"], o: 'Memory0' },
    "CPU_Etcher": { i: baseMaterialsEtch('Si'), o: 'CPU_Die' },
    "RAM_Etcher": { i: baseMaterialsEtch('Si'), o: 'Microchip0' },
    "PCB_Etcher": { i:baseMaterialsEtch('PCB'), o: 'PrintedCircuitBoard' },
    "PCB_Maker": { i: [], o: 'CircuitBoard' },
    "Sifter": {i: ["Sand"],o:"Copper"}
}

function drawResp() {
    var r = Recips[tileType]
    if (r) {
        var x = 5
        var y = canvas.height - (menu.h+45)
        wctx.fillRect("Menu", 0, canvas.height - (menu.h+50), 200, 50)
        if (r.i.length > 0) {
            for (i of r.i) {
                ctx.drawImage(assets[i]||assets["placeholder"],x,y,tileSz,tileSz)
                x += tileSz + 5
        }}
        ctx.drawImage(assets["duct"],x,y,tileSz,tileSz)
        x += 30+tileSz
        ctx.drawImage(assets[r.o]||assets["placeholder"],x,y,tileSz,tileSz)
    }
}

TileRegistry.register(
    class emptyTile extends tile {

    })
TileRegistry.register(
    class Conveyor extends TransportTile {
        rend = (new renderer(ctx)).add(new renderer_image('duct', 0, 0, true)).add(new renderer_item_nxt(0, 0, true))
        cost = 25
        constructor(x, y) {
            super(x, y, 1, 10);
        }
        draw(x, y) {
            //wctx.fillRect("belt",x, y, tileSz, tileSz)
            //wctx.fillText(`${this.arrow},${this.Inventory.nextItem()}`, (x), (y) + 16, tileSz)
            this.rend.draw(x, y, (this.direction - 1) * 90, this)
        }

    })
TileRegistry.register(
    class Container extends TransportTile {
        rend = (new renderer(ctx)).add(new renderer_image('container', 0, 0, false))
        cost = 150
        constructor(x, y) {
            super(x, y, 20, 30);
        }
        draw(x, y) {
            //wctx.fillRect("steel",x, y, tileSz, tileSz)
            //wctx.fillText(`${this.arrow}`, (x), (y) + 16, tileSz)
            this.rend.draw(x, y, (this.direction - 1) * 90, this)
        }

    })
TileRegistry.register(
    class Vault extends TransportTile {
        rend = (new renderer(ctx)).add(new renderer_image('vault', 0, 0, false))
        cost = 300
        constructor(x, y) {
            super(x, y, 40, 60);
        }
        draw(x, y) {
            //wctx.fillRect("titanium",x, y, tileSz, tileSz)
            //wctx.fillText(`${this.arrow}`, (x), (y) + 16, tileSz)
            this.rend.draw(x, y, (this.direction - 1) * 90, this)
        }

    })
TileRegistry.register(
    class ExportBay extends TransportTile {
        cost = 200
        rend = (new renderer(ctx)).add(new renderer_image('exportBay', 0, 0, false))
        constructor(x, y) {
            super(x, y, 20, 35);
        }
        draw(x, y) {
            //wctx.fillRect("export",x, y, tileSz, tileSz)
            //wctx.fillText(`${this.arrow}`, (x), (y) + 16, tileSz)
            this.rend.draw(x, y, (this.direction - 1) * 90, this)
        }
        tick() {
            super.tick()
            var itms = this.Inventory.length()
            //console.log(itms)
            for (i = 0; i < itms; i++) {
                var I = this.Inventory.sendNextItem()
                var p = prices[I]
                if (isNaN(p)) {
                    p = 0
                }
                money += p
                //console.log(I)
            }
        }

    })
TileRegistry.register(
    class Quary extends ProductionTile {
        rend = (new renderer(ctx)).add(new renderer_image('quary', 0, 0, false)).add(new renderer_image('quary-drill', 5, 0, false))
        cost = 350
        constructor(x, y) {
            super(x, y, 0, 5, [], 2, 50, 0.1);
        }
        draw(x, y) {
            //wctx.fillRect("quary",x, y, tileSz, tileSz)
            //wctx.fillText(`${this.arrow}${this.timer}`, (x), (y) + 16, tileSz)
            this.rend.draw(x, y, (this.direction - 1) * 90, this)
        }
        process() {
            this.Inventory.addItem('Sand')
            if (Math.random() >= 0.5) {
                this.Inventory.addItem('Sand')
            }
        }
        tick() {
            super.tick()
        }
    })



TileRegistry.register(
class AdvancedQuary extends ProductionTile {
    rend = (new renderer(ctx)).add(new renderer_image('quary', 0, 0, false)).add(new renderer_image('adv-quary-drill', 10, 0, false))
    cost = 2500
    constructor(x, y) {
        super(x, y, 0, 5, [], 1, 50, 0.075);
    }
    draw(x, y) {
        //wctx.fillRect("quary",x, y, tileSz, tileSz)
        //wctx.fillText(`${this.arrow}${this.timer}`, (x), (y) + 16, tileSz)
        this.rend.draw(x, y, (this.direction - 1) * 90, this)
    }
    process() {
        this.Inventory.addItem('Sand')
        if (Math.random() >= 0.25) {
            this.Inventory.addItem('Sand')
        }
    }
    tick() {
        super.tick()
    }
})
TileRegistry.register(
class Sifter extends ProductionTile {
    rend = (new renderer(ctx)).add(new renderer_image('Sifter', 0, 0, false))
    cost = 350
    constructor(x, y) {
        super(x, y, 2, 5, ["Sand"], 2, 50, 0.01);
    }
    draw(x, y) {
        //wctx.fillRect("quary",x, y, tileSz, tileSz)
        //wctx.fillText(`${this.arrow}${this.timer}`, (x), (y) + 16, tileSz)
        this.rend.draw(x, y, (this.direction - 1) * 90, this)
    }
    process() {
        var sand = this.InputInventory.sendNextOfItem('Sand')
        this.Inventory.addItem('Copper')
    }
    tick() {
        super.tick()
    }
})
TileRegistry.register(
    class SiliconSmelter extends ProductionTile {
        rend = (new renderer(ctx)).add(new renderer_image('SiliconSmelter', 0, 0, false))
        cost = 450
        constructor(x, y) {
            super(x, y, 2, 2, [
                "Sand",
            ], 2, 60, 0.05);

        }
        draw(x, y) {
            //wctx.fillRect("sismlt",x, y, tileSz, tileSz)
            //wctx.fillText(`${this.arrow}${this.timer}`, (x), (y) + 16, tileSz)
            this.rend.draw(x, y, (this.direction - 1) * 90, this)
        }
        process() {
            var sand = this.InputInventory.sendNextOfItem('Sand')
            this.Inventory.addItem('Si')
        }
    })
TileRegistry.register(
    class Waferizer extends ProductionTile {
        rend = (new renderer(ctx)).add(new renderer_image('Waferizer', 0, 0, false))
        cost = 750
        constructor(x, y) {
            super(x, y, 2, 2, [
                "Si",
            ], 2, 10, 0.025);

        }
        draw(x, y) {
            //wctx.fillRect("waferizer",x, y, tileSz, tileSz)
            //wctx.fillText(`${this.arrow}${this.timer}`, (x), (y) + 16, tileSz)
            this.rend.draw(x, y, (this.direction - 1) * 90, this)
        }
        process() {
            var si = this.InputInventory.sendNextOfItem('Si')
            this.Inventory.addItem('Si Wafer')
        }
    })
TileRegistry.register(
    class CPU_Chipsetter extends Chipsetter {
        constructor(x, y) {
            super(x, y, "CPU0", "CPU_Die")
        }
    })
TileRegistry.register(
    class RAM_Chipsetter extends Chipsetter {
        constructor(x, y) {
            super(x, y, "Memory0", "Microchip0")
        }
    })

TileRegistry.register(
    class CPU_Etcher extends Etcher {
        constructor(x, y) {
            super(x, y, "CPU_Die","Si")
        }
    })
TileRegistry.register(
    class RAM_Etcher extends Etcher {
        constructor(x, y) {
            super(x, y, "Microchip0","Si")
        }
    })
TileRegistry.register(
class PCB_Etcher extends Etcher {
    constructor(x, y) {
        super(x, y, "PrintedCircuitBoard","PCB")
    }
})
TileRegistry.register(
class PCB_Maker extends ProductionTile {
    rend = (new renderer(ctx)).add(new renderer_image('PCB-Maker', 0, 0, false)).add(new renderer_item_output(0, 0, false))

    cost = 350
    constructor(x, y) {

        super(x, y, 0, 5, [], 2, 50, 0.1);
        this.outputItem = "CircuitBoard"
    }
    draw(x, y) {
        //wctx.fillRect("quary",x, y, tileSz, tileSz)
        //wctx.fillText(`${this.arrow}${this.timer}`, (x), (y) + 16, tileSz)
        this.rend.draw(x, y, (this.direction - 1) * 90, this)
    }
    process() {
        this.Inventory.addItem('CircuitBoard')
    }
    tick() {
        super.tick()
    }
})



for (x = 0; x <= 50; x++) { var row = []; for (y = 0; y <= 50; y++) { row.push(new tile(x, y, 0)) }; grid.push(row) } // grid gen

for (i of tileList) {
    ui.push(createTile(false, i, 0, 0))
}

function getCursorPosition(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top } } //gets cursor pos from event
function MousePos(evt) {
    var rect = getCursorPosition(evt); mouse.x = rect.x; mouse.y = rect.y;
    mouse.tx = Math.floor(rect.x / 32)
    mouse.ty = Math.floor(rect.y / 32)
    if (mouse.tx > 0 || mouse.tx < 50 || mouse.ty > 0 || mouse.ty < 50) {
        if (grid[mouse.tx][mouse.ty] instanceof FactoryTile) {
            mouse.t = grid[mouse.tx][mouse.ty]
            mouse.d = false
        } else if (grid[mouse.tx][mouse.ty] instanceof derelictTile) {
            mouse.t = grid[mouse.tx][mouse.ty]
            mouse.d = true
        } else {
            mouse.t = null
            mouse.d = false
        }
    } else {
        mouse.t = null
        mouse.d = false
    }
}

document.onkeydown = (e) => {
    switch (e.key) {
        case 'q':
            tileDirection = loopNeg((tileDirection - 1) % 4, 4)
            for (i of ui) { i.arrow = tileDirz[tileDirection]; i.direction = tileDirection }
            break
        case 'e':
            tileDirection = loopNeg((tileDirection + 1) % 4, 4)
            for (i of ui) { i.arrow = tileDirz[tileDirection]; i.direction = tileDirection }
            break
        case '/':
            if (Recips[tileType]) {
                //TODO Resip Viewer
            }
            break
        case 'p':
            openPicker()
            break
    }
}
canvas.onclick = (e) => {
    var c = getCursorPosition(e)
    var x = Math.floor(c.x / 32)
    var y = Math.floor(c.y / 32)
    if ((c.y < canvas.height - menu.h)) {
        place(x, y)
    } else if (c.x >= menu.sx && c.y >= canvas.height - 45) {
        x = Math.floor((c.x - menu.sx) / 40)
        tileType = tileList[x]
    }
}
document.onmousemove = MousePos

setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (R of grid) { for (t of R) { t.render() } } // tile refresh

    wctx.fillRect("Menu", menu.sx - 5, canvas.height - menu.h, canvas.width, menu.h)
    var x = menu.sx;
    if (mouse.d) {
        ctx.drawImage(derelictTx, menu.sx + 160, canvas.height - menu.h, 16, 16)
        wctx.fillText(`Distroyed`, menu.sx + 180, canvas.height - menu.h + 10, 150)
    } else if (mouse.t) {
        var hp = (mouse.t.hp / mouse.t.mhp) * 100
        wctx.fillRect("health", menu.sx + 160, canvas.height - menu.h, 100, 10)
        wctx.fillRect("belt", menu.sx + 160, canvas.height - menu.h, 100 - hp, 10)
    }
    wctx.fillText(`$${money}`, menu.sx, canvas.height - 50, 150)
    for (i in ui) {
        var e = ui[i]
        e.draw(x, canvas.height - 45)
        wctx.fillText(`${tileList[i]}`, (x) + 1, canvas.height - 5, 35)
        x += 40
    }
    drawResp()
}, 10)
setInterval(() => {
    for (R of grid) {
        for (t of R) {
            t.tick()
        }
    }
}, 500)