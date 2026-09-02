// Modelo de curvas de motor y dinamica de vehiculo
export class EngineSpecs {
    constructor({ name, cylinders, displacement, maxHp, maxHpRpm, maxTorqueNm, maxTorqueRpm, redlineRpm, idleRpm }) {
        this.name = name;
        this.cylinders = cylinders;
        this.displacement = displacement; // Litros
        this.maxHp = maxHp;
        this.maxHpRpm = maxHpRpm;
        this.maxTorqueNm = maxTorqueNm;
        this.maxTorqueRpm = maxTorqueRpm;
        this.redlineRpm = redlineRpm;
        this.idleRpm = idleRpm || 900;
    }

    // Calcula el Torque disponible a determinadas RPM usando una aproximacion parabolica real
    getTorqueAtRpm(rpm) {
        if (rpm < 500) return 0;
        if (rpm > this.redlineRpm + 200) return 0; // Corte de inyeccion

        // Modelamos la curva de torque tipica de combustion interna
        const rpmNorm = (rpm - this.maxTorqueRpm) / 3000;
        let torqueFactor = Math.exp(-0.5 * Math.pow(rpmNorm, 2)); // Forma de campana
        
        // Base torque al ralenti
        let torque = this.maxTorqueNm * (0.6 + 0.4 * torqueFactor);

        // Caida pronunciada al superar la potencia maxima
        if (rpm > this.maxHpRpm) {
            const drop = (rpm - this.maxHpRpm) / (this.redlineRpm - this.maxHpRpm);
            torque *= (1 - 0.25 * drop);
        }

        return Math.max(0, torque);
    }

    getHorsepowerAtRpm(rpm) {
        const torque = this.getTorqueAtRpm(rpm);
        // HP = (Torque en Nm * RPM) / 7127
        return (torque * rpm) / 7127;
    }
}

export const PRESET_ENGINES = {
    CIVIC_D16: new EngineSpecs({
        name: "1.6L D16 VTEC (4 Cil)",
        cylinders: 4,
        displacement: 1.6,
        maxHp: 125,
        maxHpRpm: 6600,
        maxTorqueNm: 144,
        maxTorqueRpm: 5200,
        redlineRpm: 7200,
        idleRpm: 850
    }),
    MUSTANG_COYOTE_V8: new EngineSpecs({
        name: "5.0L Coyote V8 (8 Cil)",
        cylinders: 8,
        displacement: 5.0,
        maxHp: 435,
        maxHpRpm: 6500,
        maxTorqueNm: 542,
        maxTorqueRpm: 4250,
        redlineRpm: 7500,
        idleRpm: 750
    })
};

export const PRESET_CARS = {
    CIVIC: {
        id: "civic",
        name: "Kanso Civic EX 1.6",
        engineKey: "CIVIC_D16",
        massKg: 1080,
        drivetrain: "FWD", // Traccion delantera
        dragCoefficient: 0.32,
        frontalAreaM2: 1.95,
        tireRadiusM: 0.30, // Ruedas r15
        tireGripCoeff: 1.05, // Coeficiente friccion neumático calle
        gearRatios: [3.25, 1.90, 1.25, 0.91, 0.70], // 5 marchas
        reverseRatio: 3.15,
        finalDriveRatio: 4.25,
        color: "#1e88e5",
        accentColor: "#ffffff"
    },
    MUSTANG: {
        id: "mustang",
        name: "Pony GT 5.0 V8",
        engineKey: "MUSTANG_COYOTE_V8",
        massKg: 1680,
        drivetrain: "RWD", // Traccion trasera
        dragCoefficient: 0.34,
        frontalAreaM2: 2.22,
        tireRadiusM: 0.34, // Ruedas r19
        tireGripCoeff: 1.15,
        gearRatios: [3.65, 2.43, 1.69, 1.32, 1.00, 0.65], // 6 marchas
        reverseRatio: 3.38,
        finalDriveRatio: 3.55,
        color: "#e53935",
        accentColor: "#111111"
    }
};
