const TO_RADIANS = Math.PI / 180; 

class renderer_component {
    constructor(turnBy,off,s) {
        this.a = off
        this.s = s
        this.tb = turnBy
    }
    DrawWapper(ctx,f,t){
        ctx.translate(htileSz,htileSz)
        if (this.s) {ctx.rotate((f * TO_RADIANS));}
        ctx.rotate(this.a * TO_RADIANS);
        ctx.translate(-htileSz,-htileSz)
        this.draw(ctx,t)
        ctx.translate(htileSz,htileSz)
        ctx.rotate(-(this.a * TO_RADIANS));
        if (this.s) {ctx.rotate(-(f * TO_RADIANS));}
        ctx.translate(-htileSz,-htileSz)
        this.a+= this.tb
    }
    draw(ctx,t) {
        ctx.fillStyle = "black";
        ctx.fillRect(x, y, tileSz, tileSz);
    }
}



class renderer_image extends renderer_component {
    constructor(img,turnBy,off,s) {
        super(turnBy,off,s)
        this.img = assets[img]
    }
    draw(ctx,t) {
        ctx.drawImage(this.img,0,0,tileSz,tileSz)
    }
}
class renderer_item_nxt extends renderer_component {
    constructor(turnBy,off,s) {
        super(turnBy,off,s)
    }
    draw(ctx,t) {
        if (t.Inventory.nextItemForce()) {
            ctx.drawImage(assets[t.Inventory.nextItemForce()]||assets["blank"],8,8,htileSz,htileSz)
        }
    }
}
class renderer_item_output extends renderer_component {
    constructor(turnBy,off,s) {
        super(turnBy,off,s)
    }
    draw(ctx,t) {
        ctx.drawImage(assets[t.outputItem]||assets["blank"],8,8,htileSz,htileSz)
    }
}

class renderer {
    constructor(ctx) {
        this.layers = []
        this.ctx = ctx
    }
    add(comp) {
        this.layers.push(comp)
        return this
    }
    draw(x,y,f,t) {
        ctx.save();
        ctx.translate(x,y)
        

        for (var rc of this.layers) {
            rc.DrawWapper(this.ctx,f,t)
        }
        
        ctx.restore();
    }
}