import os
import sys
import subprocess

def build_exe():
    print("=" * 60)
    print(" COMPILADOR AUTÓNOMO: GRAVY PROTOCOL (.EXE CON PYINSTALLER)")
    print("=" * 60)

    try:
        import PyInstaller
    except ImportError:
        print("[!] Instalando PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--name=GravyProtocol",
        "--onefile",
        "--console",
        "--add-data=content;content",
        "--add-data=core;core",
        "--add-data=game;game",
        "--add-data=ui;ui",
        "main.py"
    ]

    print(f"\n[+] Ejecutando PyInstaller: {' '.join(cmd)}\n")
    res = subprocess.run(cmd)

    if res.returncode == 0:
        print("\n" + "=" * 60)
        print(" [ÉXITO] ¡Ejecutable generado con éxito en: dist/GravyProtocol.exe!")
        print("=" * 60)
    else:
        print("\n[ERROR] Falló la compilación de PyInstaller.")

if __name__ == "__main__":
    build_exe()
