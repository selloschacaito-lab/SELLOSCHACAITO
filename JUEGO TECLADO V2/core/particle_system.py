import random
import math
import pygame

class Particle:
    def __init__(self, x, y, color, vx, vy, life=30, size=3, shrink=True):
        self.x = x
        self.y = y
        self.color = color
        self.vx = vx
        self.vy = vy
        self.life = life
        self.max_life = life
        self.size = size
        self.shrink = shrink

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= 1

    def draw(self, surface):
        if self.life <= 0:
            return
        ratio = self.life / self.max_life
        curr_size = max(1, int(self.size * (ratio if self.shrink else 1)))
        alpha = int(255 * ratio)
        s = pygame.Surface((curr_size * 2, curr_size * 2), pygame.SRCALPHA)
        c = (self.color[0], self.color[1], self.color[2], alpha)
        pygame.draw.circle(s, c, (curr_size, curr_size), curr_size)
        surface.blit(s, (self.x - curr_size, self.y - curr_size))

class ParticleSystem:
    def __init__(self):
        self.particles = []

    def emit_burst(self, x, y, color, count=15, speed_mult=3.0, size=3):
        for _ in range(count):
            angle = random.uniform(0, math.tau)
            spd = random.uniform(1.0, speed_mult)
            vx = math.cos(angle) * spd
            vy = math.sin(angle) * spd
            life = random.randint(15, 35)
            self.particles.append(Particle(x, y, color, vx, vy, life, size))

    def emit_laser_trail(self, x, y, color):
        for _ in range(2):
            vx = random.uniform(-0.5, 0.5)
            vy = random.uniform(1.0, 3.0)
            self.particles.append(Particle(x, y, color, vx, vy, life=12, size=2))

    def update(self):
        for p in self.particles:
            p.update()
        self.particles = [p for p in self.particles if p.life > 0]

    def draw(self, surface):
        for p in self.particles:
            p.draw(surface)
