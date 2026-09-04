import time
import json
from datetime import datetime

class AntigravityBot:
    def __init__(self):
        self.tasa_bcv = 43.50
        self.inventario = {"Trodat 4911": 50, "Trodat 4912": 30}
        self.ordenes_procesadas = 0

    def recibir_orden_whatsapp(self, mensaje):
        print(f"🤖 [IA] Analizando mensaje de cliente: '{mensaje}'")
        time.sleep(1)
        
        # Simulación de NLP
        if "4911" in mensaje:
            modelo = "Trodat 4911"
            precio_usd = 8
        elif "4912" in mensaje:
            modelo = "Trodat 4912"
            precio_usd = 10
        else:
            return "No entendí el modelo."

        precio_bs = precio_usd * self.tasa_bcv
        
        self.inventario[modelo] -= 1
        self.ordenes_procesadas += 1
        
        recibo = {
            "fecha": str(datetime.now()),
            "modelo": modelo,
            "total_usd": precio_usd,
            "total_bs": precio_bs,
            "status": "APROBADO"
        }
        
        print(f"✅ ¡Orden Procesada! Total: Bs. {precio_bs} | Inventario restante: {self.inventario[modelo]}")
        return json.dumps(recibo, indent=4)

if __name__ == '__main__':
    bot = AntigravityBot()
    print('Iniciando Sistema de Ventas IA...\n')
    print(bot.recibir_orden_whatsapp('Hola, quiero un sello 4911 por favor, pago por pago móvil.'))
