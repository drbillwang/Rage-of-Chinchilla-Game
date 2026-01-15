# This page tracks all the constant factors in the entire game
# For clean formatting we use capital letters for constants

# Frame per sec
FPS = 30

# Screen height and width
WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 600
TILE_SIZE = 16
TILE_TYPES = 8

# Player speed
SPEED = 6.5
BULLET_SPEED = 20
ANTONIO_SPEED = 3
ANTONIO_SPEED_RANDOM = 1
SHOOTER_BULLET_SPEED = 7

BULLET_SPEED_RANDOM = 1

WEAPON_OFFSET_X = 48
WEAPON_OFFSET_Y = 0

BULLET_OFFSET_X = 7
BULLET_OFFSET_Y = 0


# Scale factor
SCALE = 2
WEAPON_SCALE = 1
LIFE_SCALE = 3
MONEY_SCALE = 2
COLA_SCALE = 1
BUTTON_SCALE = 1

# colors

RED = (255, 0, 0)
WHITE = (255, 255, 255)
BACKGROUND = (40, 25, 25)
PANEL = (50, 50, 50)

#backgrounds

# Map size (must match CSV)
ROWS = 200
COLS = 200

SCROLL_EDGE = 150

CHARACTER_SIZE_X = 96
CHARACTER_SIZE_Y = 96

ENEMY_RANGE = 50
ENEMY_ATTACK_RANGE = 60
SHOOTER_SHOOTING_RANGE = 500

INITIAL_KILL = 0

PLAYER_INITIAL_HEALTH = 100
ENEMY_INITIAL_HEALTH = 100

SMILE_WEAPON = 50
SMILE_WEAPON_RANDOM = 5



# Arena boundaries (inside the actual walls from CSV)
# Walls: columns 0-2 and 197-199, rows 0-2 and 197-199
# Playable: columns 3-196, rows 3-196
# Each tile = 16 pixels
MAP_X_START = 16 * 3    # 48 pixels - first playable column
MAP_X_END = 16 * 197    # 3152 pixels - last playable column  
MAP_Y_START = 16 * 3    # 48 pixels - first playable row
MAP_Y_END = 16 * 197    # 3152 pixels - last playable row

# Arena center for player spawn
ARENA_CENTER_X = (MAP_X_START + MAP_X_END) // 2
ARENA_CENTER_Y = (MAP_Y_START + MAP_Y_END) // 2

# Boss settings
BOSS_SCALE = 2  # 2x size of normal enemies
BOSS_HEALTH_MULTIPLIER = 5  # 5x health
BOSS_SPEED_MULTIPLIER = 1.5  # 1.5x speed
BOSS_SPAWN_WAVE = 3  # Boss spawns every 3 waves