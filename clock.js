//--------------------------------------------------------------
// Galileo Notebook + Modern Jupiter Clock
//--------------------------------------------------------------

const canvas = document.getElementById("jupiterCanvas");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight * 0.55;
}
resize();
window.addEventListener("resize", resize);


// Colors
const moonColors = {
    "Io": "#F6E27F",
    "Europa": "#E8EEF8",
    "Ganymede": "#D0D0D0",
    "Callisto": "#A0A0A0"
};
const jupiterColor = "#FFD97B";


// Sprite sizes
const MOON_R = 18;
const GLOW_R = 55;
const J_R = 50;
const J_GLOW = 140;


// Soft glow
function glow(x, y, radius, color) {
    let g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color + "55");
    g.addColorStop(1, color + "00");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Solid disk
function disk(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}


// Convert arcseconds to pixels
function xToPx(xArcsec, span) {
    return W/2 + (xArcsec / span) * (W * 0.42);
}


//--------------------------------------------------------------
// Draw modern Jupiter view
//--------------------------------------------------------------
function drawModern(entry) {
    ctx.clearRect(0, 0, W, H);

    const xs = entry.positions;
    const maxAbs = Math.max(...Object.values(xs).map(v => Math.abs(v)));
    const span = Math.max(300, maxAbs * 1.4);

    const jx = xToPx(0, span);
    const jy = H * 0.55;

    glow(jx, jy, J_GLOW, jupiterColor);
    disk(jx, jy, J_R, jupiterColor);

    for (let name of ["Io","Europa","Ganymede","Callisto"]) {
        const xarc = xs[name];
        const x = xToPx(xarc, span);
        const y = jy;

        glow(x, y, GLOW_R, moonColors[name]);
        disk(x, y, MOON_R, moonColors[name]);

        ctx.fillStyle = "white";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name, x, y - 40);
    }
}


//--------------------------------------------------------------
// Galileo Notebook Timeline
//--------------------------------------------------------------

function drawGalileo(entry, dataset) {

    // Current positions (arcsec)
    const nowPos = entry.positions;

    // Compute max span across entire dataset
    const allPos = [];
    dataset.forEach(row => {
        Object.values(row.positions).forEach(v => allPos.push(Math.abs(v)));
    });

    const span = Math.max(300, Math.max(...allPos) * 1.2);

    // Each moon gets one row
    const svgRows = {
        "Io": document.querySelector("#row-Io svg"),
        "Europa": document.querySelector("#row-Europa svg"),
        "Ganymede": document.querySelector("#row-Ganymede svg"),
        "Callisto": document.querySelector("#row-Callisto svg")
    };

    for (let moon of ["Io","Europa","Ganymede","Callisto"]) {

        const svg = svgRows[moon];
        svg.innerHTML = "";

        const width = svg.clientWidth;
        const height = svg.clientHeight;

        // Convert arcsec → SVG x coordinate
        const xMap = arcsec => {
            // center = 0 arcsec
            return width/2 + (arcsec / span) * (width * 0.45);
        };

        // --- Draw past 24h positional dots ---
        dataset.forEach(row => {
            const px = xMap(row.positions[moon]);
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");

            dot.setAttribute("cx", px);
            dot.setAttribute("cy", height / 2);
            dot.setAttribute("r", 3);
            dot.setAttribute("class", "galileo-dot");

            svg.appendChild(dot);
        });

        // --- Highlight CURRENT position ---
        const nowX = xMap(nowPos[moon]);
        const dotNow = document.createElementNS("http://www.w3.org/2000/svg", "circle");

        dotNow.setAttribute("cx", nowX);
        dotNow.setAttribute("cy", height / 2);
        dotNow.setAttribute("r", 6);
        dotNow.setAttribute("class", "galileo-dot-current");

        svg.appendChild(dotNow);

        // --- Draw a "now" vertical line aligned to arcsec ---
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", nowX);
        line.setAttribute("x2", nowX);
        line.setAttribute("y1", 0);
        line.setAttribute("y2", height);
        line.setAttribute("class", "galileo-now-line");

        svg.appendChild(line);
    }
}

//--------------------------------------------------------------
// Load and sync JSON
//--------------------------------------------------------------

let ephemeris = null;

async function loadJSON() {
    try {
        let r = await fetch("positions.json?cache=" + Date.now());
        ephemeris = await r.json();
    } catch (e) {
        console.error("JSON load failed:", e);
    }
}

function findEntry() {
    if (!ephemeris) return null;

    const now = new Date();
    const hhmm = now.toISOString().slice(0,16).replace("T"," ");

    return ephemeris.dataset.find(e => e.time === hhmm) ||
           ephemeris.dataset[0];
}

function updateUI(entry) {
    document.getElementById("timestamp").textContent = entry.time;

    const ev = entry.events;
    let msgs = [];
    for (let m of ["Io","Europa","Ganymede","Callisto"]) {
        if (ev[m]) msgs.push(`${m}: ${ev[m]}`);
    }

    document.getElementById("warnings").textContent = msgs.join("\n");
}


//--------------------------------------------------------------
// Main loop
//--------------------------------------------------------------
(async function() {
    await loadJSON();

    function update() {
        if (!ephemeris) return;
        const entry = findEntry();
        if (!entry) return;

        drawModern(entry);
        drawGalileo(entry, ephemeris.dataset);
        updateUI(entry);
    }

    update();
    setInterval(update, 10 * 1000);
})();

