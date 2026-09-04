import pygame
from content.shop_catalog import BLACK_MARKET_CATALOG

class BlackMarketUI:
    """Interfaz gráfica interactiva para el Mercado Negro de 6 categorías."""

    def __init__(self):
        self.categories = [
            ("cyberdecks", "CYBER-DECKS"),
            ("lasers", "PROYECTILES LÁSER"),
            ("switches", "SWITCHES MECÁNICOS"),
            ("chips", "CHIPS DE OVERCLOCK"),
            ("gravy_skins", "SKINS DE GRAVY"),
            ("themes", "PALETAS NEÓN")
        ]
        self.current_cat_idx = 0
        self.selected_item_idx = 0
        self.font_title = pygame.font.SysFont("consolas", 20, bold=True)
        self.font_item = pygame.font.SysFont("consolas", 14, bold=True)
        self.font_desc = pygame.font.SysFont("consolas", 12, bold=False)

    def draw(self, surface, theme, profile, bosses_beaten=0):
        c_pri = theme["primary"]
        c_sec = theme["secondary"]
        c_acc = theme["accent"]

        # Encabezado
        title = self.font_title.render("🛒 MERCADO NEGRO CYBERPUNK // BÚFER DE MEJORAS DE ALTA GAMA", True, c_pri)
        surface.blit(title, (50, 40))

        pts = profile.get("points", 0)
        pts_txt = self.font_item.render(f"CRÉDITOS DISPONIBLES: {pts:,} PTS │ JEFES DERROTADOS: {bosses_beaten}/5", True, c_acc)
        surface.blit(pts_txt, (50, 75))

        # Pestañas de categorías superiores
        tab_x = 50
        for idx, (cat_key, cat_name) in enumerate(self.categories):
            is_active = (idx == self.current_cat_idx)
            tab_rect = pygame.Rect(tab_x, 110, 185, 34)
            pygame.draw.rect(surface, (25, 30, 42) if not is_active else c_sec, tab_rect, border_radius=4)
            pygame.draw.rect(surface, c_pri if is_active else (60, 70, 90), tab_rect, 1, border_radius=4)

            t_col = (255, 255, 255) if is_active else (150, 160, 180)
            txt = self.font_desc.render(f"[{idx+1}] {cat_name}", True, t_col)
            surface.blit(txt, (tab_rect.centerx - txt.get_width() // 2, tab_rect.centery - txt.get_height() // 2))
            tab_x += 195

        # Lista de artículos de la categoría activa
        cat_key = self.categories[self.current_cat_idx][0]
        items = BLACK_MARKET_CATALOG.get(cat_key, [])

        item_y = 170
        for idx, item in enumerate(items):
            is_sel = (idx == self.selected_item_idx)
            item_rect = pygame.Rect(50, item_y, 1180, 50)

            # Comprobar posesión y requisitos
            owned = False
            active = False
            if cat_key == "cyberdecks":
                owned = item["id"] in profile.get("owned_decks", ["deck_mk1"])
                active = profile.get("active_cyberdeck") == item["id"]
            elif cat_key == "lasers":
                owned = item["id"] in profile.get("owned_lasers", ["cyan"])
                active = profile.get("active_laser_skin") == item["id"]
            elif cat_key == "switches":
                owned = item["id"] in profile.get("owned_switches", ["blue"])
                active = profile.get("active_switch") == item["id"]
            elif cat_key == "chips":
                owned = item["id"] in profile.get("installed_chips", [])
                active = owned
            elif cat_key == "gravy_skins":
                owned = item["id"] in profile.get("owned_gravy_skins", ["classic"])
                active = profile.get("active_gravy_skin") == item["id"]
            elif cat_key == "themes":
                owned = item["id"] in profile.get("owned_themes", ["cyberpunk_neon"])
                active = profile.get("active_theme") == item["id"]

            req_sec = item.get("req_sector", 0)
            req_diff = item.get("req_difficulty", 0)
            diff_names = {3: "VETERANO", 4: "CYBER-ÉLITE", 5: "PROTOCOLO GRAVY"}
            max_d_beaten = max(profile.get("subsector_difficulty", {}).values(), default=0)

            boss_locked = bosses_beaten < req_sec
            diff_locked = max_d_beaten < req_diff

            bg_c = (20, 24, 34) if not is_sel else (32, 40, 58)
            border_c = c_acc if is_sel else (50, 60, 80)
            pygame.draw.rect(surface, bg_c, item_rect, border_radius=6)
            pygame.draw.rect(surface, border_c, item_rect, 2 if is_sel else 1, border_radius=6)

            # Nombre y descripción
            t_name = self.font_item.render(f"[{idx+1}] {item['name']}", True, c_pri if not is_sel else (255, 255, 255))
            surface.blit(t_name, (item_rect.x + 18, item_rect.y + 10))

            t_desc = self.font_desc.render(item["desc"], True, (160, 170, 190))
            surface.blit(t_desc, (item_rect.x + 18, item_rect.y + 28))

            # Estado / Precio
            if active:
                tag_t = self.font_item.render("✔ [EN USO]", True, (0, 255, 150))
            elif owned:
                tag_t = self.font_item.render("[ADQUIRIDO - Click o Enter para equipar]", True, (0, 220, 255))
            elif diff_locked:
                d_name = diff_names.get(req_diff, "Dificultad Alta")
                tag_t = self.font_item.render(f"🔒 [BLOQUEADO - Supera niveles en {d_name}]", True, (255, 60, 60))
            elif boss_locked:
                tag_t = self.font_item.render(f"🔒 [BLOQUEADO - Requiere vencer al Jefe del Sector {req_sec}]", True, (255, 60, 60))
            else:
                tag_t = self.font_item.render(f"💰 {item['price']:,} PTS [Enter para Comprar]", True, c_acc)

            surface.blit(tag_t, (item_rect.right - tag_t.get_width() - 20, item_rect.centery - tag_t.get_height() // 2))
            item_y += 62

        # Controles al pie
        foot_txt = self.font_desc.render("[TAB / 1-6]: Cambiar Categoría │ [Flechas Arriba/Abajo]: Seleccionar │ [ENTER]: Comprar/Equipar │ [ESC]: Salir", True, (160, 170, 200))
        surface.blit(foot_txt, (50, 670))
