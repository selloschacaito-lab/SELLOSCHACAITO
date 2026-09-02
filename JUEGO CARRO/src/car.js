import { PRESET_ENGINES, PRESET_CARS } from "./physics.js";

export class Car {
    constructor(presetKey, isPlayer = true, laneY = 0) {
        this.config = JSON.parse(JSON.stringify(PRESET_CARS[presetKey]));
        this.engine = PRESET_ENGINES[this.config.engineKey];
        this.isPlayer = isPlayer;
        this.laneY = laneY;

        // Estado dinamico
        this.x = 0; // Metros
        this.velocity = 0; // m/s
        this.rpm = this.engine.idleRpm;
        this.currentGear = 0; // 0 = Neutro, 1 = 1ª, 2 = 2ª, etc.
        this.clutch = 0; // 0 = acoplado (suelto), 1 = desacoplado (pisado)
        this.throttle = 0; // 0 a 1
        this.wheelSpin = 0; // Ratio de patinaje (0 = agarre total, >0 = humo y quemada)
        this.tireTemp = 40; // Grados Celsius (optimo ~85-105)
        this.backfireTimer = 0;

        // Telemetria de Drag
        this.raceStarted = false;
        this.raceFinished = false;
        this.reactionTime = 0;
        this.time60ft = 0;
        this.timeQuarterMile = 0;
        this.trapSpeedKmh = 0;
        this.totalTimer = 0;

        // Particulas
        this.tireSmoke = [];
        this.exhaustFlames = [];
    }

    setGear(gear) {
        if (gear < 0) gear = 0;
        const maxGear = this.config.gearRatios.length;
        if (gear > maxGear) gear = maxGear;
        this.currentGear = gear;
    }

    shiftUp() {
        this.setGear(this.currentGear + 1);
        this.triggerShiftPop();
    }

    shiftDown() {
        this.setGear(this.currentGear - 1);
    }

    triggerShiftPop() {
        // Explota por escape si cambia a altas RPM
        if (this.rpm > this.engine.redlineRpm * 0.75) {
            this.backfireTimer = 0.15; // segundos de llamarada
        }
    }

    update(dt) {
        if (dt <= 0) return;

        // 1. Temporizadores
        if (this.backfireTimer > 0) {
            this.backfireTimer -= dt;
        }

        if (this.raceStarted && !this.raceFinished) {
            this.totalTimer += dt;
            // 60 pies = 18.288 metros
            if (this.x >= 18.288 && this.time60ft === 0) {
                this.time60ft = this.totalTimer;
            }
            // 1/4 de milla = 402.336 metros
            if (this.x >= 402.336) {
                this.timeQuarterMile = this.totalTimer;
                this.trapSpeedKmh = this.velocity * 3.6;
                this.raceFinished = true;
            }
        }

        // 2. Relaciones de transmisión
        let totalGearRatio = 0;
        if (this.currentGear > 0) {
            totalGearRatio = this.config.gearRatios[this.currentGear - 1] * this.config.finalDriveRatio;
        }

        // 3. Simulación de RPM y Clutch
        const clutchEngaged = 1 - this.clutch; // 1 = embrague pegado, 0 = embrague pisado
        const wheelRpm = (this.velocity / (2 * Math.PI * this.config.tireRadiusM)) * 60;
        const drivetrainRpm = wheelRpm * totalGearRatio;

        if (this.currentGear === 0 || clutchEngaged < 0.1) {
            // Motor libre (neutro o embrague pisado)
            if (this.throttle > 0.05) {
                // Sube de vueltas muy rapido
                this.rpm += (this.throttle * 8500 - (this.rpm - this.engine.idleRpm) * 0.5) * dt * 4;
            } else {
                // Cae al ralenti
                this.rpm += (this.engine.idleRpm - this.rpm) * dt * 6;
            }
        } else {
            // Motor conectado a las ruedas
            const targetRpm = Math.max(this.engine.idleRpm, drivetrainRpm);
            // Si las RPM son muy bajas y se suelta el clutch de golpe, el motor tironea o empuja
            this.rpm = this.rpm + (targetRpm - this.rpm) * (clutchEngaged * 12) * dt;
        }

        // Limitador de corte (Two-Step / Redline)
        if (this.rpm >= this.engine.redlineRpm) {
            this.rpm = this.engine.redlineRpm - (Math.random() * 250);
            this.backfireTimer = 0.08;
        }
        this.rpm = Math.max(this.engine.idleRpm * 0.8, this.rpm);

        // 4. Calculo de Fuerzas (Potencia y Torque al asfalto)
        let tractionForce = 0;
        let engineTorque = this.engine.getTorqueAtRpm(this.rpm) * this.throttle;

        if (this.currentGear > 0 && clutchEngaged > 0.1) {
            // Torque transmitido a las ruedas
            const wheelTorque = engineTorque * totalGearRatio * clutchEngaged * 0.88; // 0.88 eficiencia transmision
            const driveForce = wheelTorque / this.config.tireRadiusM;

            // Limite de friccion de los neumaticos (Friccion maxima = Masa en eje motriz * g * Grip)
            const g = 9.81;
            let driveAxleWeightRatio = 0.5; // Reparto de peso
            if (this.config.drivetrain === "FWD") {
                driveAxleWeightRatio = 0.60; // 60% delante
                // Al acelerar fuerte, se transfiere peso atras (menos agarre en FWD)
                const weightTransfer = (driveForce / (this.config.massKg * g)) * 0.15;
                driveAxleWeightRatio = Math.max(0.35, driveAxleWeightRatio - weightTransfer);
            } else if (this.config.drivetrain === "RWD") {
                driveAxleWeightRatio = 0.50;
                // Al acelerar fuerte, se transfiere peso atras (mas agarre en RWD)
                const weightTransfer = (driveForce / (this.config.massKg * g)) * 0.20;
                driveAxleWeightRatio = Math.min(0.75, driveAxleWeightRatio + weightTransfer);
            }

            // Temperatura optima mejora el grip
            let tempGripMultiplier = 1.0;
            if (this.tireTemp >= 80 && this.tireTemp <= 110) {
                tempGripMultiplier = 1.25; // Gomas calientes = maximo agarre
            } else if (this.tireTemp > 130) {
                tempGripMultiplier = 0.85; // Quemadas
            }

            const maxTireGrip = (this.config.massKg * driveAxleWeightRatio * g) * (this.config.tireGripCoeff * tempGripMultiplier);

            if (driveForce > maxTireGrip) {
                // ¡PATINA! (Wheelspin)
                this.wheelSpin = (driveForce - maxTireGrip) / maxTireGrip;
                tractionForce = maxTireGrip * 0.85; // Friccion dinamica es menor que estatica
                this.tireTemp += dt * 40 * this.wheelSpin; // Calienta la goma
            } else {
                this.wheelSpin = 0;
                tractionForce = driveForce;
                this.tireTemp = Math.max(40, this.tireTemp - dt * 2); // Se enfria gradualmente
            }
        } else {
            this.wheelSpin = 0;
        }

        // 5. Resistencias (Aerodinamica + Rodadura)
        const airDensity = 1.225;
        const dragForce = 0.5 * airDensity * this.config.dragCoefficient * this.config.frontalAreaM2 * Math.pow(this.velocity, 2);
        const rollingResistance = this.config.massKg * 9.81 * 0.015;

        // 6. Segunda Ley de Newton: F = m * a  =>  a = F_neta / m
        const netForce = Math.max(0, tractionForce - dragForce - (this.velocity > 0.1 ? rollingResistance : 0));
        const acceleration = netForce / this.config.massKg;

        this.velocity += acceleration * dt;
        this.x += this.velocity * dt;

        // Generar particulas de humo de neumaticos si hay patinaje
        if (this.wheelSpin > 0.15) {
            this.emitTireSmoke();
        }
    }

    emitTireSmoke() {
        if (Math.random() < 0.6) {
            const wheelOffsetX = this.config.drivetrain === "FWD" ? 38 : -36;
            this.tireSmoke.push({
                x: this.x * 20 + wheelOffsetX, // Escala de metros a pixeles visuales
                y: this.laneY + 14,
                radius: 4 + Math.random() * 8,
                alpha: 0.8,
                vx: -15 - Math.random() * 20,
                vy: -5 - Math.random() * 10
            });
        }
    }
}
