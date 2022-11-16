//Connected points are close
//All points are not too clse
//minimize overlapping lines

//100 to 5000 nodes
//0 to infinite connections per node
//average of 1.5 connections per node

//chunking
//remove nodes
//alert double connection

function download(filename, text) {//from https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

String.prototype.hash32Num = function() {
    var hash = 0, i, chr
    let input = this
    if(this.length < 10) {
        input += this
    }
    if(this.length < 5) {
        input += input
    }
    if(this.length < 3) {
        input += input
    }
    if (input.length === 0) return hash
    for (i = 0; i < input.length; i++) {
        chr = input.charCodeAt(i)
        hash = ((hash << 5) + hash) + chr
        hash |= 0 // Convert to 32bit integer
    }
    return hash
}

String.prototype.hash64Hex = function() {
    let hash1 = (this.hash32Num()>>>0).toString(16)
    return hash1 + ((hash1+this).hash32Num()>>>0).toString(16).toUpperCase()
}

function cleanString(input) {
    return input.toLowerCase().replace(/ +$/g,'').replace(/^ +/g,'').replace(/ /g, '_').replace(/[^a-z0-9_:]/g,'')
}

function exportIt() {
    let settings = {
        tasks: document.getElementById("exportTasks").checked,
        rewards: document.getElementById("exportRewards").checked,
        icon: document.getElementById("exportIcon").checked
    }
    //ask a couple quick questions
    let filename = prompt("Filename")
    if (filename == null) return
    filename = cleanString(filename)
    let scaleFactor = NaN
    while (Number.isNaN(scaleFactor))
        scaleFactor = prompt("Width? Recomened:" + Math.sqrt(objects.length/diffX/diffY)*diffX*2.5) / diffX

    let data = `{\n\tfilename: "${filename}"\n\tquests: [`
    filename += ".snbt"
    objects.forEach(i => {
        data += `\n\t\t{`
        if (`${i.x * scaleFactor}`.includes(".")) 
            data += `\n\t\t\tx: ${i.x * scaleFactor}d`
        else
            data += `\n\t\t\tx: ${i.x * scaleFactor}.0d`
        
        if (`${i.y * scaleFactor}`.includes(".")) 
            data += `\n\t\t\ty: ${i.y * scaleFactor}d`
        else
            data += `\n\t\t\ty: ${i.y * scaleFactor}.0d`
        
        if (i.con.length > 0) {
            if (i.con.length == 1) {
/*                 console.log("----------")
                console.log(i)
                console.log(i.con)
                console.log(i.con[0])
                console.log(i.con[0].id) */
                data += `\n\t\t\tdependencies: ["${i.con[0].id}"]`
            } else {
                data += `\n\t\t\tdependencies: [`
                i.con.forEach(j => {
                    data += `\n\t\t\t\t"${j.id}"`
                })
                data += `\n\t\t\t]`
            }
        }
        if (settings.icon) data += `\n\t\t\ticon: "${i.value}"`
        data += `\n\t\t\tid: "${i.id}"`
        if (settings.tasks) data += `\n\t\t\ttasks: [{\n\t\t\t\ttype: "item"\n\t\t\t\titem: "${i.value}"\n\t\t\t}]`
        if (settings.rewards) data += `\n\t\t\trewards: [{\n\t\t\t\ttype: "item"\n\t\t\t\titem: "${i.value}"\n\t\t\t}]`
        data += `\n\t\t}`
    })
    data += `\n\t]\n}`

    download(filename, data)
}

let objects = []

function importIt(e) {
    let fr = new FileReader()
    let result

    fr.onload=function(){
        result = parseInput(fr.result)
        console.log(result)
        result.quests.forEach(i => {
            i.x = Number(i.x.slice(0, -1))
            i.y = Number(i.y.slice(0, -1))

            //search for a value
            let newValue
            if (i.icon != undefined)
                newValue = i.icon
            if (i.tasks != undefined && newValue == undefined) {
                i.tasks.forEach(j => {
                    if (j.type == "item") {
                        if (typeof j.item == "string")
                            newValue = j.item
                        else if (j.item.id != undefined)
                            newValue = j.item.id
                    }
                })
            }
            if (i.rewards != undefined && newValue == undefined) {
                i.rewards.forEach(j => {
                    if (j.type == "item") {
                        if (typeof j.item == "string")
                            newValue = j.item
                        else if (j.item.id != undefined)
                            newValue = j.item.id
                    }
                })
            }

            if (i.icon != undefined)
                newValue = "item_not_found"


            if (i.dependencies) 
                addId(i.id,newValue,i.dependencies,(i.x),i.y)
            else
                addId(i.id,newValue,[],i.x,i.y)
        })
    }
    fr.readAsText(e.files[0])
    //const selectedFile = this.files[0]
}

function parseInput(text) {
    //adds in quotes
    let quote = 'no'
    let result = ""
    for (let i of text.replace(/\r/g,"")) {
        if (i.match(/[a-zA-Z0-9-_]/)) {
            switch (quote) {
                case "no":
                    result += "\""
                    quote = "made"
                    break;
                case "made":
                    break;
                case "pre":
                    break;
            }
        }
        if (i.match(/[\n:]/)) {
            switch (quote) {
                case "no":
                    break;
                case "made":
                    result += "\""
                    quote = "no"
                    break;
                case "pre":
                    break;
            }
        }
        if (i == "\"" && result.charAt(result.length - 1) != "\\") {
            switch (quote) {
                case "no":
                    quote = "pre"
                    break;
                case "made":
                    console.log("Something bad happened!")
                    result += "\\"
                    return;
                case "pre":
                    quote = "no";
                    break;
            }
        }
        result+= i
    }
    //adds in commas
    result = result.replace(/(?<![\[\{,])\n(?!(\t*[\}\]]))/gm,",\n")
    //removes last trailing comma
    result = result.slice(0,result.lastIndexOf(","))
    
    return JSON.parse(result)
}

/* let chunks = []

for (let i = 0;i < 50; i++) {
    chunks.push([])
    for (let j = 0;j < 50; j++) {
        chunks[i].push([])
    }
} */

var c = document.getElementById("c");
var ctx = c.getContext("2d")
ctx.strokeStyle = "#FFE0D0";

let minX = -1
let maxX = 1
let minY = -1
let maxY = 1
let diffX = 0
let diffY = 0

function findValue(i) {
    return objects.find(k => k.value == i)
}

function findId(i) {
    return objects.find(k => k.id == i)
}

let connections = []

function addId(id,value,conId,x,y) {
    if (y != null) {//add the node
        objects.push({
            id:id,
            value:value,
            conId:conId,
            con:[],
            x:x,
            y:y,
            vx:0,
            vy:0
        })
    } else if (conId) {
        objects.push({
            id:id,
            value:value,
            conId:conId,
            con:[],
            x:Math.random()*10-5,
            y:Math.random()*10-5,
            vx:Math.random()-0.5,
            vy:Math.random()-0.5
        })
    } else {
        objects.push({
            id:id,
            value:value,
            conId:[],
            con:[],
            x:Math.random()*10-5,
            y:Math.random()*10-5,
            vx:Math.random()-0.5,
            vy:Math.random()-0.5
        })
    } 
    //add connections that are waiting to be formed from other nodes to this node
    it = objects[objects.length-1]
    objects.forEach(i => {
        if (i != it && i.con.length != i.conId.length) {
            if (i.conId.includes(id)) {
                i.con.push(it)
                connections.push([i,it])
            }
        }
    })
    //add conections to the this node to others
    if (conId != null) {
        conId.forEach(i => {
            foundNode = findId(i)
            if (foundNode) {
                it.con.push(foundNode)
                connections.push([it,foundNode])
            }
        })
    }
}

function add(value,conName,x,y) {//value is a string name and conName is an array of string names and is optional
    if(conName != null) {
        let conId = []
        conName.forEach(i => {
            conId.push(i.hash64Hex())
        })
        if (y) {
            addId(value.hash64Hex(),value,conId,x,y)
        } else {
            addId(value.hash64Hex(),value,conId)
        }
    } else {
        addId(value.hash64Hex(),value)
    }

}

function addConnection(from, to, warn) {//from and to are string names
    let toReal = findValue(to)
    if (toReal == undefined) {
        if(warn && !confirm("You are going to add a connection to a node that does not exist! Do you wish to continue?")) return
    } else {
        from.con.push(toReal)
        connections.push([from,toReal])
    }
    from.conId.push(to.hash64Hex())
}

function removeConnection(from, to, warn) {//from and to are string names
    let fromReal = findValue(from)
    var toReal = findValue(to)
    if (!fromReal.conId.includes(toReal.id)) {
        if (warn) {
            alert("It is already not connected!")
        } else {
            console.log(`Tried to remove non-existing connection from ${from} to ${to}!`)
        }
        return
    }
    let index = fromReal.conId.findIndex((i)=>i==toReal.id)
    fromReal.conId.splice(index,1)
    fromReal.con.splice(index,1)
    index = connections.findIndex((i)=>i==[fromReal,toReal])
    connections.splice(index,1)
}

function reset() {
    connections = []
    objects = []
    selected = null
}

/* add("cobble")
add("gravel",["cobble"])
add("iron_nugget",["gravel"])
add("flint",["gravel"])
add("molten_iron",["iron_nugget"])
add("tuff",["molten_iron","andesite"])
add("andesite",["cobble","diorite"])
add("diorite",["cobble","quartz"])
add("quartz",["soul_sand"])
add("soul_sand",["sand","yeast"])
add("sand",["gravel"])
add("yeast",["sugar"])
add("sugar",["sugar_cane"])
add("sugar_cane")
add("andesite_alloy",["tuff"])

add("milk")
add("granite",["diorite","quartz"])
add("redstone",["granite"])
add("amethyst",["moist_amethyst"])
add("magic_milk",["moist_amethyst"])
add("moist_amethyst",["milk","redstone","amethyst"])
add("rose_quartz",["magic_milk","quartz"])
add("paper",["sugar_cane"])
add("sand_paper",["paper"])
add("polished_rose_quartz",["rose_quartz","sand_paper"])
add("electron_tube",["polished_rose_quartz","molten_iron"])
add("lava")
add("netherwart")
add("netherwart_block",["netherwart"])
add("netherake",["lava","netherwart_block"])
add("cinder_flour",["netherake"])
add("beet_root")
add("blaze_cake_base",["cinder_flour","sugar","beet_root"])
add("blaze_cake",["blaze_cake_base","lava"])
add("zinc_ore",["deepslate","mineral_solution"])
add("raw_zinc",["zinc_ore"])
add("crushed_zinc",["raw_zinc","brush"])
add("zinc_nuggets",["crushed_zinc","raw_zinc"])
add("molten_zinc",["zinc_nuggets"])
add("mineral_solution",["molten_zinc","amethyst"])
add("crude_oil")
add("basalt")
add("smooth_basalt",["basalt"])
add("deepslate",["smooth_basalt","mineral_solution"])
add("alage")
add("shell",["alage"])
add("bonemeal",["shell"])
add("limestone")
add("calacite",["limestone","bonemeal"])
add("lapis_ore",["calacite","mineral_solution"])
add("brush",["string","brick"])
add("string",["flax"])
add("flax")
add("brick",["clay"])
add("clay",["sand"])
add("crushed_lapis",["lapis_ore","brush"])
add("lapis",["crushed_lapis"])
add("lpg",["crude_oil","gas"])
add("heavy_oil",["crude_oil"])
add("kerosine",["crude_oil","heavy_oil"])
add("gas",["crude_oil","kerosine"])
add("log")
add("wood_planks",["log"])
add("wood_slabs",["wood_planks"])
add("ash",["wood_slabs"])
add("gun_powder",["ash","gas"])
add("tnt",["sand","gun_powder"])
add("prismarine_crystal",["lapis","prismarine"])
add("prismarine_shard",["prismarine_crystal","prismarine","tnt"])
add("prismarine",["prismarine_shard"])
add("copper_nugget",["prismarine"])
add("molten_copper",["copper_nugget"])
add("fortification_agent",["granite"])
add("molten_brass",["molten_copper","molten_zinc","fortification_agent","blaze_cake"])
add("brass",["molten_brass"])
add("charcoal",["log"])
add("molten_steel",["limestone","molten_iron","blaze_cake","charcoal"])
add("steel",["molten_steel"])

add("shaft",["andesite_alloy"])
add("cog",["shaft","wood_planks"])
add("large_cog",["cog","wood_planks"])
add("steel_rod",["steel"])
add("spring",["steel_rod"])
add("precision_juice",["powder_snow"])
add("powder_snow",["ice"])
add("ice")
add("gold_nugget",["soul_sand"])
add("gold",["gold_nugget"])
add("gold_sheet",["gold"])
add("precision_mechanism",["large_cog","gold_sheet","spring","precision_juice","plastic"])
add("molten_plastic",["biodisel","charcoal"])
add("plastic",["molten_plastic"])
add("biodisel",["plant_oil","lpg"])
add("plant_oil",["twisting_vines","weeping_vines"])
add("twisting_vines")
add("weeping_vines")
add("molten_gold",["gold_nugget"])
add("molten_rose_gold",["molten_gold","molten_copper","blaze_cake"])
add("rose_gold",["molten_gold","redstone"])
add("brass",["molten_brass"])

add("brass_sheet",["brass"])
add("empty_pcb",["precision_mechanism","brass_sheet"])
add("uved_pcb",["empty_pcb"])
add("etched_pcb",["uved_pcb","acid"])
add("acid",["fermented_spider_eye","gas"])
add("fermented_spider_eye",["spider_eye","sugar","mushroom"])
add("spider_eye",["acid"])
add("mushroom")
add("copper",["copper_nugget"])
add("copper_wire",["copper"])
add("zinc",["zinc_nuggets"])
add("zinc_sheet",["zinc"])
add("bottle",["glass"])
add("glass",["sand"])
add("capacitor",["paper","zinc_sheet","copper_wire","bottle"])
add("quartz_block",["quartz"])
add("smooth_quartz",["quartz_block"])
add("silicon",["quartz_block"])
add("silicon_waffer",["silicon","acid"])
add("transistor",["silicon_waffer","rose_gold"])
add("circut",["etched_pcb","transistor","capacitor","electron_tube"]) */

MODE = 'drag'

MOUSE_FORCE = document.getElementById("mouseSlider").value**3
FRICTION = document.getElementById("fricitonSlider").value
REPEL_FORCE = document.getElementById("repelSlider").value
CENTER_FORCE = document.getElementById("centerSlider").value
ATRACK_FORCE = document.getElementById("atrackSlider").value
LINE_FORCE = document.getElementById("atrackSlider").value
SIMULATE = document.getElementById("activeCheckbox").checked
STIFF = false
Noise = 0
let selected = null
let mouseDown = false

function reverseCord(n,min,max,scale) {
    return (max - min) * (n - 10) / (scale - 20) + min
}

function closest (x,y) {
    let dis = Infinity
    let o = null
    objects.forEach(i => {
        let thisDis = distance(x-i.x,y-i.y)
        if (thisDis < dis) {
            dis = thisDis
            o = i
        }
    })
    return o
}

function distance(x,y) {
    return Math.sqrt(x**2 + y**2)
}

function intersection(x1,y1,x2,y2,x3,y3,x4,y4) {
    let m1 = (y1 - y2) / (x1 - x2) // slope of the line 1
    let m2 = (y3 - y4) / (x3 - x4) // slope of line 2
    if (m1 == m2) return false // they are parrel, so no interesction possible
    let x = ( (y3 - m2 * x3) - (y1 - m1 * x1) ) / (m1 - m2) // gets the x cord of the interesection
    if (x <= Math.min(x1,x2)) return false // is left of line 1
    if (x >= Math.max(x1,x2)) return false // is right of line 1
    if (x <= Math.min(x3,x4)) return false // is left of line 2
    if (x >= Math.max(x3,x4)) return false // is right of line 2
    return true // if all check pass then the lines inersect in between both the lines
}

function closestPointToLine(x1,y1,x2,y2,xc,yc) {
    let m = (y2 - y1) / (x2 - x1) // slope of the line
    let b = y1-m*x1 // y-int of the line
    let x = ( xc +m*b -m*yc ) / (1 + m**2) // x cord of the closest point from the line to point
    let y = m*x +b // y cord of the closest point from the line to point

    if (x <= Math.min(x1,x2) || x >= Math.max(x1,x2)) // not inside of the region
        if ( distance(xc -x1, yc -y1) < distance(xc -x2, yc -y2))
            return [x1,y1]
        else
            return [x2,y2]
    else // i know its not needed, but added to clarity
        return [x, y] // distance to the point
}

function vel() {

    objects.forEach(i => {

        connections.forEach(con => {//repel connections
            if (con[0] != i && con[1] != i) {
                let p1 = con[0]
                let p2 = con[1]
                let point = closestPointToLine(p1.x,p1.y,p2.x,p2.y,i.x,i.y)
                let dis = distance( point[0]-i.x , point[1]-i.y )
                if (dis < 40) {
                    let angle = Math.atan2( point[1]-i.y , point[0]-i.x )
                    //i.vx+= Math.max(1/dis,1) / 3
                     i.vx -= Math.cos(angle) / dis * LINE_FORCE
                     i.vy -= Math.sin(angle) / dis * LINE_FORCE
                }
            }
        })

        objects.forEach(j => {//repel points
            if (i != j) {
                let dis = distance(i.x -j.x, i.y -j.y)
                if (dis < 40) {
                    let angle = Math.atan2(j.y-i.y,j.x-i.x)
                    i.vx -= Math.cos(angle) / dis * REPEL_FORCE
                    i.vy -= Math.sin(angle) / dis * REPEL_FORCE
                }
            }
        })

        //center
        i.vx -= i.x * CENTER_FORCE
        i.vy -= i.y * CENTER_FORCE
        
        i.con.forEach(j => {//atrack
            let dis = distance(i.x -j.x, i.y -j.y)
            let angle = Math.atan2(j.y-i.y,j.x-i.x)
            j.vx -= Math.cos(angle) * dis**2 * ATRACK_FORCE
            j.vy -= Math.sin(angle) * dis**2 * ATRACK_FORCE
            i.vx += Math.cos(angle) * dis**2 * ATRACK_FORCE
            i.vy += Math.sin(angle) * dis**2 * ATRACK_FORCE
        })

        i.vx += (Math.random() - 0.5) * Noise//Noise
        i.vy += (Math.random() - 0.5) * Noise

        i.vx *= FRICTION//friction
        i.vy *= FRICTION
    })

    //small improvement at the cost of lots of preformance
    if (!STIFF) return
    connections.forEach(con1 => {
        connections.forEach(con2 => {
            if (!con2.includes(con1[0]) && !con2.includes(con1[1])) {//ensures that they are 4 unique points
                let p11 = con1[0]
                let p12 = con1[1]
                let p21 = con2[0]
                let p22 = con2[1]
                if (intersection(p11.x,p11.y, p12.x,p12.y, p21.x,p21.y, p22.x,p22.y)) {
                    //strong attraction between each point and its connected one
                    p11.xv += (p12.x - p11.x)*10
                    p12.xv += (p11.x - p12.x)*10
                    p11.yv += (p12.y - p11.y)*10
                    p12.yv += (p11.y - p12.y)*10
                    p21.xv += (p22.x - p21.x)*10
                    p22.xv += (p21.x - p22.x)*10
                    p21.yv += (p22.y - p21.y)*10
                    p22.yv += (p21.y - p22.y)*10
                }
            }
        })
    })
}

function move() {
    objects.forEach(i => {
        i.x += i.vx *0.1
        i.y += i.vy *0.1
    })
}

function newCord(n,min,max,scale) {
    return (n - min) / (max - min) * (scale-20) + 10
}
function newXCord(n) {
    return newCord(n,minX,maxX,c.width)
}
function newYCord(n) {
    return newCord(n,minY,maxY,c.height)
}

function draw() {
    ctx.beginPath();

    objects.forEach(i => {
        ctx.moveTo(newXCord(i.x),newYCord(i.y))
        i.con.forEach(j => {
            ctx.lineTo(newXCord(j.x),newYCord(j.y))
            ctx.moveTo(newXCord(i.x),newYCord(i.y))
        })
        ctx.rect(newXCord(i.x)-3,newYCord(i.y)-3,6,6)
    })

    if (selected) ctx.rect(newXCord(selected.x)-6,newYCord(selected.y)-6,12,12)

    ctx.clearRect(0,0,c.width,c.height)
    ctx.stroke();
}

draw()
let myInterval = setInterval(function(){
    if (SIMULATE) {
        vel()
        move()
    }
    mouse()
    updatePos()
    draw()
    Noise /= 1.002
}, 1)

function mouse() {
    if (!mouseDown) return
    switch (MODE) {
        case "drag":
            selected.x = mouseX
            selected.y = mouseY
            selected.vx = 0
            selected.vy = 0
        break
        case "push":
            objects.forEach(i => {
                let dis = distance(i.x -mouseX, i.y -mouseY)
                //if (dis < 40) {
                    //let angle = Math.atan2(i.y-mouseX,i.x-mouseY)
                    i.x -= (mouseX - i.x) / dis**2 * MOUSE_FORCE * (diffX + diffY)//Math.cos(angle) / dis * MOUSE_FORCE
                    i.y -= (mouseY - i.y) / dis**2 * MOUSE_FORCE * (diffX + diffY)//Math.sin(angle) / dis * MOUSE_FORCE
                //}s
            })
        break
    }
}

function updatePos() {
    if (diffX > diffY) {//zooms in and helps make the ratio be square
        minX += diffX/100
        maxX -= diffX/100
        // minY -= diffY/200
        // maxY += diffY/200
    } else {
        minY += diffY/100
        maxY -= diffY/100
        // minX -= diffX/200
        // maxX += diffX/200
    }

    diffX = maxX-minX
    diffY = maxY-minY

    objects.forEach(i => {
        minX = Math.min(minX,i.x)
        maxX = Math.max(maxX,i.x)
        minY = Math.min(minY,i.y)
        maxY = Math.max(maxY,i.y)
    })
}

function freeze(){
    objects.forEach(i =>{
        i.vx = 0
        i.vy = 0
    })
}

function resetPos(){
    minX = -1
    maxX = 1
    minY = -1
    maxY = 1
    diffX = 0
    diffY = 0
    objects.forEach(i =>{
        i.x=Math.random()*10-5,
        i.y=Math.random()*10-5,
        i.vx=Math.random()-0.5,
        i.vy=Math.random()-0.5
    })
}

let mouseX = 0;
let mouseY = 0;
c.addEventListener("mousemove", function(e) {
    CRECT = c.getBoundingClientRect() // Gets CSS pos, and width/height
    mouseX = reverseCord(Math.round(e.clientX - CRECT.left),minX,maxX,c.width) // Subtract the 'left' of the canvas 
    mouseY = reverseCord(Math.round(e.clientY - CRECT.top),minY,maxY,c.height)  // from the X/Y positions to make 
    //ctx.rect(newCord(mouseX,minX,maxX,c.width)-3,newCord(mouseY,minY,maxY,c.height)-3,6,6)
    //ctx.moveTo(mouseX,mouseY)
})

let selectedText = document.getElementById("selectedText")
let connectionsText = document.getElementById("connectionsText")
function updateSelectedText() {
    selectedText.innerHTML = `Selected: ${selected.value}`
    let temp = []
    selected.con.forEach(i=>{
        temp += i.value + " "
    })
    selected.conId.forEach(i => {
        if (selected.con.find(j => j.id == i) == undefined) {
            temp += i + " "
        }
    })
    connectionsText.innerHTML = `Connections: ${temp}`
}

c.addEventListener("mousedown", function(e) {
    selected = closest(mouseX,mouseY)
    updateSelectedText()
    mouseDown = true
})
c.addEventListener("mouseup", function(e) {
    mouseDown = false
    //selectedText.innerHTML = "-"
})
c.addEventListener("mouseout", function(e) {
    mouseDown = false
    //selectedText.innerHTML = "-"
})

document.getElementById("fricitonSlider").oninput = function() {
    FRICITON = this.value
}
document.getElementById("repelSlider").oninput = function() {
    REPEL_FORCE = this.value
}
document.getElementById("centerSlider").oninput = function() {
    CENTER_FORCE = this.value
}
document.getElementById("atrackSlider").oninput = function() {
    ATRACK_FORCE = this.value**2
}
document.getElementById("lineSlider").oninput = function() {
    LINE_FORCE = this.value
}
document.getElementById("mouseSlider").oninput = function() {
    MOUSE_FORCE = document.getElementById("mouseSlider").value**3
}
let connectionInput = document.getElementById("connectionInput")
function addConnectionButton() {
    let cleaned = cleanString(connectionInput.value)
    if (cleaned == "") return
    addConnection(selected,cleaned,true)
    updateSelectedText()
    connectionInput.value = ""
}
function removeConnectionButton() {
    let cleaned = cleanString(connectionInput.value)
    if (cleaned == "") return
    removeConnection(selected.value,cleaned,true)
    updateSelectedText()
    connectionInput.value = ""
}
let nodeNameInput = document.getElementById("nodeNameInput")
function addNodeButton() {
    let cleaned = cleanString(nodeNameInput.value)
    if (cleaned == "") return
    add(cleaned)
    selected = objects[objects.length-1]
    updateSelectedText()
    nodeNameInput.value = ""
}

function renameNodeButton() {
    let cleaned = cleanString(nodeNameInput.value)
    if (cleaned == "") return
    console.log(`cleaned ${cleaned}`)
    selected.value = cleaned
    updateSelectedText()
    nodeNameInput.value = ""
}

/*
// does not work becuase of reference varibles being weird or something
function removeNodeButton(){
    let newConnections = [...connections]
    newConnections.forEach(i => {
        if (i.includes(selected)) {
            removeConnection(i[0].value,i[1].value)
        }
    })
    updateSelectedText()
    objects.splice(objects.indexOf(selected),1)
    selected = null
} */