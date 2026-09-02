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

    def draw_combat_hud(self, surface, theme, wpm, acc, combo, cpm, shields, max_shields, buffer_pct):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

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
        s_rect = pygame.Rect(460, 75, 520, 36)
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
        p_rect = pygame.Rect(460, 120, 520, 24)
        pygame.draw.rect(surface, (14, 18, 26), p_rect, border_radius=4)
        pygame.draw.rect(surface, (40, 50, 70), p_rect, 1, border_radius=4)

        buf_w = int((p_rect.width - 4) * (buffer_pct / 100.0))
        if buf_w > 0:
            pygame.draw.rect(surface, c_acc, (p_rect.x + 2, p_rect.y + 2, buf_w, p_rect.height - 4), border_radius=3)

        b_txt = self.font_small.render(f"BUFFER DESCARGADO: {int(buffer_pct)}%", True, (255, 255, 255))
        surface.blit(b_txt, (p_rect.centerx - b_txt.get_width() // 2, p_rect.centery - b_txt.get_height() // 2))
