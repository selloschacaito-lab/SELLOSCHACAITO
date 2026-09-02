import pygame

class TrophyRoomUI:
    """Vitrina holográfica de logros, estadísticas globales y pasaporte de operador."""

    def __init__(self):
        self.font_title = pygame.font.SysFont("consolas", 20, bold=True)
        self.font_sub = pygame.font.SysFont("consolas", 14, bold=True)
        self.font_item = pygame.font.SysFont("consolas", 12, bold=False)

    def draw(self, surface, theme, profile):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        # Título
        t = self.font_title.render("🎖️ PASAPORTE DE OPERADOR & VITRINA HOLOGRÁFICA DE TROFEOS", True, c_pri)
        surface.blit(t, (50, 40))

        st = profile.get("stats", {})
        ach = profile.get("achievements", {})

        # Tarjeta de Pasaporte a la izquierda
        card_rect = pygame.Rect(50, 90, 450, 540)
        pygame.draw.rect(surface, (16, 20, 30), card_rect, border_radius=8)
        pygame.draw.rect(surface, c_pri, card_rect, 2, border_radius=8)

        surface.blit(self.font_sub.render("─── TELEMETRÍA BIOMÉTRICA DE OPERADOR ───", True, c_sec), (card_rect.x + 20, card_rect.y + 20))
        
        lines = [
            f"NOMBRE OPERADOR:     {profile.get('name', 'Operator')}",
            f"RANGO ACTUAL:        {profile.get('active_title', 'Script Kiddie')}",
            f"NIVEL DE HACKER:     NIVEL {profile.get('level', 1)} ({profile.get('xp', 0):,} XP)",
            f"CRÉDITOS ACUMULADOS: {profile.get('points', 0):,} PTS",
            f"ESTADO DE GRAVY:     FASE {profile.get('gravy_stage', 1)} [AGI]",
            "",
            f"RÉCORD MÁXIMO WPM:   {st.get('best_wpm', 0.0):.1f} WPM",
            f"MEJOR RACHA COMBO:   {st.get('best_combo', 0)}x ACIERTOS",
            f"DRONES DESTRUIDOS:   {st.get('drones_destroyed', 0)} UNIDADES",
            f"JEFES DERROTADOS:    {st.get('bosses_defeated', 0)} / 5",
            f"TECLAS TOTALES:      {st.get('total_keystrokes', 0):,} PULSACIONES",
            f"SESIONES DE JUEGO:   {st.get('sessions_played', 0)} PARTIDAS"
        ]

        ly = card_rect.y + 60
        for l in lines:
            surface.blit(self.font_item.render(l, True, (220, 230, 245)), (card_rect.x + 25, ly))
            ly += 32

        # Galería de Trofeos a la derecha
        gal_rect = pygame.Rect(530, 90, 700, 540)
        pygame.draw.rect(surface, (16, 20, 30), gal_rect, border_radius=8)
        pygame.draw.rect(surface, (60, 70, 90), gal_rect, 1, border_radius=8)

        surface.blit(self.font_sub.render("─── MEDALLAS NEÓN & LOGROS DESBLOQUEABLES ───", True, c_acc), (gal_rect.x + 20, gal_rect.y + 20))

        trophies = [
            ("first_sync", "Primer Enlace", "Inicia la interfaz de Gravy Revolution."),
            ("drone_hunter_10", "Cazador de Drones", "Destruye 10 drones enemigos en combate."),
            ("drone_hunter_100", "As del Plasma", "Destruye 100 drones enemigos."),
            ("speed_40", "Reflejos de Banda Ancha", "Alcanza 40 WPM en combate."),
            ("speed_60", "Sobrecarga Cuántica", "Alcanza 60 WPM de mecanografía."),
            ("speed_80", "Velocidad Dios AGI", "Supera los 80 WPM con precisión quirúrgica."),
            ("combo_50", "Sincronización Neural", "Logra una racha ininterrumpida de 50 aciertos."),
            ("combo_100", "Flujo Holográfico", "Logra una racha ininterrumpida de 100 aciertos."),
            ("sector_1_clear", "Libertador del Subsuelo", "Derrota al Jefe del Sector 1."),
            ("sector_5_clear", "La Singularidad Vencida", "Derrota a la AGI en el Nexo Orbital."),
            ("cyber_blindfold", "Hacker Ciego", "Completa una misión con el Modo Velo Negro.")
        ]

        gy = gal_rect.y + 60
        for ach_id, name, desc in trophies:
            unlocked = ach.get(ach_id, False)
            icon = "🏆 [OBTENIDO]" if unlocked else "🔒 [BLOQUEADO]"
            col_icon = (0, 255, 160) if unlocked else (110, 120, 140)
            col_name = (255, 255, 255) if unlocked else (140, 150, 170)

            t_ic = self.font_sub.render(icon, True, col_icon)
            t_nm = self.font_sub.render(name, True, col_name)
            t_ds = self.font_item.render(desc, True, (150, 160, 180))

            surface.blit(t_ic, (gal_rect.x + 20, gy))
            surface.blit(t_nm, (gal_rect.x + 180, gy))
            surface.blit(t_ds, (gal_rect.x + 180, gy + 18))
            gy += 42

        # Salir
        surface.blit(self.font_item.render("[ESC / ENTER]: Volver al Menú Principal", True, (160, 170, 200)), (50, 655))
