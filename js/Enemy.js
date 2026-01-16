// Enemy class - handles enemy AI, movement, and combat
class Enemy {
    constructor(scene, x, y, characterType, isShooter, isBoss, wave) {
        this.scene = scene;
        
        // Determine texture key - Python: character_types = ["smile", "antonio_zombie", "joker_zombie", "antonio_shooter", "joker_shooter"]
        // Index: 0=smile(player), 1=antonio_zombie, 2=joker_zombie, 3=antonio_shooter, 4=joker_shooter
        // Python logic:
        // - Normal zombie enemies: character_type=1 (antonio_zombie) ONLY
        // - Shooter enemies: character_type=4 (joker_shooter) ONLY
        // - Boss: character_type=1 (antonio_zombie) or character_type=4 (joker_shooter)
        let texKey;
        if (characterType === 1) {
            texKey = 'enemy_1_normal_0'; // antonio_zombie
        } else if (characterType === 4) {
            texKey = 'enemy_4j_normal_0'; // joker_shooter
        }
        
        // Create sprite
        const scale = isBoss ? CONFIG.BOSS_SCALE * CONFIG.SCALE : CONFIG.SCALE;
        this.sprite = scene.physics.add.sprite(x, y, texKey);
        this.sprite.setScale(scale);
        this.sprite.setDepth(9);
        
        // Enemy properties
        const baseHealth = CONFIG.ENEMY_HEALTH + (wave - 1) * 20;
        if (isBoss) {
            this.sprite.health = baseHealth * CONFIG.BOSS_HEALTH_MULTIPLIER + wave * 50;
        } else {
            this.sprite.health = baseHealth;
        }
        this.sprite.maxHealth = this.sprite.health;
        this.sprite.alive = true;
        this.sprite.isBoss = isBoss;
        this.sprite.isShooter = isShooter;
        this.sprite.characterType = characterType;
        this.sprite.lastShot = 0;
        this.sprite.hit = false;
        this.sprite.stunned = false;
        this.sprite.lastHit = 0;
        
        // Speed multiplier for boss
        this.sprite.speedMultiplier = 1.0;
        if (isBoss) {
            this.sprite.speedMultiplier = CONFIG.BOSS_SPEED_MULTIPLIER + Math.floor(wave / 3) * 0.2;
        }
        
        // Animation
        this.sprite.animFrame = 0;
        this.sprite.animTimer = 0;
        
        // Boss health bar - 完全移除（用户要求：boss 和普通敌人一样不显示血条）
        this.sprite.healthBar = null;
        
        // Store reference
        this.sprite.enemyRef = this;
    }
    
    update(time, player, obstacleTiles) {
        // Python: enemy.update() checks health and sets alive = False
        // Python: if self.health <= 0 and self.alive == True: self.alive = False, player.score += 1
        // Note: In Python, player.score is increased in enemy.update() for non-player characters
        // But we handle score increase in GameScene.enemyDeath() to match the flow
        if (this.sprite.health <= 0 && this.sprite.alive) {
            this.sprite.health = 0;
            this.sprite.alive = false;
            // Score will be increased in GameScene.enemyDeath() when dropSpawned is checked
        }
        
        if (!this.sprite.alive || this.sprite.health <= 0) {
            return null;
        }
        
        const dx = player.x - this.sprite.x;
        const dy = player.y - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Base speed with multiplier
        let baseSpeed = CONFIG.ENEMY_SPEED * this.sprite.speedMultiplier;
        const speedRandom = Phaser.Math.Between(-CONFIG.ENEMY_SPEED_RANDOM, CONFIG.ENEMY_SPEED_RANDOM);
        let speed = baseSpeed + speedRandom;
        
        // Determine movement range
        const moveRange = this.sprite.isShooter ? CONFIG.SHOOTER_SHOOTING_RANGE : CONFIG.ENEMY_RANGE;
        const attackRange = CONFIG.ENEMY_ATTACK_RANGE;
        
        // Movement
        if (dist > moveRange) {
            // Move towards player
            const vx = (dx / dist) * speed;
            const vy = (dy / dist) * speed;
            
            // Check collision
            const newX = this.sprite.x + vx * (16 / 1000);
            const newY = this.sprite.y + vy * (16 / 1000);
            
            if (!this.checkObstacleCollision(newX, this.sprite.y, obstacleTiles)) {
                this.sprite.x = newX;
            }
            if (!this.checkObstacleCollision(this.sprite.x, newY, obstacleTiles)) {
                this.sprite.y = newY;
            }
            
            this.sprite.setVelocity(vx, vy);
        } else {
            this.sprite.setVelocity(0, 0);
        }
        
        // Flip sprite
        this.sprite.setFlipX(dx < 0);
        
        // Melee attack
        let playerDamaged = false;
        if (!this.sprite.isShooter && dist < attackRange && 
            !player.sprite.invulnerable && !this.scene.gameState.powerInvincible) {
            if (player.takeDamage(CONFIG.ENEMY_MELEE_DAMAGE, time)) {
                playerDamaged = true;
                this.scene.gameState.screenShake = 5;
            }
        }
        
        // Shooter attack
        let bullet = null;
        if (this.sprite.isShooter && dist < CONFIG.SHOOTER_SHOOTING_RANGE) {
            const cooldown = this.sprite.isBoss ? 1500 : 1000;
            if (time - this.sprite.lastShot >= cooldown) {
                bullet = this.shoot(player);
                this.sprite.lastShot = time;
            }
        }
        
        // Invincible power-up damages enemies on contact
        if (this.scene.gameState.powerInvincible && 
            Phaser.Geom.Intersects.RectangleToRectangle(player.rect, this.sprite.getBounds())) {
            this.sprite.health -= 50;
            this.sprite.hit = true;
            this.scene.gameState.screenShake = 3;
        }
        
        // Stun handling
        if (this.sprite.stunned) {
            if (time - this.sprite.lastHit > CONFIG.ENEMY_STUN_COOLDOWN) {
                this.sprite.stunned = false;
            }
        }
        
        // Animation
        this.sprite.animTimer += 16;
        if (this.sprite.animTimer > CONFIG.ANIMATION_COOLDOWN * 2.5) {
            this.sprite.animFrame = (this.sprite.animFrame + 1) % 4;
            
            const status = this.sprite.alive ? 'normal' : 'dead';
            let texKey;
            
            // Python: character_types = ["smile", "antonio_zombie", "joker_zombie", "antonio_shooter", "joker_shooter"]
            // Only two enemy types are used:
            // - character_type=1: antonio_zombie (zombie enemies)
            // - character_type=4: joker_shooter (shooter enemies)
            if (this.sprite.characterType === 1) {
                texKey = `enemy_1_${status}_${this.sprite.animFrame}`; // antonio_zombie
            } else if (this.sprite.characterType === 4) {
                texKey = `enemy_4j_${status}_${this.sprite.animFrame}`; // joker_shooter
            }
            
            if (texKey && this.scene.textures.exists(texKey)) {
                this.sprite.setTexture(texKey);
            }
            this.sprite.animTimer = 0;
        }
        
        // Boss health bar - 完全移除（用户要求：boss 和普通敌人一样不显示血条）
        
        return { bullet, playerDamaged };
    }
    
    checkObstacleCollision(newX, newY, obstacleTiles) {
        if (!obstacleTiles) return false;
        
        const spriteRect = new Phaser.Geom.Rectangle(
            newX - this.sprite.width/2,
            newY - this.sprite.height/2,
            this.sprite.width,
            this.sprite.height
        );
        
        for (const obstacle of obstacleTiles) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(spriteRect, obstacle.rect)) {
                return true;
            }
        }
        return false;
    }
    
    shoot(player) {
        // Python: x_distance = target_x - x, y_distance = -(target_y - y)
        // Python: self.angle = math.degrees(math.atan2(x_distance, y_distance))
        const xDistance = player.x - this.sprite.x;
        const yDistance = -(player.y - this.sprite.y);
        const angleRad = Math.atan2(xDistance, yDistance);
        
        if (this.sprite.isBoss) {
            // Shotgun spread - Python: [-20, -10, 0, 10, 20]
            const bullets = [];
            for (let spread = -20; spread <= 20; spread += 10) {
                const spreadAngle = angleRad + Phaser.Math.DegToRad(spread);
                bullets.push({ x: this.sprite.x, y: this.sprite.y, angle: spreadAngle });
            }
            return bullets;
        } else {
            return { x: this.sprite.x, y: this.sprite.y, angle: angleRad };
        }
    }
    
    takeDamage(amount) {
        this.sprite.health -= amount;
        this.sprite.hit = true;
        this.sprite.stunned = true;
        this.sprite.lastHit = this.scene.time.now;
        
        if (this.sprite.health <= 0) {
            this.sprite.health = 0;
            this.sprite.alive = false;
        }
    }
    
    destroy() {
        // Boss health bar 已完全移除，不需要清理
        this.sprite.destroy();
    }
    
    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }
    get health() { return this.sprite.health; }
    get alive() { return this.sprite.alive; }
    get isBoss() { return this.sprite.isBoss; }
    get isShooter() { return this.sprite.isShooter; }
}
