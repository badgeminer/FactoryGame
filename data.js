var helpMenu = document.getElementById('helpM')

function randomInt(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
};

function tglHelp() {
    helpMenu.hidden = !helpMenu.hidden
}

var menu = {
    h: 60,
    sx: 5
}

var tileSz = 32
var htileSz = tileSz / 2

tileDirz = [
    '^', ">", "v", "<"
]

class Registry {
    constructor(onReg) {
        this.registered = {}
        this.onReg = onReg
    }
    aquire(id) {
        var c = this.registered[id]
        if (c) {
            return c
        } else {
            return false
        }
    }
    register(c, ...a) {
        var id = c.name
        this.registered[id] = c;
        window[c.name] = c;
        this.onReg(id, c, a)
    }
}

const colors = {
    "text": "rgba(244, 244, 244, 1)",
    "steel": "rgba(117, 117, 200, 1)",
    "titanium": "rgba(105, 116, 196, 1)",
    "belt": "rgba(29, 29, 35, 1)",
    "quary": "rgba(222, 148, 88, 1)",
    "sismlt": "rgba(40,70,70,1)",
    "health": "rgba(241, 84, 84, 1)",
    "export": "rgba(77, 78, 88, 1)",
    "waferizer": "rgba(123, 123, 123, 1)",
    "Chipsetter": "rgba(40, 120, 92, 1)",
    "Kristal": "rgba(176, 186, 192, 1)",
    "Menu": "rgba(10,10,10,0.5)"
}

/*const assets = {
    "blank":document.getElementById('blank'),
    "wrench":document.getElementById('wrench'),
    "help":document.getElementById('help'),
    
    "rubble":document.getElementById('rubble'),
    "derelict":document.getElementById('derelict'),
    
    "quary":document.getElementById('quary'),
    "quary-drill":document.getElementById('quary-drill'),
    "adv-quary-drill":document.getElementById('adv-quary-drill'),
    "conveyor":document.getElementById('conveyor'),
    "SiliconSmelter":document.getElementById('SiliconSmelter'),
    "Waferizer":document.getElementById('Waferizer'),
    "Chipsetter":document.getElementById('Chipsetter'),
    "container":document.getElementById('container'),
    "vault":document.getElementById('vault'),
    "exportBay":document.getElementById('exportBay'),

    "Sand":document.getElementById('sand'),
    "Si":document.getElementById('silicon'),
    "Si Wafer":document.getElementById('SiWafer'),
    "CPU":document.getElementById('CPU'),
    "RAM":document.getElementById('RAM'),
    
}*/
var errImg = document.getElementById("placeholder")
const assets = {
    "Wrench": document.getElementById("Wrench") || errImg,
    "blank": document.getElementById("blank") || errImg,
    "help": document.getElementById("help") || errImg,
    "placeholder": document.getElementById("placeholder") || errImg,
    "SiliconSmelter": document.getElementById("SiliconSmelter") || errImg,
    "Waferizer": document.getElementById("Waferizer") || errImg,
    "Chipsetter": document.getElementById("Chipsetter") || errImg,
    "Etcher": document.getElementById("Etcher") || errImg,
    "PCB-Maker": document.getElementById("PCB-Maker") || errImg,
    "Sifter": document.getElementById("Sifter") || errImg,
    "duct": document.getElementById("duct") || errImg,
    "exportBay": document.getElementById("exportBay") || errImg,
    "quary-top": document.getElementById("quary-top") || errImg,
    "quary": document.getElementById("quary") || errImg,
    "quary-drill": document.getElementById("quary-drill") || errImg,
    "adv-quary-drill": document.getElementById("adv-quary-drill") || errImg,
    "container": document.getElementById("container") || errImg,
    "vault": document.getElementById("vault") || errImg,
    "CPU": document.getElementById("CPU") || errImg,
    "RAM": document.getElementById("RAM") || errImg,
    "Sand": document.getElementById("Sand") || errImg,
    "Si": document.getElementById("Si") || errImg,
    "Si Wafer": document.getElementById("Si Wafer") || errImg,
    "Copper": document.getElementById("Copper") || errImg,
    "Memory0": document.getElementById("Memory0") || errImg,
    "Memory1": document.getElementById("Memory1") || errImg,
    "Memory2": document.getElementById("Memory2") || errImg,
    "Memory3": document.getElementById("Memory3") || errImg,
    "Memory4": document.getElementById("Memory4") || errImg,
    "Memory5": document.getElementById("Memory5") || errImg,
    "Microchip0": document.getElementById("Microchip0") || errImg,
    "Microchip1": document.getElementById("Microchip1") || errImg,
    "Microchip2": document.getElementById("Microchip2") || errImg,
    "CPU1": document.getElementById("CPU1") || errImg,
    "CPU2": document.getElementById("CPU2") || errImg,
    "CPU0": document.getElementById("CPU0") || errImg,
    "CPU_Die": document.getElementById("CPU_Die") || errImg,
    "PrintedCircuitBoard": document.getElementById("PrintedCircuitBoard") || errImg,
    "CircuitBoard": document.getElementById("CircuitBoard") || errImg,
}

assets["rubble"] = document.getElementById('rubble')
assets["derelict"] = document.getElementById('derelict')

const prices = {
    "Sand": -1,
    "Si": 10,
    "Si Wafer": 30,
    'CPU0': 100,
    'Microchip0': 40,
    'Memory0': 80
}


const loopNeg = (n, m) => {
    if (n < 0) {
        return m + n
    }
    return n
}

var clamp = (i, M, m) => {
    return Math.max(Math.min(i, M), m)
}
class Wctx {
    constructor(ctx) {
        this.ctx = ctx
    }
    colorize(col) {
        this.ctx.fillStyle = colors[col];
    }
    fillRect(col, x, y, w, h) {
        this.colorize(col)
        this.ctx.fillRect(x, y, w, h)
    }
    fillText(t, x, y, mw) {
        this.colorize('text')
        this.ctx.fillText(t, x, y, mw)
    }

}

function directionCoord(direction) {
    switch (direction) {
        case 0:
            return [0, -1]
        case 1:
            return [1, 0]
        case 2:
            return [0, 1]
        case 3:
            return [-1, 0]
        default:
            return [0, 0]
    }
}