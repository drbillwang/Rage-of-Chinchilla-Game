// Game Constants - 100% Match Python constants.py
const CONFIG = {
    // Frame rate - Python: FPS = 30
    FPS: 30,
    
    // Screen dimensions - Python: WINDOW_WIDTH = 1200, WINDOW_HEIGHT = 600
    WIDTH: 1200,
    HEIGHT: 600,
    
    // Tile settings - Python: TILE_SIZE = 16, TILE_TYPES = 8
    TILE_SIZE: 16,
    TILE_TYPES: 8,
    
    // Speeds (in pixels per second for Phaser, converted from per-frame values)
    // Python: SPEED = 6.5 pixels/frame at 30 FPS = 6.5 * 30 = 195 px/sec
    PLAYER_SPEED: 195,  // 6.5 * 30
    BULLET_SPEED: 600,  // 20 * 30
    BULLET_SPEED_RANDOM: 30,  // 1 * 30
    ENEMY_SPEED: 90,  // 3 * 30
    ENEMY_SPEED_RANDOM: 30,  // 1 * 30
    SHOOTER_BULLET_SPEED: 210,  // 7 * 30
    
    // Weapon offsets - Python: WEAPON_OFFSET_X = 48, WEAPON_OFFSET_Y = 0
    WEAPON_OFFSET_X: 48,
    WEAPON_OFFSET_Y: 0,
    BULLET_OFFSET_X: 7,
    BULLET_OFFSET_Y: 0,
    
    // Scale factors - Python: SCALE = 2, WEAPON_SCALE = 1, etc.
    SCALE: 2,
    WEAPON_SCALE: 1,
    LIFE_SCALE: 3,
    MONEY_SCALE: 2,
    COLA_SCALE: 1,
    BUTTON_SCALE: 1,
    
    // Colors - Python RGB values
    COLORS: {
        RED: 0xff0000,
        WHITE: 0xffffff,
        BACKGROUND: 0x281919,  // (40, 25, 25)
        PANEL: 0x323232  // (50, 50, 50)
    },
    
    // Map settings - Python: ROWS = 200, COLS = 200
    MAP_SIZE: 3200,  // 200 * 16
    ROWS: 200,
    COLS: 200,
    SCROLL_EDGE: 150,
    
    // Character size - Python: CHARACTER_SIZE_X = 96, CHARACTER_SIZE_Y = 96
    CHARACTER_SIZE_X: 96,
    CHARACTER_SIZE_Y: 96,
    
    // Enemy settings
    ENEMY_RANGE: 50,
    ENEMY_ATTACK_RANGE: 60,
    SHOOTER_SHOOTING_RANGE: 500,
    
    // Health values - Python: PLAYER_INITIAL_HEALTH = 100, ENEMY_INITIAL_HEALTH = 100
    PLAYER_INITIAL_HEALTH: 100,
    PLAYER_HEALTH: 100, // Alias for compatibility
    ENEMY_HEALTH: 100,
    
    // Weapon damage - Python: SMILE_WEAPON = 50, SMILE_WEAPON_RANDOM = 5
    BULLET_DAMAGE: 50,
    BULLET_DAMAGE_RANDOM: 5,
    
    // Arena boundaries - Python: MAP_X_START = 48, MAP_X_END = 3152, etc.
    MAP_X_START: 48,  // 16 * 3
    MAP_X_END: 3152,   // 16 * 197
    MAP_Y_START: 48,   // 16 * 3
    MAP_Y_END: 3152,   // 16 * 197
    ARENA_CENTER_X: 1600,  // (MAP_X_START + MAP_X_END) / 2
    ARENA_CENTER_Y: 1600,  // (MAP_Y_START + MAP_Y_END) / 2
    
    // Boss settings - Python values
    BOSS_SCALE: 2,
    BOSS_HEALTH_MULTIPLIER: 5,
    BOSS_SPEED_MULTIPLIER: 1.5,
    BOSS_SPAWN_WAVE: 3,
    
    // Dash settings - Python: dash_cooldown = 1000ms, dash_speed = 25, dash_duration = 100ms
    DASH_COOLDOWN: 1000,
    DASH_SPEED: 750,  // 25 * 30 FPS
    DASH_DURATION: 100,
    
    // Spawn intervals - Python: spawn_interval = 3000ms, cola_spawn_interval = 25000ms, star_spawn_interval = 45000ms
    SPAWN_INTERVAL: 3000,
    COLA_SPAWN_INTERVAL: 25000,
    STAR_SPAWN_INTERVAL: 45000,
    
    // Power-up duration - Python: POWER_DURATION = 10000ms (10 seconds)
    POWER_DURATION: 10000,
    
    // Cooldowns - Python: shot_cooldown = 100ms, hit_cooldown = 500ms, stun_cooldown = 100ms
    SHOT_COOLDOWN: 100,
    PLAYER_HIT_COOLDOWN: 500,
    ENEMY_STUN_COOLDOWN: 100,
    
    // Damage values - Python: player.health -= 20 for both melee and bullets
    ENEMY_MELEE_DAMAGE: 20,
    ENEMY_BULLET_DAMAGE: 20,
    
    // Animation cooldown - Python: animation_cooldown = 60ms
    ANIMATION_COOLDOWN: 60,
    
    // Initial values
    INITIAL_KILL: 0,
    INITIAL_COINS: 0,
    INITIAL_WAVE: 1
};
