//--------------------------------------------------------------
// Jupiter Moon Clock — GitHub Pages Version
//--------------------------------------------------------------

const canvas = document.getElementById("jupiterCanvas");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight * 0.6;
}
resize();
window.addEventListener("resize", resize);

// Colors from your Colab style
const moonColors = {
    "Io": "#F6E27F",
    "Europa": "#E8EEF8",
    "Ganymede": "#D0D0D0",
    "Callisto": "#A0A0A0"
};

const jupiterColor = "#FFD97B";

// sprite sizes
const MOON_R = 18;
const GLOW_R = 55;
const J_R = 50;
const J_GLOW = 140;

// Draw soft glow
function drawGlow(x, y, radius, color) {
    let g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color + "44");
    g.addColorStop(1, color + "00");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Draw filled circle
function drawDisc(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// Map arcseconds to pixels (span autosizes)
function xToPx(xArcsec, span) {
    return W/2 + (xArcsec / span) * (W/2 * 0.85);
}

// Main drawing routine
function draw(data) {
    ctx.clearRect(0, 0, W, H);

    const xs = {
        "Io": data.Io,
        "Europa": data.Europa,
        "Ganymede": data.Ganymede,
        "Callisto": data.Callisto,
    };

    const span = Math.max(
        300,
        ...Object.values(xs).map(v => Math.abs(v)) * 1.4
    );

    //----------------------------------------------------------
    // Draw Jupiter
    //----------------------------------------------------------
    let jx = xToPx(0, span);
    let jy = H * 0.55;

    drawGlow(jx, jy, J_GLOW, jupiterColor);
    drawDisc(jx, jy, J_R, jupiterColor);

    //----------------------------------------------------------
    // Draw moons
    //----------------------------------------------------------
    for (const name of ["Io", "Europa", "Ganymede", "Callisto"]) {
        let x = xToPx(xs[name], span);
        let y = H * 0.55;

        drawGlow(x, y, GLOW_R, moonColors[name]);
        drawDisc(x, y, MOON_R, moonColors[name]);

        // label
        ctx.fillStyle = "white";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name, x, y - 40);
    }

    //----------------------------------------------------------
    // scale bar
    //----------------------------------------------------------
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    let barLen = W * 0.12;
    let barX1 = W/2 - barLen/2;
    let barX2 = W/2 + barLen/2;
    let barY = H * 0.9;

    ctx.beginPath();
    ctx.moveTo(barX1, barY);
    ctx.lineTo(barX2, barY);
    ctx.stroke();

    ctx.fillStyle = "#aaa";
    ctx.textAlign = "center";
    ctx.font = "18px sans-serif";
    ctx.fillText("~" + Math.round(span*0.1) + " arcsec", W/2, barY - 10);
}

//--------------------------------------------------------------
// JSON Loader
//--------------------------------------------------------------
async function loadJSON() {
    try {
        let response = await fetch("positions.json?cache=" + Date.now());
        let data = await response.json();

        draw(data);

        // update header text
        document.getElementById("timestamp").textContent = data.time;
        document.getElementById("warnings").textContent = data.events.join("\n");

    } catch (err) {
        console.error("Cannot load JSON:", err);
    }
}

// Refresh data every 10 seconds
loadJSON();
setInterval(loadJSON, 10000);
