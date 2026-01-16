// Player class - handles player movement, animation, and state
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'player_normal_0');
        this.sprite.setScale(CONFIG.SCALE);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(10);
        
        // Player properties - Python: player.health = constants.PLAYER_INITIAL_HEALTH
        this.sprite.health = CONFIG.PLAYER_INITIAL_HEALTH;
        this.sprite.maxHealth = CONFIG.PLAYER_INITIAL_HEALTH;
        this.sprite.invulnerable = false;
        this.sprite.lastHitTime = 0;
        this.sprite.score = 0;
        
        // Animation
        this.sprite.animFrame = 0;
        this.sprite.animTimer = 0;
        
        // Movement
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        
        // Dash
        this.isDashing = false;
        this.dashStartTime = 0;
        this.lastDashTime = 0; // Will be synced with gameState
        
        // Store reference
        this.sprite.playerRef = this;
    }
    
    update(time, delta, keys, obstacleTiles) {
        let vx = 0;
        let vy = 0;
        const speed = CONFIG.PLAYER_SPEED;
        
        // Handle movement input
        if (keys.left.isDown) vx = -speed;
        if (keys.right.isDown) vx = speed;
        if (keys.up.isDown) vy = -speed;
        if (keys.down.isDown) vy = speed;
        
        // Handle dash
        if (!this.scene.gameState.shopPhase && Phaser.Input.Keyboard.JustDown(keys.dash) && !this.isDashing) {
            if (time - this.lastDashTime >= CONFIG.DASH_COOLDOWN) {
                this.isDashing = true;
                this.dashStartTime = time;
                this.lastDashTime = time;
            }
        }
        
        // Apply dash mechanic
        if (this.isDashing) {
            if (time - this.dashStartTime < CONFIG.DASH_DURATION) {
                if (vx !== 0 || vy !== 0) {
                    vx = vx * CONFIG.DASH_SPEED / CONFIG.PLAYER_SPEED;
                    vy = vy * CONFIG.DASH_SPEED / CONFIG.PLAYER_SPEED;
                } else {
                    const dashDir = this.sprite.flipX ? -1 : 1;
                    vx = CONFIG.DASH_SPEED * dashDir;
                }
                this.sprite.invulnerable = true;
            } else {
                this.isDashing = false;
                if (!this.scene.gameState.powerInvincible) {
                    this.sprite.invulnerable = false;
                }
            }
        }
        
        // Diagonal normalization - Python: sqrt(2)/2 = 0.707
        // Python: normalization happens in character.move() but should be applied BEFORE movement
        // Apply normalization BEFORE calculating movement to ensure consistent speed
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707; // math.sqrt(2) / 2
            vy *= 0.707;
        }
        
        // Check collision before moving
        // Python: move() applies change_x and change_y directly (per-frame movement)
        // Python: SPEED = 6.5 pixels/frame at 30 FPS
        // JS: PLAYER_SPEED = 195 pixels/sec = 6.5 * 30
        // Use delta time for frame-rate independent movement
        const frameTime = delta / 1000; // Convert to seconds
        const newX = this.sprite.x + vx * frameTime;
        const newY = this.sprite.y + vy * frameTime;
        
        // Only move if no collision
        if (!this.checkObstacleCollision(newX, this.sprite.y, obstacleTiles)) {
            this.sprite.x = newX;
        }
        if (!this.checkObstacleCollision(this.sprite.x, newY, obstacleTiles)) {
            this.sprite.y = newY;
        }
        
        // Set velocity for physics (use normalized values if diagonal)
        this.sprite.setVelocity(vx, vy);
        
        // Flip sprite based on direction
        if (vx < 0) this.sprite.setFlipX(true);
        else if (vx > 0) this.sprite.setFlipX(false);
        
        // Animation
        this.sprite.animTimer += delta;
        if (this.sprite.animTimer > CONFIG.ANIMATION_COOLDOWN * 2.5) { // 150ms = 60ms * 2.5 at 30fps
            this.sprite.animFrame = (this.sprite.animFrame + 1) % 4;
            const hasPowerUp = this.scene.gameState.powerInvincible || 
                              this.scene.gameState.powerMultishot || 
                              this.scene.gameState.powerPurple;
            const texKey = hasPowerUp 
                ? `player_sunglasses_${this.sprite.animFrame}`
                : `player_normal_${this.sprite.animFrame}`;
            if (this.scene.textures.exists(texKey)) {
                this.sprite.setTexture(texKey);
            }
            this.sprite.animTimer = 0;
        }
        
        // Invulnerability after hit
        if (this.sprite.invulnerable && !this.isDashing && !this.scene.gameState.powerInvincible) {
            if (time - this.sprite.lastHitTime > CONFIG.PLAYER_HIT_COOLDOWN) {
                this.sprite.invulnerable = false;
                this.sprite.setAlpha(1);
            } else {
                // Flash effect
                this.sprite.setAlpha(Math.sin(time / 50) * 0.5 + 0.5);
            }
        }
        
        return this.sprite;
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
    
    takeDamage(amount, time) {
        if (this.sprite.invulnerable || this.scene.gameState.powerInvincible) {
            return false;
        }
        this.sprite.health -= amount;
        this.sprite.invulnerable = true;
        this.sprite.lastHitTime = time;
        return true;
    }
    
    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }
    get rect() { return this.sprite.getBounds(); }
    get alive() { return this.sprite.health > 0; }
    get health() { return this.sprite.health; }
    set health(val) { this.sprite.health = val; }
    get score() { return this.sprite.score; }
    set score(val) { this.sprite.score = val; }
}
