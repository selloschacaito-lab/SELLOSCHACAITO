import sys
import os

# Configurar UTF-8 en Windows para caracteres especiales y ASCII box drawing
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Asegurar que el directorio raíz esté en el PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.engine import GravyProtocolGame

def main():
    try:
        game = GravyProtocolGame()
        game.start()
    except KeyboardInterrupt:
        print("\n\n[GRAVY PROTOCOL] Sesión interrumpida por el usuario. ¡Hasta la próxima!")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR EN EL PROTOCOLO]: {e}")
        import traceback
        traceback.print_exc()
        input("\nPresiona Enter para cerrar...")

if __name__ == "__main__":
    main()
