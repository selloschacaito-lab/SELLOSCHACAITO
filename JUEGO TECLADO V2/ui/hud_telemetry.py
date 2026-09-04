import pygame
import math

class HUDTelemetry:
    """Renderiza WPM en tiempo real, velocímetro circular, barras de escudo y telemetría."""

    def __init__(self):
        self.font_big = pygame.font.SysFont("consolas", 22, bold=True)
        self.font_mid = pygame.font.SysFont("consolas", 14, bold=True)
        self.font_small = pygame.font.SysFont("consolas", 12, bold=False)

    def draw_top_bar(self, surface, theme, profile, mission_title="OPERACIÓN"):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        # Panel superior translúcido
        top_rect = pygame.Rect(20, 15, 1240, 52)
        pygame.draw.rect(surface, (14, 18, 26), top_rect, border_radius=6)
        pygame.draw.rect(surface, c_pri, top_rect, 2, border_radius=6)

        # Textos de estado
        t_mission = self.font_mid.render(f"⚡ MISIÓN: {mission_title}", True, c_sec)
        surface.blit(t_mission, (35, 24))

        pts = profile.get("points", 0)
        lvl = profile.get("level", 1)
        rango = profile.get("active_title", "Script Kiddie")
        t_stats = self.font_mid.render(f"CRÉDITOS: {pts:,} PTS │ NIVEL: {lvl} │ RANGO: {rango}", True, c_acc)
        surface.blit(t_stats, (1240 - t_stats.get_width() - 10, 24))

    def draw_combat_hud(self, surface, theme, wpm, acc, combo, cpm, shields, max_shields, buffer_pct, energy_pct=0.0, unlocked_skills=None, active_overclock=False):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]
        unlocked_skills = unlocked_skills or []

        # Panel de métricas biométricas
        m_rect = pygame.Rect(20, 75, 420, 80)
        pygame.draw.rect(surface, (14, 18, 26), m_rect, border_radius=6)
        pygame.draw.rect(surface, (40, 50, 70), m_rect, 1, border_radius=6)

        # WPM & Precisión
        txt_wpm = self.font_big.render(f"{wpm:4.1f} WPM", True, c_pri)
        surface.blit(txt_wpm, (35, 85))

        txt_acc = self.font_mid.render(f"PRECISIÓN: {acc:5.1f}%", True, c_acc)
        surface.blit(txt_acc, (35, 118))

        txt_combo = self.font_big.render(f"{combo}x", True, c_sec)
        surface.blit(txt_combo, (230, 85))
        txt_combo_lbl = self.font_small.render("RACHA COMBO", True, (160, 170, 190))
        surface.blit(txt_combo_lbl, (230, 118))

        txt_cpm = self.font_small.render(f"CPM: {cpm}", True, (200, 210, 230))
        surface.blit(txt_cpm, (330, 118))

        # Barra de Escudos del Operador
        s_rect = pygame.Rect(460, 75, 520, 32)
        pygame.draw.rect(surface, (14, 18, 26), s_rect, border_radius=4)
        pygame.draw.rect(surface, c_pri, s_rect, 1, border_radius=4)

        shield_ratio = max(0.0, min(1.0, shields / max(1, max_shields)))
        fill_w = int((s_rect.width - 6) * shield_ratio)
        bar_col = theme["correct"] if shield_ratio > 0.3 else theme["error"]
        if fill_w > 0:
            pygame.draw.rect(surface, bar_col, (s_rect.x + 3, s_rect.y + 3, fill_w, s_rect.height - 6), border_radius=3)

        s_txt = self.font_mid.render(f"ESCUDOS DEL CYBER-DECK: {int(shields)} / {max_shields}", True, (255, 255, 255))
        surface.blit(s_txt, (s_rect.centerx - s_txt.get_width() // 2, s_rect.centery - s_txt.get_height() // 2))

        # Barra de Progreso del Buffer
        p_rect = pygame.Rect(460, 112, 520, 20)
        pygame.draw.rect(surface, (14, 18, 26), p_rect, border_radius=4)
        pygame.draw.rect(surface, (40, 50, 70), p_rect, 1, border_radius=4)

        buf_w = int((p_rect.width - 4) * (buffer_pct / 100.0))
        if buf_w > 0:
            pygame.draw.rect(surface, c_acc, (p_rect.x + 2, p_rect.y + 2, buf_w, p_rect.height - 4), border_radius=3)

        b_txt = self.font_small.render(f"BUFFER DESCARGADO: {int(buffer_pct)}%", True, (255, 255, 255))
        surface.blit(b_txt, (p_rect.centerx - b_txt.get_width() // 2, p_rect.centery - b_txt.get_height() // 2))

        # Barra de Energía Cuántica (para Habilidades Activas)
        e_rect = pygame.Rect(460, 137, 520, 18)
        pygame.draw.rect(surface, (14, 18, 26), e_rect, border_radius=4)
        pygame.draw.rect(surface, (80, 40, 120), e_rect, 1, border_radius=4)

        clamped_e = max(0.0, min(100.0, energy_pct))
        ew = int((e_rect.width - 4) * (clamped_e / 100.0))
        if ew > 0:
            e_col = (180, 50, 255) if clamped_e < 75 else (0, 240, 255)
            pygame.draw.rect(surface, e_col, (e_rect.x + 2, e_rect.y + 2, ew, e_rect.height - 4), border_radius=3)

        e_txt = self.font_small.render(f"⚡ ENERGÍA CUÁNTICA: {int(clamped_e)}% (Escribe aciertos para recargar)", True, (255, 255, 255))
        surface.blit(e_txt, (e_rect.centerx - e_txt.get_width() // 2, e_rect.centery - e_txt.get_height() // 2))

        # Indicadores de Habilidades Activas
        skills_info = [
            ("emp_nova", "[ESPACIO] EMP NOVA (50%)", 50, (255, 215, 0)),
            ("time_overclock", "[L-SHIFT] OVERCLOCK (75%)" if not active_overclock else "⏳ OVERCLOCK ACTIVO!", 75, (0, 240, 255)),
            ("nano_shield", "[ALT] NANO-ESCUDO (100%)", 100, (0, 255, 140))
        ]

        sk_x = 460
        sk_w = 168
        for sk_id, sk_lbl, req_e, active_c in skills_info:
            has_sk = sk_id in unlocked_skills
            is_ready = has_sk and (clamped_e >= req_e)
            b_box = pygame.Rect(sk_x, 160, sk_w, 22)

            bg_c = (28, 36, 50) if is_ready else (14, 16, 22)
            border_c = active_c if is_ready else (60, 70, 85) if has_sk else (40, 45, 55)
            pygame.draw.rect(surface, bg_c, b_box, border_radius=4)
            pygame.draw.rect(surface, border_c, b_box, 1, border_radius=4)

            txt_c = active_c if is_ready else (150, 160, 180) if has_sk else (75, 80, 95)
            display_txt = sk_lbl if has_sk else "🔒 BLOQUEADO"
            s_render = self.font_small.render(display_txt, True, txt_c)
            surface.blit(s_render, (b_box.centerx - s_render.get_width() // 2, b_box.centery - s_render.get_height() // 2))

            sk_x += sk_w + 8
