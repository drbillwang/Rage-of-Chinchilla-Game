import pygame
from pygame import mixer
import csv
import asyncio
import math
import constants
from character import Character
from weapon import Weapon, Bullet
import weapon
from items import Item
from background import Background
from button import Button

mixer.init()
pygame.init()

# Game screen set up (width and height) with game name presented on the app
screen = pygame.display.set_mode((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT))
pygame.display.set_caption("Rage of the Chinchilla")

# create a clock to fix frame rate so things don't run too fast
clock = pygame.time.Clock()

# define game variables
map = 1
start_intro = False
pause_game = False
start_game = False
scroll_camera = [0, 0]

# Wave system variables - continuous spawning, no rigid waves
current_wave = 1
wave_enemies_spawned = 0
boss_spawned_this_wave = False
enemies_per_wave = 5
last_wave_time = 0
wave_in_progress = False
player_coins = 0
spawn_timer = 0
spawn_interval = 3000  # Spawn enemy every 3 seconds
difficulty_timer = 0
combo_count = 0
combo_timer = 0
combo_multiplier = 1.0
last_kill_time = 0

# Wave complete celebration
wave_complete = False
wave_complete_timer = 0
shop_phase = False  # After wave complete, show shop before next wave

# Countdown variables  
countdown_active = True
countdown_start_time = 0
countdown_value = 3

# Screen shake variables
screen_shake = 0
shake_intensity = 5

# Dash variables
dash_cooldown = 1000  # ms
last_dash_time = 0
dash_speed = 25
is_dashing = False
dash_duration = 100  # ms
dash_start_time = 0

# Weapon upgrade variables
weapon_level = 1
weapon_damage_bonus = 0
weapon_fire_rate_bonus = 0
has_laser_sight = False  # Laser aiming line

# Prevent shooting after button click
shoot_disabled_until = 0

# Star power-up variables
star_spawn_timer = 0
star_spawn_interval = 45000  # 45 seconds (was 20)
star_group = pygame.sprite.Group()

# Active power-up effects
power_invincible = False
power_invincible_timer = 0
power_multishot = False
power_multishot_timer = 0
power_purple = False
power_purple_timer = 0
POWER_DURATION = 10000  # 10 seconds

# definition - player movement variables >> they are triggers
move_left = False
move_right = False
move_up = False
move_down = False
dash_pressed = False

# define fonts
font = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", 20)
font_large = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", 36)
font_title = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", 80)
font_subtitle = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", 28)

# Visual effect variables
hurt_flash = 0  # Screen red flash when hit
particles = []  # Death/hit particles

# Particle class for visual effects
class Particle:
    def __init__(self, x, y, color, velocity, size=5, lifetime=30):
        self.x = x
        self.y = y
        self.color = color
        self.vx = velocity[0]
        self.vy = velocity[1]
        self.size = size
        self.lifetime = lifetime
        self.max_lifetime = lifetime
    
    def update(self, scroll):
        self.x += self.vx + scroll[0]
        self.y += self.vy + scroll[1]
        self.lifetime -= 1
        self.size = max(1, self.size * 0.95)
        return self.lifetime > 0
    
    def draw(self, surface):
        alpha = int(255 * (self.lifetime / self.max_lifetime))
        s = pygame.Surface((self.size * 2, self.size * 2), pygame.SRCALPHA)
        pygame.draw.circle(s, (*self.color, alpha), (self.size, self.size), int(self.size))
        surface.blit(s, (self.x - self.size, self.y - self.size))

def spawn_particles(x, y, color, count=10, speed=5):
    """Spawn explosion particles"""
    import random
    import math
    for _ in range(count):
        angle = random.uniform(0, 2 * math.pi)
        vel = random.uniform(2, speed)
        particles.append(Particle(
            x, y, color,
            (math.cos(angle) * vel, math.sin(angle) * vel),
            size=random.randint(3, 8),
            lifetime=random.randint(20, 40)
        ))

def draw_text_shadow(text, font, color, x, y, shadow_offset=2):
    """Draw text with shadow for depth"""
    shadow = font.render(text, True, (0, 0, 0))
    screen.blit(shadow, (x + shadow_offset, y + shadow_offset))
    img = font.render(text, True, color)
    screen.blit(img, (x, y))

def draw_gradient_rect(surface, color1, color2, rect):
    """Draw a horizontal gradient rectangle"""
    x, y, w, h = rect
    for i in range(w):
        ratio = i / w
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        pygame.draw.line(surface, (r, g, b), (x + i, y), (x + i, y + h))

def draw_health_bar_fancy(x, y, width, height, health, max_health):
    """Draw a fancy gradient health bar"""
    ratio = health / max_health
    # Background
    pygame.draw.rect(screen, (40, 40, 40), (x - 2, y - 2, width + 4, height + 4), border_radius=5)
    pygame.draw.rect(screen, (60, 60, 60), (x, y, width, height), border_radius=3)
    # Health bar with gradient based on health level
    if ratio > 0:
        bar_width = int(width * ratio)
        if ratio > 0.6:
            color1, color2 = (50, 205, 50), (100, 255, 100)
        elif ratio > 0.3:
            color1, color2 = (255, 200, 0), (255, 255, 100)
        else:
            color1, color2 = (220, 50, 50), (255, 100, 100)
        draw_gradient_rect(screen, color1, color2, (x, y, bar_width, height))
    # Shine effect
    pygame.draw.rect(screen, (255, 255, 255, 50), (x, y, width, height // 3), border_radius=3)




# scale images
def scale_image(image, scale):
    w = image.get_width()
    h = image.get_height()
    new_image = pygame.transform.scale(image, (w * scale, h * scale))
    return new_image

# music and sound
pygame.mixer.music.load("sound/music.mp3")
pygame.mixer.music.set_volume (0.5)
pygame.mixer.music.play(-1)

shot_fx = pygame.mixer.Sound("sound/shooting.mp3")
shot_fx.set_volume(0.5)

hit_fx = pygame.mixer.Sound("sound/hit.mp3")
hit_fx.set_volume(0.5)

portion_fx = pygame.mixer.Sound("sound/portion.mp3")
portion_fx.set_volume(0.5)




# button image
start_img = scale_image(pygame.image.load("images/buttons/start.png").convert_alpha(), constants.BUTTON_SCALE)
exit_img = scale_image(pygame.image.load("images/buttons/exit.png").convert_alpha(), constants.BUTTON_SCALE)
restart_img = scale_image(pygame.image.load("images/buttons/restart.png").convert_alpha(), constants.BUTTON_SCALE)
resume_img = scale_image(pygame.image.load("images/buttons/resume.png").convert_alpha(), constants.BUTTON_SCALE)



# load life image
life_image = scale_image(pygame.image.load("images/life/life.png").convert_alpha(), constants.LIFE_SCALE)

# load items images
money_image = []
for x in range(4):
    img = scale_image(pygame.image.load(f"images/items/money_f{x}.png").convert_alpha(), constants.MONEY_SCALE)
    money_image.append(img)

cola_image = scale_image(pygame.image.load("images/items/cola.png").convert_alpha(), constants.COLA_SCALE)

item_images = []
item_images.append(money_image)
item_images.append(cola_image)


# load weapon
gun_image = scale_image(pygame.image.load("images/weapons/0.png").convert_alpha(), constants.WEAPON_SCALE)
bullet_image = scale_image(pygame.image.load("images/weapons/bullet.png").convert_alpha(), constants.WEAPON_SCALE)
shooter_bullet_image = scale_image(pygame.image.load("images/weapons/shooter_bullet.png").convert_alpha(), constants.WEAPON_SCALE)


# load tilemap
tile_list = []
for x in range(constants.TILE_TYPES):
    tile_image = pygame.image.load(f"images/background/{x}.png").convert_alpha()
    tile_image = pygame.transform.scale(tile_image, (constants.TILE_SIZE, constants.TILE_SIZE))
    tile_list.append(tile_image)

# load player/enemies image
character_animations = []
character_types = ["smile", "antonio_zombie", "joker_zombie", "antonio_shooter", "joker_shooter"]
animation_type = ["normal", "dead"]
for character in character_types:
    # load images for different character and their status
    animation_list = []
    for animation in animation_type:
        # reset temporary list of images
        temp_list = []
        for i in range(4):
            player_image = pygame.image.load(f"images/characters/{character}/{animation}/{i}.png").convert_alpha()
            player_image = scale_image(player_image, constants.SCALE)
            temp_list.append(player_image)
        animation_list.append(temp_list)
    character_animations.append(animation_list)

# Load sunglasses version of player
sunglasses_animations = []
for animation in ["sunglasses", "dead"]:
    temp_list = []
    for i in range(4):
        img = pygame.image.load(f"images/characters/smile/{animation}/{i}.png").convert_alpha()
        img = scale_image(img, constants.SCALE)
        temp_list.append(img)
    sunglasses_animations.append(temp_list)


# draw text for kills
def draw_text(text, font, text_col, x, y):
    img = font.render(text, True, text_col)
    screen.blit(img, (x, y))


# Game info - Enhanced HUD
def draw_life():
    # Dark gradient panel background
    panel_surface = pygame.Surface((constants.WINDOW_WIDTH, 90), pygame.SRCALPHA)
    for y in range(90):
        alpha = int(200 - y * 1.5)
        pygame.draw.line(panel_surface, (20, 20, 35, alpha), (0, y), (constants.WINDOW_WIDTH, y))
    screen.blit(panel_surface, (0, 0))
    
    # Bottom border with glow
    pygame.draw.line(screen, (100, 100, 150), (0, 90), (constants.WINDOW_WIDTH, 90), 2)
    
    # Health bar (fancy gradient)
    draw_health_bar_fancy(15, 15, 200, 25, player.health, 100)
    draw_text_shadow(f"{player.health}/100", font, constants.WHITE, 85, 17)
    
    # Wave indicator (center, prominent)
    wave_text = f"WAVE {current_wave}"
    wave_surface = font_large.render(wave_text, True, (255, 215, 0))
    wave_rect = wave_surface.get_rect(center=(constants.WINDOW_WIDTH // 2, 30))
    # Glow effect
    glow_surface = font_large.render(wave_text, True, (255, 180, 0))
    screen.blit(glow_surface, (wave_rect.x + 1, wave_rect.y + 1))
    screen.blit(wave_surface, wave_rect)
    
    # Stats on right side with icons
    stats_x = constants.WINDOW_WIDTH - 180
    
    # Kills with skull emoji representation
    draw_text_shadow(f"Kills: {player.score}", font, (255, 100, 100), stats_x, 12)
    
    # Coins with gold color
    draw_text_shadow(f"Coins: {player_coins}", font, (255, 215, 0), stats_x, 35)
    
    # Weapon level
    weapon_color = (100, 200, 255) if weapon_level < 3 else (200, 100, 255) if weapon_level < 5 else (255, 50, 255)
    draw_text_shadow(f"Weapon Lv.{weapon_level}", font, weapon_color, stats_x, 58)
    
    # Combo counter (animated feel)
    if combo_count > 1:
        combo_size = min(30 + combo_count * 2, 50)
        combo_font = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", combo_size)
        combo_color = (255, 200, 0) if combo_count < 5 else (255, 100, 0) if combo_count < 10 else (255, 50, 50)
        combo_text = combo_font.render(f"x{combo_count} COMBO!", True, combo_color)
        combo_rect = combo_text.get_rect(center=(constants.WINDOW_WIDTH // 2, 70))
        screen.blit(combo_text, combo_rect)
    
    # Dash cooldown bar (bottom left, stylized)
    current_time = pygame.time.get_ticks()
    dash_ready = current_time - last_dash_time >= dash_cooldown
    bar_width = 120
    bar_height = 12
    bar_x = 15
    bar_y = 50
    
    # Background
    pygame.draw.rect(screen, (40, 40, 50), (bar_x - 2, bar_y - 2, bar_width + 4, bar_height + 4), border_radius=6)
    
    if dash_ready:
        # Ready - pulsing green
        pulse = abs(math.sin(current_time / 200)) * 50
        draw_gradient_rect(screen, (50, 200 + int(pulse), 50), (100, 255, 100), (bar_x, bar_y, bar_width, bar_height))
        draw_text_shadow("DASH READY!", font, (100, 255, 100), bar_x + bar_width + 10, bar_y - 3)
    else:
        progress = min((current_time - last_dash_time) / dash_cooldown, 1.0)
        draw_gradient_rect(screen, (50, 150, 200), (100, 200, 255), (bar_x, bar_y, int(bar_width * progress), bar_height))
        draw_text_shadow("DASH [SPACE]", font, (150, 150, 150), bar_x + bar_width + 10, bar_y - 3)


# create tile list
background_data = []
for row in range(constants.ROWS):
    r = [-1] * constants.COLS
    background_data.append(r)

# load csv for different maps
with open(f"maps/map{map}_data.csv", newline="") as csvfile:
    reader = csv.reader(csvfile, delimiter=",")
    for x, row in enumerate(reader):
        for y, tile in enumerate(row):
            background_data[x][y] = int(tile)

# load in map data and create world


background = Background()
background.process_data(background_data, tile_list, item_images, character_animations)

def reset_map():
    damage_group.empty()
    bullet_group.empty()
    item_group.empty()
    shooter_bullet_group.empty()

    # empty tile list
    data = []
    for row in range (constants.ROWS):
        r = [-1] * constants.COLS
        data.append(r)

    return data



# class text class
class DamageText(pygame.sprite.Sprite):
    def __init__(self, x, y, damage, color):
        pygame.sprite.Sprite.__init__(self)
        self.image = font.render(damage, True, color)
        self.rect = self.image.get_rect()
        self.rect.center = (x, y)
        self.counter = 0

    def update(self):
        # reposition based on screen scroll
        self.rect.x += scroll_camera[0]
        self.rect.y += scroll_camera[1]
        # move damage text up
        self.rect.y -= 2
        # delete counter after a few sec
        self.counter += 1
        if self.counter > 10:
            self.kill()

# Screen fading effect

class ScreenFade():
    def __init__ (self, direction, color, speed):
        self.direction = direction
        self. color = color
        self.speed = speed
        self.fade_counter = 0

    def fade (self):
        fade_complete = False
        self.fade_counter += self.speed
        if self.direction == 1:# outward moving for screen changes
            pygame.draw.rect(screen, self.color, (0 - self.fade_counter, 0, constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT))
            pygame.draw.rect(screen, self.color, (constants.WINDOW_WIDTH // 2 + self.fade_counter, 0, constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT))
        elif self.direction == 2:# outward moving after game over screen changes
            pygame.draw.rect(screen, self.color, (0, 0, constants.WINDOW_WIDTH, 0 + self.fade_counter))

        if self.fade_counter >= constants.WINDOW_WIDTH:
            fade_complete = True

        return fade_complete

# Create player
player = background.player

# Create enemy from background data



# Create weapon
gun = Weapon(gun_image, bullet_image)

# Don't use enemies from CSV - wave system will spawn them
enemy_list = []

# Generate decorative grass/flowers
import random
decorations = []
decoration_colors = [
    (34, 139, 34),   # Forest green
    (50, 205, 50),   # Lime green
    (144, 238, 144), # Light green
    (255, 182, 193), # Pink flower
    (255, 255, 100), # Yellow flower
    (255, 200, 100), # Orange flower
    (200, 150, 255), # Purple flower
]
for _ in range(150):
    dx = random.randint(constants.MAP_X_START + 50, constants.MAP_X_END - 50)
    dy = random.randint(constants.MAP_Y_START + 50, constants.MAP_Y_END - 50)
    deco_type = random.randint(0, 2)  # 0=grass, 1=small flower, 2=big flower
    color = random.choice(decoration_colors)
    decorations.append([dx, dy, deco_type, color])



# create damage / bullet group
damage_group = pygame.sprite.Group()
bullet_group = pygame.sprite.Group()
item_group = pygame.sprite.Group()
shooter_bullet_group = pygame.sprite.Group()

# Cola spawn timer
last_cola_spawn = 0
cola_spawn_interval = 25000  # 25 seconds (was 10)

def spawn_random_cola(obstacle_tiles=None):
    """Spawn a cola at random position in arena, avoiding walls"""
    margin = 150
    for _ in range(50):  # Try 50 times
        x = random.randint(margin, constants.WINDOW_WIDTH - margin)
        y = random.randint(margin + 100, constants.WINDOW_HEIGHT - margin)
        if obstacle_tiles is None or is_valid_spawn_position(x, y, obstacle_tiles):
            return Item(x, y, 1, [cola_image])
    # Fallback to center
    return Item(constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT // 2, 1, [cola_image])

def spawn_initial_colas(count=2, obstacle_tiles=None):
    """Spawn initial colas for wave start"""
    item_group.empty()  # Clear existing items
    for _ in range(count):
        cola = spawn_random_cola(obstacle_tiles)
        item_group.add(cola)

# Don't add items from CSV - we control cola spawning
spawn_initial_colas(2)  # Start with only 2 colas (was 5)

# Star power-up class
class Star(pygame.sprite.Sprite):
    def __init__(self, x, y, star_type):
        pygame.sprite.Sprite.__init__(self)
        self.star_type = star_type  # 0=red, 1=yellow, 2=purple
        self.spawn_time = pygame.time.get_ticks()
        
        # Colors: core and glow
        self.colors = [
            ((255, 80, 80), (255, 150, 150)),    # Red
            ((255, 220, 50), (255, 255, 150)),   # Gold
            ((200, 80, 255), (230, 150, 255))    # Purple
        ]
        self.color, self.glow_color = self.colors[star_type]
        
        self.base_image = self._create_star_image()
        self.image = self.base_image.copy()
        self.rect = self.image.get_rect()
        self.rect.center = (x, y)
    
    def _create_star_image(self):
        """Create a fancy star with glow effect"""
        size = 70
        image = pygame.Surface((size, size), pygame.SRCALPHA)
        center = size // 2
        
        # Outer glow
        for r in range(25, 10, -3):
            alpha = int(60 * (1 - (r - 10) / 15))
            glow_surf = pygame.Surface((size, size), pygame.SRCALPHA)
            pygame.draw.circle(glow_surf, (*self.glow_color, alpha), (center, center), r)
            image.blit(glow_surf, (0, 0))
        
        # Star shape points
        points = []
        for i in range(5):
            # Outer point
            angle = math.radians(i * 72 - 90)
            points.append((center + 22 * math.cos(angle), center + 22 * math.sin(angle)))
            # Inner point
            angle = math.radians(i * 72 + 36 - 90)
            points.append((center + 10 * math.cos(angle), center + 10 * math.sin(angle)))
        
        # Draw star with gradient effect
        pygame.draw.polygon(image, self.color, points)
        
        # Inner highlight
        inner_points = []
        for i in range(5):
            angle = math.radians(i * 72 - 90)
            inner_points.append((center + 12 * math.cos(angle), center + 12 * math.sin(angle)))
            angle = math.radians(i * 72 + 36 - 90)
            inner_points.append((center + 6 * math.cos(angle), center + 6 * math.sin(angle)))
        pygame.draw.polygon(image, self.glow_color, inner_points)
        
        # Center sparkle
        pygame.draw.circle(image, (255, 255, 255), (center, center), 4)
        
        return image
    
    def update(self, scroll_camera, player):
        self.rect.x += scroll_camera[0]
        self.rect.y += scroll_camera[1]
        
        # Pulsing animation
        current_time = pygame.time.get_ticks()
        pulse = 1.0 + 0.15 * math.sin((current_time - self.spawn_time) / 150)
        
        # Scale the image for pulse effect
        new_size = int(70 * pulse)
        self.image = pygame.transform.scale(self.base_image, (new_size, new_size))
        old_center = self.rect.center
        self.rect = self.image.get_rect()
        self.rect.center = old_center
        
        # Check player collision
        if self.rect.colliderect(player.rect):
            self.kill()
            return self.star_type
        return None

def spawn_star(obstacle_tiles=None):
    """Spawn a random star power-up, avoiding walls"""
    margin = 150
    for _ in range(50):
        x = random.randint(margin, constants.WINDOW_WIDTH - margin)
        y = random.randint(margin + 100, constants.WINDOW_HEIGHT - margin)
        if obstacle_tiles is None or is_valid_spawn_position(x, y, obstacle_tiles):
            star_type = random.randint(0, 2)  # 0=red, 1=yellow, 2=purple
            return Star(x, y, star_type)
    # Fallback
    star_type = random.randint(0, 2)
    return Star(constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT // 2, star_type)




# screen fade
intro_fade = ScreenFade(1, constants.BACKGROUND, 16)
game_over_fade = ScreenFade(2, constants.BACKGROUND, 16)


# create fancy buttons (no images needed)
from button import FancyButton
start_button = FancyButton.start_button(constants.WINDOW_WIDTH // 2 - 110, constants.WINDOW_HEIGHT - 400)
exit_button = FancyButton.exit_button(constants.WINDOW_WIDTH // 2 - 110, constants.WINDOW_HEIGHT - 200)
restart_button = FancyButton.restart_button(constants.WINDOW_WIDTH // 2 - 110, constants.WINDOW_HEIGHT - 400)
resume_button = FancyButton.resume_button(constants.WINDOW_WIDTH // 2 - 110, constants.WINDOW_HEIGHT - 400)


# use a while loop as the main game loop for the game keep running
def is_valid_spawn_position(x, y, obstacle_tiles):
    """Check if position is NOT colliding with any obstacle"""
    # Create a rect for the spawn position (enemy size)
    test_rect = pygame.Rect(x - 48, y - 48, 96, 96)
    for obstacle in obstacle_tiles:
        if obstacle[1].colliderect(test_rect):
            return False
    return True

def spawn_enemy(wave, player_pos, is_boss=False, obstacle_tiles=None):
    """Spawn an enemy on screen, away from player, only in valid areas"""
    import random
    import math
    
    player_x, player_y = player_pos
    margin = 100
    
    # Try up to 50 times to find a valid spawn position
    for attempt in range(50):
        # Random distance 300-1000 pixels
        spawn_distance = random.randint(300, 1000)
        
        # Random angle
        angle = random.uniform(0, 2 * math.pi)
        
        # Calculate spawn position
        x = player_x + math.cos(angle) * spawn_distance
        y = player_y + math.sin(angle) * spawn_distance
        
        # Clamp to screen bounds
        x = max(margin, min(x, constants.WINDOW_WIDTH - margin))
        y = max(margin + 100, min(y, constants.WINDOW_HEIGHT - margin))
        
        # Check if position is valid (not in wall)
        if obstacle_tiles is None or is_valid_spawn_position(x, y, obstacle_tiles):
            break
    
    # Fallback: spawn at screen center if all attempts fail
    else:
        x = constants.WINDOW_WIDTH // 2
        y = constants.WINDOW_HEIGHT // 2
    
    if is_boss:
        # Boss spawns - alternates between zombie boss and shooter boss
        is_shooter_boss = (wave // constants.BOSS_SPAWN_WAVE) % 2 == 0
        base_health = constants.ENEMY_INITIAL_HEALTH * constants.BOSS_HEALTH_MULTIPLIER
        # Boss health scales with wave
        boss_health = base_health + wave * 50
        
        if is_shooter_boss:
            enemy = Character(x, y, boss_health, character_animations, 4, True, is_boss=True, boss_wave=wave)
        else:
            enemy = Character(x, y, boss_health, character_animations, 1, False, is_boss=True, boss_wave=wave)
        return enemy
    
    # Normal enemy
    shooter_chance = min(0.1 + wave * 0.05, 0.5)
    is_shooter = random.random() < shooter_chance
    enemy_health = constants.ENEMY_INITIAL_HEALTH + (wave - 1) * 20
    
    if is_shooter:
        enemy = Character(x, y, enemy_health, character_animations, 4, True)
    else:
        char_type = random.choice([1, 2])
        enemy = Character(x, y, enemy_health, character_animations, char_type, False)
    
    return enemy

def create_drop(x, y, obstacle_tiles=None):
    """Create a random drop at position, avoiding walls"""
    drop_chance = random.random()
    if drop_chance < 0.15:  # 15% coin (was 30%)
        item_type = 0
        item_img = money_image
    elif drop_chance < 0.20:  # 5% health (was 15%)
        item_type = 1
        item_img = [cola_image]
    else:
        return None
    
    # Check if position is valid, try nearby spots if not
    if obstacle_tiles and not is_valid_spawn_position(x, y, obstacle_tiles):
        for _ in range(20):
            nx = x + random.randint(-100, 100)
            ny = y + random.randint(-100, 100)
            if is_valid_spawn_position(nx, ny, obstacle_tiles):
                return Item(nx, ny, item_type, item_img)
        return None  # Can't find valid spot
    return Item(x, y, item_type, item_img)

async def main():
    global move_left, move_right, move_up, move_down, start_game, start_intro, pause_game, dash_pressed
    global player, enemy_list, background, background_data, scroll_camera
    global game_over_fade, intro_fade
    global current_wave, wave_enemies_spawned, enemies_per_wave, last_wave_time, wave_in_progress, boss_spawned_this_wave
    global screen_shake, player_coins, spawn_timer, spawn_interval
    global combo_count, combo_timer, combo_multiplier, last_kill_time
    global wave_complete, wave_complete_timer, shop_phase
    global last_dash_time, is_dashing, dash_start_time
    global weapon_level, weapon_damage_bonus, weapon_fire_rate_bonus, has_laser_sight
    global countdown_active, countdown_start_time, countdown_value
    global last_cola_spawn
    global star_spawn_timer, power_invincible, power_invincible_timer
    global power_multishot, power_multishot_timer, power_purple, power_purple_timer
    global hurt_flash, particles
    
    # Large countdown font
    countdown_font = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", 120)
    
    run = True
    while run:
        # control frame rate
        clock.tick(constants.FPS)

        if start_game == False:
            # Animated background
            current_time = pygame.time.get_ticks()
            
            # Dynamic gradient background
            for y in range(constants.WINDOW_HEIGHT):
                # Animated color shift
                shift = math.sin(current_time / 2000 + y / 100) * 10
                r = int(20 + shift)
                g = int(20 + shift / 2)
                b = int(40 + shift)
                pygame.draw.line(screen, (max(0, r), max(0, g), min(60, b)), (0, y), (constants.WINDOW_WIDTH, y))
            
            # Floating particles in background
            for i in range(20):
                px = (i * 100 + current_time // 20) % constants.WINDOW_WIDTH
                py = (i * 50 + int(math.sin(current_time / 1000 + i) * 30)) % constants.WINDOW_HEIGHT
                alpha = 50 + int(math.sin(current_time / 500 + i) * 30)
                s = pygame.Surface((6, 6), pygame.SRCALPHA)
                pygame.draw.circle(s, (255, 215, 0, alpha), (3, 3), 3)
                screen.blit(s, (px, py))
            
            # Title with glow effect
            title_text = "RAGE OF THE CHINCHILLA"
            
            # Glow layers
            for offset in range(3, 0, -1):
                glow_alpha = 80 - offset * 20
                glow_font = font_title
                glow_surface = glow_font.render(title_text, True, (255, 180, 0))
                glow_surface.set_alpha(glow_alpha)
                glow_rect = glow_surface.get_rect(center=(constants.WINDOW_WIDTH // 2 + offset, 130 + offset))
                screen.blit(glow_surface, glow_rect)
            
            # Main title
            title_surface = font_title.render(title_text, True, (255, 215, 0))
            title_rect = title_surface.get_rect(center=(constants.WINDOW_WIDTH // 2, 130))
            screen.blit(title_surface, title_rect)
            
            # Animated subtitle
            pulse = math.sin(current_time / 500) * 0.1 + 0.9
            subtitle_text = "Survive the endless waves!"
            subtitle_surface = font_subtitle.render(subtitle_text, True, (int(200 * pulse), int(200 * pulse), int(220 * pulse)))
            subtitle_rect = subtitle_surface.get_rect(center=(constants.WINDOW_WIDTH // 2, 200))
            screen.blit(subtitle_surface, subtitle_rect)
            
            # Controls box with border
            box_x = constants.WINDOW_WIDTH // 2 - 150
            box_y = 250
            box_w = 300
            box_h = 180
            
            # Box background
            box_surface = pygame.Surface((box_w, box_h), pygame.SRCALPHA)
            pygame.draw.rect(box_surface, (30, 30, 50, 200), (0, 0, box_w, box_h), border_radius=15)
            pygame.draw.rect(box_surface, (100, 100, 150, 150), (0, 0, box_w, box_h), width=2, border_radius=15)
            screen.blit(box_surface, (box_x, box_y))
            
            # Controls header
            controls_header = font_large.render("CONTROLS", True, (255, 215, 0))
            controls_rect = controls_header.get_rect(center=(constants.WINDOW_WIDTH // 2, box_y + 30))
            screen.blit(controls_header, controls_rect)
            
            # Control items with nice formatting
            controls = [
                ("WASD", "Move"),
                ("MOUSE", "Aim & Shoot"),
                ("SPACE", "Dash"),
                ("ESC", "Pause & Shop")
            ]
            for i, (key, action) in enumerate(controls):
                y_pos = box_y + 65 + i * 28
                # Key highlight
                key_surface = font.render(f"[{key}]", True, (100, 200, 255))
                screen.blit(key_surface, (box_x + 20, y_pos))
                # Action
                action_surface = font.render(action, True, (200, 200, 200))
                screen.blit(action_surface, (box_x + 120, y_pos))
            
            # Stylized buttons with hover effect
            mouse_pos = pygame.mouse.get_pos()
            
            # Start button area
            start_button.rect.center = (constants.WINDOW_WIDTH // 2, 480)
            start_hover = start_button.rect.collidepoint(mouse_pos)
            if start_hover:
                # Glow effect on hover
                glow = pygame.Surface((start_button.rect.width + 20, start_button.rect.height + 20), pygame.SRCALPHA)
                pygame.draw.rect(glow, (255, 215, 0, 50), glow.get_rect(), border_radius=10)
                screen.blit(glow, (start_button.rect.x - 10, start_button.rect.y - 10))
            
            # Exit button area
            exit_button.rect.center = (constants.WINDOW_WIDTH // 2, 560)
            exit_hover = exit_button.rect.collidepoint(mouse_pos)
            if exit_hover:
                glow = pygame.Surface((exit_button.rect.width + 20, exit_button.rect.height + 20), pygame.SRCALPHA)
                pygame.draw.rect(glow, (255, 100, 100, 50), glow.get_rect(), border_radius=10)
                screen.blit(glow, (exit_button.rect.x - 10, exit_button.rect.y - 10))
            
            if start_button.draw(screen):
                start_game = True
                start_intro = True
                countdown_active = True
                countdown_start_time = 0
                shoot_disabled_until = pygame.time.get_ticks() + 300
            if exit_button.draw(screen):
                run = False
            
            # Version/credit at bottom
            version_text = font.render("v1.0 - Made with Pygame", True, (80, 80, 100))
            screen.blit(version_text, (10, constants.WINDOW_HEIGHT - 30))
        else:
            # Handle countdown - but still allow player movement
            if countdown_active:
                current_time = pygame.time.get_ticks()
                if countdown_start_time == 0:
                    countdown_start_time = current_time
                
                elapsed = current_time - countdown_start_time
                countdown_value = 3 - (elapsed // 1000)
                
                if countdown_value <= 0:
                    # Countdown finished
                    countdown_active = False
                    wave_in_progress = True
                    countdown_start_time = 0
                    spawn_timer = current_time  # Reset spawn timer
            
            if pause_game == True:
                # Dark overlay on game
                overlay = pygame.Surface((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT), pygame.SRCALPHA)
                overlay.fill((20, 20, 30, 230))
                screen.blit(overlay, (0, 0))
                
                # Pause title
                pause_title = font_title.render("PAUSED", True, (255, 215, 0))
                pause_rect = pause_title.get_rect(center=(constants.WINDOW_WIDTH // 2, 120))
                screen.blit(pause_title, pause_rect)
                
                # Stats box
                stats_box_w, stats_box_h = 320, 160
                stats_box_x = constants.WINDOW_WIDTH // 2 - stats_box_w // 2
                stats_box_y = 180
                
                stats_box = pygame.Surface((stats_box_w, stats_box_h), pygame.SRCALPHA)
                pygame.draw.rect(stats_box, (40, 40, 60, 200), (0, 0, stats_box_w, stats_box_h), border_radius=10)
                pygame.draw.rect(stats_box, (100, 100, 150), (0, 0, stats_box_w, stats_box_h), width=2, border_radius=10)
                screen.blit(stats_box, (stats_box_x, stats_box_y))
                
                draw_text_shadow(f"Wave: {current_wave}", font_large, (255, 255, 255), stats_box_x + 30, stats_box_y + 25)
                draw_text_shadow(f"Kills: {player.score}", font_large, (255, 100, 100), stats_box_x + 30, stats_box_y + 70)
                draw_text_shadow(f"Coins: {player_coins}", font_large, (255, 215, 0), stats_box_x + 30, stats_box_y + 115)
                
                # Buttons
                resume_button.rect.center = (constants.WINDOW_WIDTH // 2, 380)
                exit_button.rect.center = (constants.WINDOW_WIDTH // 2, 460)
                
                if resume_button.draw(screen):
                    pause_game = False
                    shoot_disabled_until = pygame.time.get_ticks() + 300
                if exit_button.draw(screen):
                    run = False
            else:
                # control screen background
                screen.fill(constants.BACKGROUND)

                if player.alive:

                    # Player movement calculation
                    change_x = 0
                    change_y = 0
                    if move_left == True:
                        change_x = -constants.SPEED
                    if move_right == True:
                        change_x = constants.SPEED
                    if move_up == True:
                        change_y = -constants.SPEED
                    if move_down == True:
                        change_y = constants.SPEED

                    # Dash mechanic
                    current_time = pygame.time.get_ticks()
                    if dash_pressed and not is_dashing and current_time - last_dash_time >= dash_cooldown:
                        is_dashing = True
                        dash_start_time = current_time
                        last_dash_time = current_time
                    
                    if is_dashing:
                        if current_time - dash_start_time < dash_duration:
                            # Apply dash speed multiplier
                            if change_x != 0 or change_y != 0:
                                change_x = change_x * dash_speed / constants.SPEED if change_x != 0 else 0
                                change_y = change_y * dash_speed / constants.SPEED if change_y != 0 else 0
                            else:
                                # Dash in facing direction if not moving
                                change_x = dash_speed if not player.flip else -dash_speed
                            player.hit = False  # Invincible during dash
                        else:
                            is_dashing = False

                    # Move Player
                    scroll_camera = player.move(change_x, change_y, background.obstacle_tiles)

                    # Update player / enemy / camera / etc.
                    background.update(scroll_camera)
                    
                    # Update decoration positions with camera
                    for deco in decorations:
                        deco[0] += scroll_camera[0]
                        deco[1] += scroll_camera[1]
                    
                    # Combo system - reset if no kill in 2 seconds
                    current_time = pygame.time.get_ticks()
                    if combo_count > 0 and current_time - last_kill_time > 2000:
                        combo_count = 0
                        combo_multiplier = 1.0
                    
                    # Wave system - gradual spawning with increasing difficulty
                    max_enemies = min(5 + current_wave * 2, 25)  # Scale max enemies with wave, cap at 25
                    enemies_per_spawn = min(1 + current_wave // 2, 10)  # Spawn more enemies per batch, cap at 10
                    
                    if wave_in_progress:
                        alive_enemies = len([e for e in enemy_list if e.alive])
                        # Spawn enemies in batches
                        time_since_spawn = current_time - spawn_timer
                        if time_since_spawn >= spawn_interval and alive_enemies < max_enemies and wave_enemies_spawned < enemies_per_wave:
                            # Spawn multiple enemies at once based on wave
                            spawn_count = min(enemies_per_spawn, enemies_per_wave - wave_enemies_spawned, max_enemies - alive_enemies)
                            for _ in range(spawn_count):
                                new_enemy = spawn_enemy(current_wave, (player.rect.centerx, player.rect.centery), obstacle_tiles=background.obstacle_tiles)
                                enemy_list.append(new_enemy)
                                wave_enemies_spawned += 1
                            spawn_timer = current_time
                        
                        # Boss spawn logic (only once per wave):
                        # Wave 1-5: Boss every 3 waves (wave 3)
                        # Wave 6+: Boss every 2 waves, spawn 2 bosses
                        if not boss_spawned_this_wave and wave_enemies_spawned >= 1:
                            should_spawn_boss = False
                            boss_count = 1
                            
                            if current_wave >= 6:
                                # After wave 6: every 2 waves, 2 bosses
                                if current_wave % 2 == 0:
                                    should_spawn_boss = True
                                    boss_count = 2
                            else:
                                # Before wave 6: every 3 waves, 1 boss
                                if current_wave % constants.BOSS_SPAWN_WAVE == 0:
                                    should_spawn_boss = True
                                    boss_count = 1
                            
                            if should_spawn_boss:
                                for _ in range(boss_count):
                                    boss = spawn_enemy(current_wave, (player.rect.centerx, player.rect.centery), is_boss=True, obstacle_tiles=background.obstacle_tiles)
                                    enemy_list.append(boss)
                                boss_spawned_this_wave = True
                                screen_shake = 10 + boss_count * 5  # Bigger shake for more bosses
                    
                    # Wave complete celebration (1.5 seconds), then shop
                    if wave_complete:
                        if current_time - wave_complete_timer < 1500:
                            pass  # Show celebration animation
                        else:
                            wave_complete = False
                            shop_phase = True  # Enter shop phase
                    
                    for enemy in enemy_list:
                        # Save health before enemy AI (for invincibility check)
                        health_before = player.health
                        shooter_bullet = enemy.ai(player, background.obstacle_tiles, scroll_camera, shooter_bullet_image)
                        # Check if player took damage
                        if player.health < health_before:
                            if power_invincible:
                                player.health = health_before
                                player.hit = False
                            else:
                                hurt_flash = 50  # Trigger red flash
                        # Invincible: damage enemies on contact
                        if power_invincible and enemy.alive and player.rect.colliderect(enemy.rect):
                            enemy.health -= 50
                            enemy.hit = True
                            screen_shake = 3
                        if shooter_bullet:
                            # Handle boss shotgun (returns list of bullets)
                            if isinstance(shooter_bullet, list):
                                for b in shooter_bullet:
                                    shooter_bullet_group.add(b)
                            else:
                                shooter_bullet_group.add(shooter_bullet)
                        # Always update enemy (handles death animation etc)
                        enemy.update()
                        
                        if not enemy.alive and not hasattr(enemy, 'drop_spawned'):
                            # Enemy just died - spawn drop and add screen shake
                            enemy.drop_spawned = True
                            
                            if enemy.is_boss:
                                screen_shake = 15  # Big shake for boss death
                                # Big explosion particles for boss
                                spawn_particles(enemy.rect.centerx, enemy.rect.centery, (255, 100, 50), count=30, speed=8)
                                spawn_particles(enemy.rect.centerx, enemy.rect.centery, (255, 200, 0), count=20, speed=6)
                                # Boss drops multiple items and big coin reward
                                player_coins += 100 + current_wave * 20
                                for _ in range(5):
                                    drop = create_drop(
                                        enemy.rect.centerx + random.randint(-50, 50),
                                        enemy.rect.centery + random.randint(-50, 50),
                                        background.obstacle_tiles
                                    )
                                    if drop:
                                        item_group.add(drop)
                            else:
                                screen_shake = 5
                                # Death particles - red blood effect
                                spawn_particles(enemy.rect.centerx, enemy.rect.centery, (200, 50, 50), count=12, speed=5)
                                spawn_particles(enemy.rect.centerx, enemy.rect.centery, (255, 100, 100), count=8, speed=3)
                                drop = create_drop(enemy.rect.centerx, enemy.rect.centery, background.obstacle_tiles)
                                if drop:
                                    item_group.add(drop)
                            
                            # Combo system
                            current_time = pygame.time.get_ticks()
                            if current_time - last_kill_time < 2000:
                                combo_count += 1
                                combo_multiplier = 1.0 + combo_count * 0.1
                            else:
                                combo_count = 1
                                combo_multiplier = 1.0
                            last_kill_time = current_time
                            
                            # Bonus coins from combo (more for boss)
                            bonus_coins = int((5 if not enemy.is_boss else 25) * combo_multiplier)
                            player_coins += bonus_coins
                    
                    # Check wave completion AFTER processing enemies
                    # Count enemies that are truly alive (health > 0)
                    if wave_in_progress and not wave_complete:
                        alive_enemies = len([e for e in enemy_list if e.alive and e.health > 0])
                        if wave_enemies_spawned >= enemies_per_wave and alive_enemies == 0:
                            wave_in_progress = False
                            wave_complete = True
                            wave_complete_timer = current_time
                            last_wave_time = current_time
                            # Bonus coins for completing wave
                            player_coins += current_wave * 20

                    # Switch player to sunglasses when power-up active
                    if power_invincible or power_multishot or power_purple:
                        player.animation_list = sunglasses_animations
                    else:
                        player.animation_list = character_animations[0]
                    
                    player.update()
                    # Check if shooting is temporarily disabled (after button click)
                    can_shoot = pygame.time.get_ticks() > shoot_disabled_until
                    bullet = gun.update(player, can_shoot)
                    if bullet:
                        bullet_group.add(bullet)
                        shot_fx.play()
                        # Multishot: fire in 16 directions
                        if power_multishot:
                            for angle in range(0, 360, 22):  # 0, 22, 45, 67, 90... (16 directions)
                                extra_bullet = weapon.Bullet(bullet_image, player.rect.centerx, player.rect.centery, angle)
                                bullet_group.add(extra_bullet)
                    for bullet in bullet_group:
                        damage, damage_pos = bullet.update(scroll_camera, background.obstacle_tiles, enemy_list, weapon_damage_bonus, power_purple)
                        if damage:
                            damage_text = DamageText(damage_pos.centerx, damage_pos.y, str(-damage), constants.RED)
                            damage_group.add(damage_text)
                            hit_fx.play()
                            screen_shake = 3  # Add screen shake on hit
                    damage_group.update()
                    
                    # Update particles
                    particles[:] = [p for p in particles if p.update(scroll_camera)]
                    
                    def add_coins(amount):
                        global player_coins
                        player_coins += amount
                    
                    item_group.update(scroll_camera, player, portion_fx, add_coins)
                    # Save health before shooter bullets (for invincibility)
                    health_before_bullets = player.health
                    shooter_bullet_group.update(scroll_camera, background.obstacle_tiles, player)
                    if player.health < health_before_bullets:
                        if power_invincible:
                            player.health = health_before_bullets
                            player.hit = False
                        else:
                            hurt_flash = 50  # Trigger red flash
                    
                    # Spawn cola every 10 seconds
                    if current_time - last_cola_spawn >= cola_spawn_interval:
                        new_cola = spawn_random_cola(background.obstacle_tiles)
                        item_group.add(new_cola)
                        last_cola_spawn = current_time
                    
                    # Spawn star every 20 seconds after wave 3
                    if current_wave >= 3 and current_time - star_spawn_timer >= star_spawn_interval:
                        new_star = spawn_star(background.obstacle_tiles)
                        star_group.add(new_star)
                        star_spawn_timer = current_time
                    
                    # Update stars and check collection
                    for star in star_group:
                        collected = star.update(scroll_camera, player)
                        if collected is not None:
                            if collected == 0:  # Red - invincibility
                                power_invincible = True
                                power_invincible_timer = current_time
                            elif collected == 1:  # Yellow - multishot
                                power_multishot = True
                                power_multishot_timer = current_time
                            elif collected == 2:  # Purple - boss killer
                                power_purple = True
                                power_purple_timer = current_time
                    
                    # Check power-up expiration (30 seconds)
                    if power_invincible and current_time - power_invincible_timer >= POWER_DURATION:
                        power_invincible = False
                    if power_multishot and current_time - power_multishot_timer >= POWER_DURATION:
                        power_multishot = False
                    if power_purple and current_time - power_purple_timer >= POWER_DURATION:
                        power_purple = False
                    
                    # Apply invincibility effect
                    if power_invincible:
                        player.hit = False


                # Apply screen shake
                shake_offset_x = 0
                shake_offset_y = 0
                if screen_shake > 0:
                    import random
                    shake_offset_x = random.randint(-screen_shake, screen_shake)
                    shake_offset_y = random.randint(-screen_shake, screen_shake)
                    screen_shake -= 1

                # draw player on screen (with shake offset)
                background.draw(screen)
                
                # Draw decorations (grass and flowers)
                for deco in decorations:
                    dx, dy = int(deco[0]), int(deco[1])
                    # Only draw if on screen
                    if -20 < dx < constants.WINDOW_WIDTH + 20 and -20 < dy < constants.WINDOW_HEIGHT + 20:
                        if deco[2] == 0:  # Grass tuft
                            pygame.draw.line(screen, deco[3], (dx, dy), (dx - 3, dy - 8), 2)
                            pygame.draw.line(screen, deco[3], (dx, dy), (dx + 2, dy - 10), 2)
                            pygame.draw.line(screen, deco[3], (dx, dy), (dx + 5, dy - 7), 2)
                        elif deco[2] == 1:  # Small flower
                            pygame.draw.circle(screen, deco[3], (dx, dy), 3)
                            pygame.draw.line(screen, (34, 139, 34), (dx, dy + 3), (dx, dy + 10), 2)
                        else:  # Big flower
                            pygame.draw.circle(screen, deco[3], (dx, dy), 5)
                            pygame.draw.circle(screen, (255, 255, 200), (dx, dy), 2)
                            pygame.draw.line(screen, (34, 139, 34), (dx, dy + 5), (dx, dy + 15), 2)
                for enemy in enemy_list:
                    enemy.draw(screen)
                player.draw(screen)
                for bullet in bullet_group:
                    bullet.draw(screen)
                for shooter_bullet in shooter_bullet_group:
                    shooter_bullet.draw(screen)
                gun.draw(screen)
                
                # Draw laser sight if owned
                if has_laser_sight and player.alive:
                    mouse_x, mouse_y = pygame.mouse.get_pos()
                    # Calculate angle from player to mouse
                    dx = mouse_x - player.rect.centerx
                    dy = mouse_y - player.rect.centery
                    distance = math.sqrt(dx * dx + dy * dy)
                    if distance > 0:
                        # Normalize and extend the line
                        nx = dx / distance
                        ny = dy / distance
                        # Start point (gun position)
                        start_x = player.rect.centerx + nx * 30
                        start_y = player.rect.centery + ny * 30
                        # End point (extend to edge of screen)
                        end_x = start_x + nx * 800
                        end_y = start_y + ny * 800
                        # Draw laser line with glow effect
                        laser_surface = pygame.Surface((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT), pygame.SRCALPHA)
                        # Outer glow
                        pygame.draw.line(laser_surface, (255, 0, 0, 30), (start_x, start_y), (end_x, end_y), 8)
                        pygame.draw.line(laser_surface, (255, 0, 0, 60), (start_x, start_y), (end_x, end_y), 4)
                        # Core line
                        pygame.draw.line(laser_surface, (255, 50, 50, 150), (start_x, start_y), (end_x, end_y), 2)
                        screen.blit(laser_surface, (0, 0))
                
                damage_group.draw(screen)
                item_group.draw(screen)
                star_group.draw(screen)
                
                # Draw particles
                for p in particles:
                    p.draw(screen)
                
                # Player glow effect when powered up
                if power_invincible:
                    glow_surface = pygame.Surface((100, 100), pygame.SRCALPHA)
                    pulse = (math.sin(pygame.time.get_ticks() / 100) + 1) / 2
                    pygame.draw.circle(glow_surface, (255, 50, 50, int(80 * pulse)), (50, 50), 45)
                    screen.blit(glow_surface, (player.rect.centerx - 50, player.rect.centery - 50))
                elif power_multishot:
                    glow_surface = pygame.Surface((100, 100), pygame.SRCALPHA)
                    pulse = (math.sin(pygame.time.get_ticks() / 100) + 1) / 2
                    pygame.draw.circle(glow_surface, (255, 255, 50, int(60 * pulse)), (50, 50), 45)
                    screen.blit(glow_surface, (player.rect.centerx - 50, player.rect.centery - 50))
                elif power_purple:
                    glow_surface = pygame.Surface((100, 100), pygame.SRCALPHA)
                    pulse = (math.sin(pygame.time.get_ticks() / 100) + 1) / 2
                    pygame.draw.circle(glow_surface, (180, 50, 255, int(60 * pulse)), (50, 50), 45)
                    screen.blit(glow_surface, (player.rect.centerx - 50, player.rect.centery - 50))
                
                # Hurt flash effect (red screen edge when damaged)
                if hurt_flash > 0:
                    hurt_surface = pygame.Surface((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT), pygame.SRCALPHA)
                    hurt_alpha = min(hurt_flash * 3, 150)
                    # Red vignette effect
                    for i in range(50):
                        alpha = int(hurt_alpha * (1 - i / 50))
                        pygame.draw.rect(hurt_surface, (255, 0, 0, alpha), (i, i, constants.WINDOW_WIDTH - i*2, constants.WINDOW_HEIGHT - i*2), 1)
                    screen.blit(hurt_surface, (0, 0))
                    hurt_flash -= 2
                
                draw_life()
                
                # Draw active power-up indicators at bottom of screen
                power_y = constants.WINDOW_HEIGHT - 40
                power_x = 10
                if power_invincible:
                    remaining = (POWER_DURATION - (pygame.time.get_ticks() - power_invincible_timer)) // 1000
                    draw_text(f"INVINCIBLE: {remaining}s", font, (255, 50, 50), power_x, power_y)
                    power_x += 180
                if power_multishot:
                    remaining = (POWER_DURATION - (pygame.time.get_ticks() - power_multishot_timer)) // 1000
                    draw_text(f"MULTISHOT: {remaining}s", font, (255, 255, 0), power_x, power_y)
                    power_x += 180
                if power_purple:
                    remaining = (POWER_DURATION - (pygame.time.get_ticks() - power_purple_timer)) // 1000
                    draw_text(f"BOSS KILLER: {remaining}s", font, (180, 50, 255), power_x, power_y)
                
                # Draw countdown overlay (player can still move)
                if countdown_active and countdown_value > 0:
                    current_time = pygame.time.get_ticks()
                    
                    # Semi-transparent overlay
                    overlay = pygame.Surface((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT), pygame.SRCALPHA)
                    overlay.fill((0, 0, 0, 100))
                    screen.blit(overlay, (0, 0))
                    
                    # Animated countdown number with scale effect
                    elapsed_in_second = (current_time - countdown_start_time) % 1000
                    scale_factor = 1.0 + (1.0 - elapsed_in_second / 1000) * 0.3
                    
                    countdown_size = int(120 * scale_factor)
                    countdown_font_animated = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", countdown_size)
                    
                    # Glow effect
                    for i in range(3):
                        glow = countdown_font_animated.render(str(countdown_value), True, (255, 180, 0))
                        glow.set_alpha(80 - i * 25)
                        glow_rect = glow.get_rect(center=(constants.WINDOW_WIDTH // 2 + i*2, constants.WINDOW_HEIGHT // 2 + i*2))
                        screen.blit(glow, glow_rect)
                    
                    countdown_text = countdown_font_animated.render(str(countdown_value), True, (255, 215, 0))
                    text_rect = countdown_text.get_rect(center=(constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT // 2))
                    screen.blit(countdown_text, text_rect)
                    
                    # Wave label with animation
                    wave_label = font_large.render(f"Wave {current_wave} Starting...", True, (255, 215, 0))
                    label_rect = wave_label.get_rect(center=(constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT // 2 + 100))
                    screen.blit(wave_label, label_rect)
                
                # Wave complete celebration - enhanced
                if wave_complete:
                    current_time = pygame.time.get_ticks()
                    
                    # Flash overlay
                    flash_alpha = max(0, 150 - (current_time - wave_complete_timer) // 5)
                    if flash_alpha > 0:
                        flash = pygame.Surface((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT), pygame.SRCALPHA)
                        flash.fill((255, 215, 0, flash_alpha))
                        screen.blit(flash, (0, 0))
                    
                    # Animated text
                    bounce = math.sin((current_time - wave_complete_timer) / 100) * 10
                    
                    # Glow layers
                    wave_font_big = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", 60)
                    for i in range(3):
                        glow_text = wave_font_big.render(f"WAVE {current_wave} COMPLETE!", True, (255, 200, 0))
                        glow_text.set_alpha(100 - i * 30)
                        glow_rect = glow_text.get_rect(center=(constants.WINDOW_WIDTH // 2 + i, constants.WINDOW_HEIGHT // 2 + bounce + i))
                        screen.blit(glow_text, glow_rect)
                    
                    wave_text = wave_font_big.render(f"WAVE {current_wave} COMPLETE!", True, (255, 215, 0))
                    text_rect = wave_text.get_rect(center=(constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT // 2 + bounce))
                    screen.blit(wave_text, text_rect)
                    
                    # Bonus coins with sparkle effect
                    bonus_text = font_large.render(f"+{current_wave * 20} coins!", True, (255, 255, 100))
                    bonus_rect = bonus_text.get_rect(center=(constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT // 2 + 60 + bounce / 2))
                    screen.blit(bonus_text, bonus_rect)
                
                # Shop phase between waves
                if shop_phase:
                    # Dark overlay
                    overlay = pygame.Surface((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT), pygame.SRCALPHA)
                    overlay.fill((20, 30, 20, 230))
                    screen.blit(overlay, (0, 0))
                    
                    # Shop title
                    shop_title = font_title.render("SHOP", True, (100, 255, 100))
                    shop_rect = shop_title.get_rect(center=(constants.WINDOW_WIDTH // 2, 80))
                    screen.blit(shop_title, shop_rect)
                    
                    # Wave info
                    next_wave_text = font_large.render(f"Preparing for Wave {current_wave + 1}", True, (255, 215, 0))
                    next_wave_rect = next_wave_text.get_rect(center=(constants.WINDOW_WIDTH // 2, 140))
                    screen.blit(next_wave_text, next_wave_rect)
                    
                    # Stats display
                    stats_y = 180
                    draw_text_shadow(f"Coins: {player_coins}", font_large, (255, 215, 0), constants.WINDOW_WIDTH // 2 - 80, stats_y)
                    draw_text_shadow(f"Health: {player.health}/100", font, (100, 255, 100) if player.health > 50 else (255, 200, 0) if player.health > 25 else (255, 100, 100), constants.WINDOW_WIDTH // 2 - 80, stats_y + 40)
                    
                    # Shop items box
                    box_w, box_h = 500, 300
                    box_x = constants.WINDOW_WIDTH // 2 - box_w // 2
                    box_y = 250
                    
                    shop_box = pygame.Surface((box_w, box_h), pygame.SRCALPHA)
                    pygame.draw.rect(shop_box, (40, 50, 40, 220), (0, 0, box_w, box_h), border_radius=15)
                    pygame.draw.rect(shop_box, (100, 200, 100), (0, 0, box_w, box_h), width=3, border_radius=15)
                    screen.blit(shop_box, (box_x, box_y))
                    
                    # Shop items
                    upgrade_cost = weapon_level * 50
                    health_cost = 30
                    full_heal_cost = 80
                    laser_cost = 200
                    
                    items_y = box_y + 20
                    
                    # Weapon upgrade
                    can_buy_weapon = player_coins >= upgrade_cost
                    weapon_color = (100, 255, 100) if can_buy_weapon else (100, 100, 100)
                    draw_text_shadow(f"[1] Weapon Upgrade (Lv.{weapon_level} -> Lv.{weapon_level + 1})", font, weapon_color, box_x + 30, items_y)
                    draw_text_shadow(f"    +10 Damage | Cost: {upgrade_cost} coins", font, weapon_color, box_x + 30, items_y + 22)
                    
                    # Health +20
                    can_buy_health = player_coins >= health_cost and player.health < 100
                    health_color = (100, 255, 100) if can_buy_health else (100, 100, 100)
                    draw_text_shadow(f"[2] Health +20 | Cost: {health_cost} coins", font, health_color, box_x + 30, items_y + 60)
                    
                    # Full heal
                    can_buy_full = player_coins >= full_heal_cost and player.health < 100
                    full_color = (100, 255, 100) if can_buy_full else (100, 100, 100)
                    draw_text_shadow(f"[3] Full Heal (100 HP) | Cost: {full_heal_cost} coins", font, full_color, box_x + 30, items_y + 95)
                    
                    # Laser sight
                    if has_laser_sight:
                        laser_color = (255, 215, 0)  # Gold - already owned
                        draw_text_shadow(f"[4] Laser Sight - OWNED", font, laser_color, box_x + 30, items_y + 130)
                    else:
                        can_buy_laser = player_coins >= laser_cost
                        laser_color = (255, 100, 100) if can_buy_laser else (100, 100, 100)
                        draw_text_shadow(f"[4] Laser Sight | Cost: {laser_cost} coins", font, laser_color, box_x + 30, items_y + 130)
                        draw_text_shadow(f"    Shows bullet trajectory (permanent)", font, laser_color, box_x + 30, items_y + 152)
                    
                    # Continue button hint
                    pulse = (math.sin(pygame.time.get_ticks() / 300) + 1) / 2
                    continue_text = font.render("Press [SPACE] or [ENTER] to Continue", True, (int(150 + 105 * pulse), int(255 * pulse), int(150 + 105 * pulse)))
                    continue_rect = continue_text.get_rect(center=(constants.WINDOW_WIDTH // 2, 580))
                    screen.blit(continue_text, continue_rect)

                # show game over screen
                if player.alive == False:
                    if game_over_fade.fade():
                        current_time = pygame.time.get_ticks()
                        
                        # Dark overlay with red tint
                        overlay = pygame.Surface((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT), pygame.SRCALPHA)
                        overlay.fill((40, 10, 10, 200))
                        screen.blit(overlay, (0, 0))
                        
                        # Animated "GAME OVER" with shake effect
                        shake_x = math.sin(current_time / 100) * 3
                        
                        # Glow effect for title
                        for i in range(3):
                            glow_color = (255, 50 + i * 30, 50 + i * 30)
                            glow_text = font_title.render("GAME OVER", True, glow_color)
                            glow_text.set_alpha(100 - i * 30)
                            glow_rect = glow_text.get_rect(center=(constants.WINDOW_WIDTH // 2 + shake_x + i, 120 + i))
                            screen.blit(glow_text, glow_rect)
                        
                        go_text = font_title.render("GAME OVER", True, (255, 50, 50))
                        go_rect = go_text.get_rect(center=(constants.WINDOW_WIDTH // 2 + shake_x, 120))
                        screen.blit(go_text, go_rect)
                        
                        # Stats box
                        box_w, box_h = 350, 180
                        box_x = constants.WINDOW_WIDTH // 2 - box_w // 2
                        box_y = 180
                        
                        stats_box = pygame.Surface((box_w, box_h), pygame.SRCALPHA)
                        pygame.draw.rect(stats_box, (30, 30, 40, 220), (0, 0, box_w, box_h), border_radius=15)
                        pygame.draw.rect(stats_box, (100, 80, 80), (0, 0, box_w, box_h), width=3, border_radius=15)
                        screen.blit(stats_box, (box_x, box_y))
                        
                        # Stats with icons/colors
                        stats_y = box_y + 25
                        
                        # Waves survived (trophy icon color)
                        wave_icon = font_large.render("🏆", True, (255, 215, 0))
                        survived_text = font_subtitle.render(f"Survived: {current_wave} Waves", True, (255, 215, 0))
                        survived_rect = survived_text.get_rect(center=(constants.WINDOW_WIDTH // 2, stats_y + 20))
                        screen.blit(survived_text, survived_rect)
                        
                        # Kills (skull color)
                        kills_text = font_subtitle.render(f"Total Kills: {player.score}", True, (255, 120, 120))
                        kills_rect = kills_text.get_rect(center=(constants.WINDOW_WIDTH // 2, stats_y + 70))
                        screen.blit(kills_text, kills_rect)
                        
                        # Coins (gold)
                        coins_text = font_subtitle.render(f"Coins Earned: {player_coins}", True, (255, 230, 100))
                        coins_rect = coins_text.get_rect(center=(constants.WINDOW_WIDTH // 2, stats_y + 120))
                        screen.blit(coins_text, coins_rect)
                        
                        # Buttons
                        restart_button.rect.center = (constants.WINDOW_WIDTH // 2, 420)
                        exit_button.rect.center = (constants.WINDOW_WIDTH // 2, 500)
                        mouse_pos = pygame.mouse.get_pos()
                        if restart_button.rect.collidepoint(mouse_pos):
                            glow = pygame.Surface((restart_button.rect.width + 30, restart_button.rect.height + 30), pygame.SRCALPHA)
                            pygame.draw.rect(glow, (100, 255, 100, 60), glow.get_rect(), border_radius=10)
                            screen.blit(glow, (restart_button.rect.x - 15, restart_button.rect.y - 15))
                        
                        if restart_button.draw(screen):
                            game_over_fade.fade_counter = 0
                            start_intro = True
                            shoot_disabled_until = pygame.time.get_ticks() + 300
                            # Reset wave system
                            current_wave = 1
                            wave_enemies_spawned = 0
                            boss_spawned_this_wave = False
                            enemies_per_wave = 5
                            wave_in_progress = False
                            wave_complete = False
                            shop_phase = False
                            countdown_active = True
                            countdown_start_time = 0
                            spawn_timer = 0
                            spawn_interval = 3000
                            combo_count = 0
                            combo_multiplier = 1.0
                            player_coins = 0
                            weapon_level = 1
                            weapon_damage_bonus = 0
                            has_laser_sight = False  # Reset laser sight on restart
                            # Reset power-ups
                            power_invincible = False
                            power_multishot = False
                            power_purple = False
                            star_group.empty()
                            star_spawn_timer = 0
                            
                            background_data = reset_map()
                            with open(f"maps/map{map}_data.csv", newline="") as csvfile:
                                reader = csv.reader(csvfile, delimiter=",")
                                for x, row in enumerate(reader):
                                    for y, tile in enumerate(row):
                                        background_data[x][y] = int(tile)
                            background = Background()
                            background.process_data(background_data, tile_list, item_images, character_animations)
                            player = background.player
                            player.health = constants.PLAYER_INITIAL_HEALTH
                            player.score = constants.INITIAL_KILL
                            enemy_list = []  # Start fresh, wave system will spawn enemies
                            # Reset colas
                            spawn_initial_colas(2, background.obstacle_tiles)
                            last_cola_spawn = pygame.time.get_ticks()

                        if exit_button.draw(screen):
                            run = False

                if start_intro == True:
                    if intro_fade.fade():
                        start_intro = False
                        intro_fade.fade_counter = 0

        # build event handler tracks exit, keyboard etc.
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_a:
                    move_left = True
                if event.key == pygame.K_d:
                    move_right = True
                if event.key == pygame.K_w:
                    move_up = True
                if event.key == pygame.K_s:
                    move_down = True
                if event.key == pygame.K_ESCAPE:
                    pause_game = True
                if event.key == pygame.K_SPACE:
                    dash_pressed = True
                    # Also continue from shop phase
                    if shop_phase:
                        shop_phase = False
                        current_wave += 1
                        wave_enemies_spawned = 0
                        boss_spawned_this_wave = False
                        enemies_per_wave = 5 + current_wave * 2
                        spawn_interval = max(1500, 3000 - current_wave * 100)
                        countdown_active = True
                        countdown_start_time = 0
                        spawn_initial_colas(2, background.obstacle_tiles)
                        last_cola_spawn = pygame.time.get_ticks()
                if event.key == pygame.K_RETURN:
                    # Enter also continues from shop
                    if shop_phase:
                        shop_phase = False
                        current_wave += 1
                        wave_enemies_spawned = 0
                        boss_spawned_this_wave = False
                        enemies_per_wave = 5 + current_wave * 2
                        spawn_interval = max(1500, 3000 - current_wave * 100)
                        countdown_active = True
                        countdown_start_time = 0
                        spawn_initial_colas(2, background.obstacle_tiles)
                        last_cola_spawn = pygame.time.get_ticks()
                
                # Shop purchase keys (work in shop phase)
                if event.key == pygame.K_1 and shop_phase:
                    upgrade_cost = weapon_level * 50
                    if player_coins >= upgrade_cost:
                        player_coins -= upgrade_cost
                        weapon_level += 1
                        weapon_damage_bonus += 10
                if event.key == pygame.K_2 and shop_phase:
                    if player_coins >= 30 and player.health < 100:
                        player_coins -= 30
                        player.health = min(player.health + 20, 100)
                if event.key == pygame.K_3 and shop_phase:
                    if player_coins >= 80 and player.health < 100:
                        player_coins -= 80
                        player.health = 100
                if event.key == pygame.K_4 and shop_phase:
                    if player_coins >= 200 and not has_laser_sight:
                        player_coins -= 200
                        has_laser_sight = True
                

            if event.type == pygame.KEYUP:
                if event.key == pygame.K_a:
                    move_left = False
                if event.key == pygame.K_d:
                    move_right = False
                if event.key == pygame.K_w:
                    move_up = False
                if event.key == pygame.K_s:
                    move_down = False
                if event.key == pygame.K_SPACE:
                    dash_pressed = False
        
        pygame.display.update()
        await asyncio.sleep(0)

    pygame.quit()

asyncio.run(main())
