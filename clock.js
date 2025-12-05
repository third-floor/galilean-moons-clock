//--------------------------------------------------------------
// Jupiter Moon Clock — GitHub Pages Version (Style A)
// Clean, minimal, glow-based rendering, 24h JSON-enabled
//--------------------------------------------------------------

// Canvas setup
const canvas = document.getElementById("jupiterCanvas");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight * 0.6;
}
resize();
window.addEventListener("resize", resize);


// Color palette from your Colab style
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


//--------------------------------------------------------------
// Drawing helper functions
//--------------------------------------------------------------

// Soft glow using radial gradient
function drawGlow(x, y, radius, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color + "44");  // inner fade
    g.addColorStop(1, color + "00");  // transparent outer edge

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Solid circular disc
function drawDisc(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}


// Convert arcseconds → pixel position
function xToPx(xArcsec, span) {
    // Moons fit within 85% of the width
    return W/2 + (xArcsec / span) * (W * 0.42);
}


//--------------------------------------------------------------
// Main drawing function
//--------------------------------------------------------------
function draw(entry) {

    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    const xs = entry.positions;

    //------------------------------------------------------------------
    // Fix: Compute span correctly (no illegal spread multiplication)
    //------------------------------------------------------------------
    const maxAbs = Math.max(...Object.values(xs).map(v => Math.abs(v)));
    const span = Math.max(300, maxAbs * 1.4);

    //------------------------------------------------------------------
    // Draw Jupiter at center bottom
    //------------------------------------------------------------------
    const jx = xToPx(0, span);
    const jy = H * 0.55;

    drawGlow(jx, jy, J_GLOW, jupiterColor);
    drawDisc(jx, jy, J_R, jupiterColor);

    //------------------------------------------------------------------
    // Draw the moons
    //------------------------------------------------------------------
    for (const name of ["Io", "Europa", "Ganymede", "Callisto"]) {

        const xArc = xs[name];
        const x = xToPx(xArc, span);
        const y = H * 0.55;

        // Glow
        drawGlow(x, y, GLOW_R, moonColors[name]);

        // Disc
        drawDisc(x, y, MOON_R, moonColors[name]);

        // Label
        ctx.fillStyle = "white";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name, x, y - 40);
    }

    //------------------------------------------------------------------
    // Scale bar (showing ~10% of view span)
    //------------------------------------------------------------------
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 2;

    const barLen = W * 0.15;
    const barX1 = W/2 - barLen/2;
    const barX2 = W/2 + barLen/2;
    const barY = H * 0.9;

    ctx.beginPath();
    ctx.moveTo(barX1, barY);
    ctx.lineTo(barX2, barY);
    ctx.stroke();

    ctx.fillStyle = "#aaa";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`~${Math.round(span * 0.1)} arcsec`, W/2, barY - 10);
}


//--------------------------------------------------------------
// JSON Loader + time matching
//--------------------------------------------------------------

let ephemeris = null;

async function loadDataset() {
    try {
        const res = await fetch("positions.json?cache=" + Date.now());
        ephemeris = await res.json();
    } catch (err) {
        console.error("Cannot load JSON:", err);
    }
}


// Find nearest dataset entry to the current local time
function findCurrentEntry() {
    if (!ephemeris || !ephemeris.dataset) return null;

    const now = new Date();
    const hhmm = now.toISOString().slice(0,16).replace("T"," ");

    // Find exact minute match
    for (const row of ephemeris.dataset) {
        if (row.time === hhmm) return row;
    }

    // Else return closest earlier entry
    return ephemeris.dataset[0];
}


//--------------------------------------------------------------
// UI Update
//--------------------------------------------------------------
function updateUI(entry) {
    if (!entry) return;

    // Timestamp text
    document.getElementById("timestamp").textContent = entry.time;

    // Events text (multi-line)
    const ev = entry.events;
    let warnings = [];
    for (const m of ["Io", "Europa", "Ganymede", "Callisto"]) {
        if (ev[m]) warnings.push(`${m}: ${ev[m]}`);
    }
    document.getElementById("warnings").textContent = warnings.join("\n");
}


//--------------------------------------------------------------
// Main Update Loop (calls draw + loads correct entry)
//--------------------------------------------------------------
async function updateClock() {
    if (!ephemeris) return;

    const entry = findCurrentEntry();
    if (!entry) return;

    draw(entry);
    updateUI(entry);
}


//--------------------------------------------------------------
// Start the clock
//--------------------------------------------------------------
(async function() {
    await loadDataset();  // load JSON once
    updateClock();        // draw immediately
    setInterval(updateClock, 10 * 1000);  // redraw every 10s
})();
