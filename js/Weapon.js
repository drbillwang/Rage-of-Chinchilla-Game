// Weapon class - handles weapon aiming and shooting
class Weapon {
    constructor(scene, playerSprite) {
        this.scene = scene;
        this.playerSprite = playerSprite;
        
        // Create weapon sprite
        this.sprite = scene.add.sprite(playerSprite.x, playerSprite.y, 'gun');
        this.sprite.setDepth(11);
        this.sprite.setScale(CONFIG.WEAPON_SCALE);
        this.sprite.setOrigin(0.5, 0.5);
        this.lastShot = 0;
        // Python: self.fired = False (prevents holding mouse to spam shoot)
        this.fired = false;
    }
    
    update(time, pointer, playerX, playerY, canShoot = true) {
        // Get world point from pointer
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const xDist = worldPoint.x - playerX;
        const yDist = worldPoint.y - playerY;
        
        // Python: weapon_angle calculation
        // Python: if x_dist < 0: weapon_angle = math.degrees(-math.atan2(x_dist, y_dist))
        // Python: else: weapon_angle = math.degrees(math.atan2(x_dist, y_dist))
        // Python: self.image = pygame.transform.rotate(self.original_image, self.weapon_angle)
        // Python: flipped_image = pygame.transform.flip(self.image, self.flip, False)
        let weaponAngle;
        let shouldFlip = false;
        
        const angleRad = Math.atan2(xDist, yDist);
        
        // Python: if x_dist < 0: flip=True, weapon_angle=-atan2(x_dist, y_dist)
        // Python: else: flip=False, weapon_angle=atan2(x_dist, y_dist)
        // Python: rotate(original, weapon_angle), then flip(rotated, flip, False)
        // Strictly match Python logic
        if (xDist < 0) {
            // Left side - Python: flip=True, weapon_angle=-atan2
            shouldFlip = true;
            weaponAngle = -angleRad; // Python: -math.atan2(x_dist, y_dist)
        } else {
            // Right side - Python: flip=False, weapon_angle=atan2
            shouldFlip = false;
            weaponAngle = angleRad; // Python: math.atan2(x_dist, y_dist)
        }
        
        // Set weapon position - Python: self.rect.center = player.rect.center
        // Python: weapon rect center = player rect center (they share the same center point)
        // The weapon image center should align with player center
        // In Phaser, setPosition sets sprite center (origin 0.5, 0.5)
        this.sprite.setPosition(
            playerX,
            playerY
        );
        
        // Rotate weapon - Python: pygame.transform.rotate rotates counterclockwise by DEGREES
        // Python: weapon_angle = math.degrees(math.atan2(x_dist, y_dist)) or -math.atan2(x_dist, y_dist)
        // Python: self.image = pygame.transform.rotate(self.original_image, self.weapon_angle)
        // Python: flipped_image = pygame.transform.flip(self.image, self.flip, False)
        // Python's weapon_angle is in DEGREES, Phaser's setRotation uses RADIANS
        // Convert weaponAngle (radians) to degrees, then back to radians for Phaser
        // This ensures the rotation matches Python exactly
        const weaponAngleDeg = Phaser.Math.RadToDeg(weaponAngle);
        const weaponAngleRad = Phaser.Math.DegToRad(weaponAngleDeg);
        
        // Python: rotate first, then flip horizontally
        // Python: self.image = pygame.transform.rotate(self.original_image, self.weapon_angle)
        // Python: flipped_image = pygame.transform.flip(self.image, self.flip, False)
        // pygame.transform.rotate rotates COUNTERCLOCKWISE
        // Phaser's setRotation also rotates COUNTERCLOCKWISE, but rotation direction differs by side
        // Left side: no negation needed (was correct before)
        // Right side: needs negation (was wrong before, now correct)
        // Reset flip state first to avoid compounding effects
        this.sprite.setFlipX(false);
        this.sprite.setFlipY(false);
        
        // Apply rotation (Python rotates by degrees, Phaser by radians)
        // Only negate for right side to match Python's rotation direction
        if (xDist >= 0) {
            // Right side: negate angle
            this.sprite.setRotation(-weaponAngleRad);
        } else {
            // Left side: don't negate (was correct before)
            this.sprite.setRotation(weaponAngleRad);
        }
        
        // Apply horizontal flip if needed (Python: flip=True means horizontal flip)
        // Python: pygame.transform.flip(image, flip, False) - first param is horizontal flip
        // If right side is reversed, try NOT flipping when shouldFlip is false
        this.sprite.setFlipX(shouldFlip);
        
        // Python: self.angle = math.degrees(math.atan2(x_dist, y_dist)) - for bullet direction
        const angle = Math.atan2(xDist, yDist);
        const angleDeg = Phaser.Math.RadToDeg(angle);
        
        // Shooting - Python: can_shoot and mouse_pressed[0] and fired == False and (time - last_shot)
        // Fix: Add proper shot cooldown check (Python code has bug - missing > shot_cooldown)
        let bullet = null;
        if (canShoot && pointer.isDown && !this.fired && (time - this.lastShot) >= CONFIG.SHOT_COOLDOWN) {
            bullet = angleDeg;
            this.fired = true;
            this.lastShot = time;
        }
        // Python: if mouse_pressed[0] == False: self.fired = False
        if (!pointer.isDown) {
            this.fired = false;
        }
        
        return { bullet, angleDeg };
    }
    
    drawLaserSight(angleDeg) {
        if (!this.scene.gameState.hasLaserSight) return;
        
        if (!this.laserLine) {
            this.laserLine = this.scene.add.graphics();
            // Python: Laser sight should be above player but below weapon
            // Player depth: 10, Weapon depth: 11, Laser depth: 10.5 (between them)
            this.laserLine.setDepth(10.5);
        }
        
        this.laserLine.clear();
        
        // Python: Calculate direction from player to mouse
        // Python: dx = mouse_x - player.rect.centerx, dy = mouse_y - player.rect.centery
        // Python: distance = sqrt(dx*dx + dy*dy), nx = dx/distance, ny = dy/distance
        // Python uses normalized direction vector, not angle
        // angleDeg is from atan2(xDist, yDist), which gives direction
        // For laser, we need to use the same direction as bullet flight (angleDeg)
        // But Python uses normalized vector, so we convert angleDeg to direction vector
        const angleRad = Phaser.Math.DegToRad(angleDeg);
        // Python: atan2(x_dist, y_dist) means: dx direction = sin(angle), dy direction = cos(angle)
        // But in Python, y increases downward, so we need to account for that
        // Python's atan2(x_dist, y_dist) gives angle where:
        // - x_dist positive (right) = angle positive
        // - y_dist positive (down) = angle positive
        // So direction vector: nx = sin(angle), ny = cos(angle) (for screen coordinates)
        const nx = Math.sin(angleRad);
        const ny = Math.cos(angleRad);
        
        // Python: Start point (gun position) - player.rect.centerx + nx * 30
        const startX = this.playerSprite.x + nx * 30;
        const startY = this.playerSprite.y + ny * 30;
        
        // Python: End point (extend to edge) - start_x + nx * 800
        const dist = 800;
        const endX = startX + nx * dist;
        const endY = startY + ny * dist;
        
        // Draw laser line with glow effect - Python: multiple layers
        // Outer glow
        this.laserLine.lineStyle(8, 0xff0000, 0.12); // (255, 0, 0, 30)
        this.laserLine.lineBetween(startX, startY, endX, endY);
        this.laserLine.lineStyle(4, 0xff0000, 0.24); // (255, 0, 0, 60)
        this.laserLine.lineBetween(startX, startY, endX, endY);
        // Core line
        this.laserLine.lineStyle(2, 0xff3232, 0.59); // (255, 50, 50, 150)
        this.laserLine.lineBetween(startX, startY, endX, endY);
    }
    
    clearLaserSight() {
        if (this.laserLine) {
            this.laserLine.clear();
        }
    }
}
