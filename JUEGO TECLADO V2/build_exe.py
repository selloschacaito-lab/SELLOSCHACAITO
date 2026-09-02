import os
import sys
import subprocess

def build():
    print("=" * 60)
    print(" COMPILADOR OFICIAL: GRAVY PROTOCOL REVOLUTION 2.0 (.EXE)")
    print("=" * 60)

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--name=GravyProtocolRevolution",
        "--onefile",
        "--windowed",
        "--add-data=core;core",
        "--add-data=game;game",
        "--add-data=ui;ui",
        "--add-data=content;content",
        "main_v2.py"
    ]

    print(f"\n[+] Compilando con PyInstaller...")
    res = subprocess.run(cmd)
    if res.returncode == 0:
        print("\n[OK] ¡Compilación exitosa en dist/GravyProtocolRevolution.exe!")
    else:
        print("\n[ERROR] Falló la compilación.")

if __name__ == "__main__":
    build()
