// Renderizado modular por capas en Pixel Art
export function drawPixelCar(ctx, car, screenX, screenY) {
    ctx.save();
    ctx.translate(Math.round(screenX), Math.round(screenY));

    const isMustang = car.config.id === "mustang";

    // 1. Sombra debajo del vehiculo
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 52, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Chasis / Carroceria Base
    ctx.fillStyle = car.config.color;

    if (isMustang) {
        // Silueta Mustang Muscle Car: Morro largo y musculoso, cabina retrasada
        // Techo / Cabina
        ctx.fillRect(-22, -18, 36, 12);
        // Capo largo
        ctx.fillRect(14, -6, 38, 16);
        // Tronco / Baul trasero
        ctx.fillRect(-50, -8, 28, 18);
        // Cuerpo central
        ctx.fillRect(-45, -6, 95, 16);

        // Parabrisas y ventanas
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-18, -16, 14, 9); // Ventana conductor
        ctx.fillRect(0, -16, 12, 9); // Parabrisas delantero inclinado
        
        // Faros delanteros agresivos
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(50, -2, 3, 5);

        // Luces traseras de tres barras (clasicas Mustang)
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-51, -4, 2, 8);

        // Franjas deportivas en capó
        ctx.fillStyle = car.config.accentColor;
        ctx.fillRect(-40, -4, 90, 2);
    } else {
        // Silueta Honda Civic Hatchback: Compacto, cabina adelantada, cola cortada
        // Techo / Cabina
        ctx.fillRect(-28, -17, 44, 11);
        // Morro inclinado
        ctx.fillRect(16, -5, 30, 15);
        // Cuerpo central
        ctx.fillRect(-42, -6, 88, 16);

        // Cristales
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-24, -15, 16, 8);
        ctx.fillRect(-4, -15, 16, 8);
        ctx.fillRect(14, -13, 8, 6);

        // Faros Civic
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(44, -3, 3, 6);

        // Foco trasero
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-43, -4, 2, 7);

        // Aleron deportivo trasero (Spoon style)
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-34, -20, 10, 3);
        ctx.fillRect(-28, -17, 2, 3);
    }

    // 3. Ruedas (Llantas y Rines)
    const wheelY = 10;
    const frontWheelX = isMustang ? 34 : 28;
    const rearWheelX = isMustang ? -32 : -28;
    const tireRadius = isMustang ? 9 : 8;

    drawWheel(ctx, frontWheelX, wheelY, tireRadius, car.velocity);
    drawWheel(ctx, rearWheelX, wheelY, tireRadius, car.velocity);

    // 4. Escape y Fuego de Backfire
    const exhaustX = isMustang ? -51 : -43;
    const exhaustY = 6;
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(exhaustX - 2, exhaustY, 3, 4);

    if (car.backfireTimer > 0) {
        drawExhaustFlame(ctx, exhaustX - 3, exhaustY + 2);
    }

    ctx.restore();
}

function drawWheel(ctx, x, y, radius, velocity) {
    // Neumático
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Rin / Llanta de aleación
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(x, y, radius - 3, 0, Math.PI * 2);
    ctx.fill();

    // Centro de rueda
    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawExhaustFlame(ctx, x, y) {
    const flameLen = 8 + Math.random() * 14;
    // Fuego naranja/azul
    ctx.fillStyle = "#38bdf8"; // Nucleo azul
    ctx.fillRect(x - flameLen * 0.4, y - 1, flameLen * 0.4, 2);

    ctx.fillStyle = "#f97316"; // Llamarada naranja
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x - flameLen, y);
    ctx.lineTo(x, y + 2);
    ctx.fill();

    ctx.fillStyle = "#fef08a"; // Chispa amarilla
    ctx.fillRect(x - flameLen - 3, y - 1 + (Math.random() * 2 - 1), 2, 2);
}
