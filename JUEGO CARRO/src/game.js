import { Car } from "./car.js";
import { drawPixelCar } from "./renderer.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Estado de la carrera
let playerCar = new Car("CIVIC", true, 260);
let opponentCar = new Car("MUSTANG", false, 180);

let gameState = "STAGE"; // STAGE, COUNTDOWN, RACING, FINISHED
let countdownTimer = 0;
let lightState = 0; // 0=apagado, 1=amarillo1, 2=amarillo2, 3=amarillo3, 4=VERDE
let raceDistanceMeters = 402.336; // 1/4 Milla

// Controles
const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "KeyW" || e.code === "ArrowUp") {
        playerCar.shiftUp();
        updateGearUI();
    }
    if (e.code === "KeyS" || e.code === "ArrowDown") {
        playerCar.shiftDown();
        updateGearUI();
    }
    if (e.code === "KeyR") {
        restartRace();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

// Selector de auto del jugador
document.getElementById("btnSelectCivic").addEventListener("click", () => {
    selectCar("CIVIC", "MUSTANG");
});
document.getElementById("btnSelectMustang").addEventListener("click", () => {
    selectCar("MUSTANG", "CIVIC");
});
document.getElementById("btnRestart").addEventListener("click", restartRace);

function selectCar(playerPreset, opponentPreset) {
    playerCar = new Car(playerPreset, true, 260);
    opponentCar = new Car(opponentPreset, false, 180);
    document.getElementById("carNameDisplay").innerText = playerCar.config.name;
    restartRace();
}

function restartRace() {
    playerCar.x = 0;
    playerCar.velocity = 0;
    playerCar.currentGear = 0;
    playerCar.rpm = playerCar.engine.idleRpm;
    playerCar.raceStarted = false;
    playerCar.raceFinished = false;
    playerCar.totalTimer = 0;
    playerCar.time60ft = 0;
    playerCar.timeQuarterMile = 0;

    opponentCar.x = 0;
    opponentCar.velocity = 0;
    opponentCar.currentGear = 0;
    opponentCar.rpm = opponentCar.engine.idleRpm;
    opponentCar.raceStarted = false;
    opponentCar.raceFinished = false;
    opponentCar.totalTimer = 0;
    opponentCar.time60ft = 0;
    opponentCar.timeQuarterMile = 0;

    gameState = "STAGE";
    lightState = 0;
    countdownTimer = 2.0; // 2 segundos para calentar / preparar
    document.getElementById("raceBanner").innerText = "¡PREPÁRATE EN LA LÍNEA!";
    updateGearUI();
}

function updateGearUI() {
    const gearEl = document.getElementById("gearDisplay");
    if (playerCar.currentGear === 0) {
        gearEl.innerText = "N";
        gearEl.style.color = "#94a3b8";
    } else {
        gearEl.innerText = playerCar.currentGear;
        gearEl.style.color = "#38bdf8";
    }
}

// Bucle principal
let lastTime = performance.now();

function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // Lectura de controles del jugador
    // Acelerador: Flecha Derecha o D o Tecla X
    const throttlePressed = keys["ArrowRight"] || keys["KeyD"] || keys["Space"];
    // Embrague: ShiftLeft o KeyC
    const clutchPressed = keys["ShiftLeft"] || keys["KeyC"];

    playerCar.throttle = throttlePressed ? 1.0 : 0.0;
    playerCar.clutch = clutchPressed ? 1.0 : 0.0;

    // Manejo del semáforo (Christmas Tree)
    if (gameState === "STAGE") {
        countdownTimer -= dt;
        if (countdownTimer <= 0) {
            gameState = "COUNTDOWN";
            countdownTimer = 0.5; // Intervalo entre luces amarillas
            lightState = 1;
        }
    } else if (gameState === "COUNTDOWN") {
        countdownTimer -= dt;
        if (countdownTimer <= 0) {
            lightState++;
            countdownTimer = 0.5;
            if (lightState >= 4) {
                // ¡VERDE!
                gameState = "RACING";
                playerCar.raceStarted = true;
                opponentCar.raceStarted = true;
                document.getElementById("raceBanner").innerText = "¡¡¡VERDE GO GO GO!!!";
            }
        }
    }

    // IA del oponente (Cambios automáticos perfectos de drag)
    if (gameState === "RACING") {
        opponentCar.throttle = 1.0;
        opponentCar.clutch = 0.0;
        if (opponentCar.currentGear === 0) {
            opponentCar.setGear(1);
        } else if (opponentCar.rpm >= opponentCar.engine.maxHpRpm * 0.98) {
            opponentCar.shiftUp();
        }
    }

    // Actualizar carros
    playerCar.update(dt);
    opponentCar.update(dt);

    // Actualizar humo de neumaticos
    [playerCar, opponentCar].forEach(car => {
        for (let i = car.tireSmoke.length - 1; i >= 0; i--) {
            const p = car.tireSmoke[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.radius += dt * 12;
            p.alpha -= dt * 1.2;
            if (p.alpha <= 0) {
                car.tireSmoke.splice(i, 1);
            }
        }
    });

    // Comprobar final de carrera
    if (playerCar.raceFinished && opponentCar.raceFinished && gameState !== "FINISHED") {
        gameState = "FINISHED";
        const winner = playerCar.timeQuarterMile < opponentCar.timeQuarterMile ? "¡GANASTE!" : "GANÓ EL OPONENTE";
        document.getElementById("raceBanner").innerText = `${winner} - 1/4 Milla: ${playerCar.timeQuarterMile.toFixed(3)}s @ ${playerCar.trapSpeedKmh.toFixed(1)} km/h`;
    }

    updateDashboard();
}

function updateDashboard() {
    // Tacómetro y Aguja
    const rpmPercent = playerCar.rpm / playerCar.engine.redlineRpm;
    const speedKmh = playerCar.velocity * 3.6;

    document.getElementById("speedDisplay").innerText = Math.round(speedKmh);
    document.getElementById("rpmDisplay").innerText = Math.round(playerCar.rpm);

    // Shift light
    const shiftLight = document.getElementById("shiftLight");
    if (playerCar.rpm >= playerCar.engine.maxHpRpm) {
        shiftLight.classList.add("active");
    } else {
        shiftLight.classList.remove("active");
    }

    // Telemetria en pantalla
    document.getElementById("distDisplay").innerText = `${playerCar.x.toFixed(1)} m / 402 m`;
    document.getElementById("timerDisplay").innerText = `${playerCar.totalTimer.toFixed(3)} s`;
    document.getElementById("tempDisplay").innerText = `${Math.round(playerCar.tireTemp)} °C`;
    
    // Indicador de patinaje
    const gripEl = document.getElementById("gripDisplay");
    if (playerCar.wheelSpin > 0.1) {
        gripEl.innerText = "¡PATINANDO!";
        gripEl.style.color = "#f97316";
    } else {
        gripEl.innerText = "TRACCIÓN OK";
        gripEl.style.color = "#4ade80";
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo: Cielo nocturno con degradado
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 150);
    skyGrad.addColorStop(0, "#090d16");
    skyGrad.addColorStop(1, "#182035");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, 150);

    // Ciudad / Skyline de fondo en paralaje
    const camX = playerCar.x * 20; // 20 pixeles por metro
    drawSkyline(camX * 0.1);

    // Asfalto de la pista de Drag
    ctx.fillStyle = "#1e2430";
    ctx.fillRect(0, 150, canvas.width, 150);

    // Líneas de carril
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 215, canvas.width, 4); // Separador de carriles

    // Línea de salida (0m) y meta (402m)
    const startScreenX = 120 - camX;
    const finishScreenX = 120 + (raceDistanceMeters * 20) - camX;

    // Línea de salida
    if (startScreenX > -20 && startScreenX < canvas.width + 20) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(startScreenX, 150, 6, 150);
    }

    // Meta cuadriculada (Checkered line)
    if (finishScreenX > -50 && finishScreenX < canvas.width + 50) {
        drawCheckeredFinish(finishScreenX);
    }

    // Particulas de humo
    [playerCar, opponentCar].forEach(car => {
        car.tireSmoke.forEach(p => {
            const screenSmokeX = 120 + (p.x - camX);
            ctx.fillStyle = `rgba(226, 232, 240, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(screenSmokeX, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    });

    // Dibujar los dos autos
    // El jugador siempre se centra alrededor de X = 120
    const playerScreenX = 120;
    const opponentScreenX = 120 + ((opponentCar.x - playerCar.x) * 20);

    drawPixelCar(ctx, opponentCar, opponentScreenX, opponentCar.laneY);
    drawPixelCar(ctx, playerCar, playerScreenX, playerCar.laneY);

    // Semáforo (Christmas Tree) en la salida
    if (startScreenX > -60 && startScreenX < canvas.width + 60) {
        drawChristmasTree(startScreenX - 30, 100);
    }
}

function drawSkyline(offset) {
    ctx.fillStyle = "#0f172a";
    for (let i = -1; i < 20; i++) {
        const x = ((i * 70 - offset) % (canvas.width + 100)) - 50;
        const h = 40 + ((i * 29) % 55);
        ctx.fillRect(x, 150 - h, 50, h);
    }
}

function drawCheckeredFinish(x) {
    const size = 8;
    for (let row = 0; row < 150 / size; row++) {
        for (let col = 0; col < 3; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#0f172a";
            ctx.fillRect(x + col * size, 150 + row * size, size, size);
        }
    }
}

function drawChristmasTree(x, y) {
    // Poste
    ctx.fillStyle = "#334155";
    ctx.fillRect(x + 10, y, 6, 80);

    // Luces (amarillas y verde)
    const lights = [
        { c: lightState >= 1 ? "#eab308" : "#422006", y: y + 10 },
        { c: lightState >= 2 ? "#eab308" : "#422006", y: y + 25 },
        { c: lightState >= 3 ? "#eab308" : "#422006", y: y + 40 },
        { c: lightState === 4 ? "#22c55e" : "#052e16", y: y + 55 }
    ];

    lights.forEach(l => {
        ctx.fillStyle = l.c;
        ctx.beginPath();
        ctx.arc(x + 13, l.y, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Iniciar
restartRace();
requestAnimationFrame(gameLoop);
