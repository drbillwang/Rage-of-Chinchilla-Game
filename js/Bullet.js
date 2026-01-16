// Bullet classes - player bullets and enemy bullets
class PlayerBullet {
    constructor(scene, x, y, angleDeg, damageBonus, powerPurple) {
        this.scene = scene;
        this.damageBonus = damageBonus;
        this.powerPurple = powerPurple;
        
        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'bullet');
        this.sprite.setDepth(8);
        
        // Python: Bullet(image, x, y, angle) where angle is in degrees
        // Python: self.angle = angle - 90
        // Python: self.image = pygame.transform.rotate(self.original_image, self.angle)
        // pygame.transform.rotate rotates COUNTERCLOCKWISE
        // User says: if mouse is right horizontal, bullet should not rotate (0 degrees)
        //            if mouse is right-up 45 degrees, bullet should rotate 45 degrees COUNTERCLOCKWISE
        // Python: angle = atan2(x_dist, y_dist) in degrees
        //         For right horizontal: atan2(+, 0) = 90 degrees, so bullet angle = 90 - 90 = 0 degrees ✓
        //         For right-up 45: atan2(+, -) = 135 degrees, so bullet angle = 135 - 90 = 45 degrees ✓
        // Phaser's setRotation also rotates COUNTERCLOCKWISE (positive angle = counterclockwise)
        // But if bullet image default direction is different, we may need to adjust
        const pythonAngle = angleDeg - 90;
        const pythonAngleRad = Phaser.Math.DegToRad(pythonAngle);
        
        // Rotate bullet sprite to point in direction of travel
        // If rotation appears clockwise instead of counterclockwise, try negating the angle
        // But first, let's check if the issue is with the angle calculation itself
        // Python rotates counterclockwise, Phaser also rotates counterclockwise
        // So the angle should be correct, but if it's rotating the wrong way, we need to negate
        this.sprite.setRotation(-pythonAngleRad); // Negate to fix clockwise/counterclockwise issue
        
        // Python: dx = cos(radians(self.angle)) * BULLET_SPEED
        // Python: dy = -sin(radians(self.angle)) * BULLET_SPEED
        const bulletSpeed = CONFIG.BULLET_SPEED + 
            Phaser.Math.Between(-CONFIG.BULLET_SPEED_RANDOM, CONFIG.BULLET_SPEED_RANDOM);
        
        // Save velocity for resume after pause
        this.velocityX = Math.cos(pythonAngleRad) * bulletSpeed;
        this.velocityY = -Math.sin(pythonAngleRad) * bulletSpeed;
        
        this.sprite.setVelocity(this.velocityX, this.velocityY);
        
        // Calculate damage
        this.sprite.damage = CONFIG.BULLET_DAMAGE + 
            Phaser.Math.Between(-CONFIG.BULLET_DAMAGE_RANDOM, CONFIG.BULLET_DAMAGE_RANDOM) + 
            damageBonus;
        
        // Set bounds
        this.sprite.checkWorldBounds = true;
        this.sprite.outOfBoundsKill = true;
    }
    
    update(enemies, obstacleTiles) {
        if (!this.sprite.active) return null;
        
        // Check obstacle collision
        const bulletRect = this.sprite.getBounds();
        for (const obstacle of obstacleTiles) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(bulletRect, obstacle.rect)) {
                this.sprite.destroy();
                return null;
            }
        }
        
        // Check enemy collision - Python: enemy.rect.colliderect(self.rect)
        // Python: enemy.rect is pygame.Rect with fixed size (CHARACTER_SIZE_X x CHARACTER_SIZE_Y)
        // Boss is 2x size (CHARACTER_SIZE_X * BOSS_SCALE x CHARACTER_SIZE_Y * BOSS_SCALE)
        for (const enemy of enemies) {
            if (!enemy.sprite.alive) continue;
            
            // Create enemy rect matching Python's rect size
            const enemySize = enemy.sprite.isBoss 
                ? CONFIG.CHARACTER_SIZE_X * CONFIG.BOSS_SCALE 
                : CONFIG.CHARACTER_SIZE_X;
            const enemyRect = new Phaser.Geom.Rectangle(
                enemy.sprite.x - enemySize / 2,
                enemy.sprite.y - enemySize / 2,
                enemySize,
                enemySize
            );
            
            if (Phaser.Geom.Intersects.RectangleToRectangle(bulletRect, enemyRect)) {
                let damage = this.sprite.damage;
                
                // Purple power-up bonus
                if (this.powerPurple) {
                    if (enemy.isBoss) {
                        damage *= 3;
                    } else {
                        damage = enemy.health + 100; // One-shot kill
                    }
                }
                
                enemy.takeDamage(damage);
                const result = { damage, pos: enemyRect };
                this.sprite.destroy();
                return result;
            }
        }
        
        return null;
    }
}

class EnemyBullet {
    constructor(scene, x, y, angle) {
        this.scene = scene;
        
        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'shooter_bullet');
        this.sprite.setDepth(8);
        
        // Python: angle is calculated as atan2(x_distance, y_distance) where y_distance is negative
        // Python: self.angle = math.degrees(math.atan2(x_distance, y_distance))
        // For rotation, convert to degrees (Python uses degrees for rotation)
        const angleDeg = Phaser.Math.RadToDeg(angle);
        this.sprite.setRotation(angle);
        
        // Python: SHOOTER_BULLET_SPEED = 7, BULLET_SPEED_RANDOM = 1
        // Python: self.dx = math.sin(math.radians(self.angle)) * speed
        // Python: self.dy = - (math.cos(math.radians(self.angle)) * speed)
        const bulletSpeed = CONFIG.SHOOTER_BULLET_SPEED + 
            Phaser.Math.Between(-CONFIG.BULLET_SPEED_RANDOM, CONFIG.BULLET_SPEED_RANDOM);
        
        // Save velocity for resume after pause
        this.velocityX = Math.sin(angle) * bulletSpeed; // Python uses sin for dx
        this.velocityY = -Math.cos(angle) * bulletSpeed; // Python uses -cos for dy
        
        // angle is already in radians, use directly
        this.sprite.setVelocity(this.velocityX, this.velocityY);
        
        // Set bounds
        this.sprite.checkWorldBounds = true;
        this.sprite.outOfBoundsKill = true;
    }
    
    update(player, obstacleTiles) {
        if (!this.sprite.active) return false;
        
        // Check obstacle collision
        const bulletRect = this.sprite.getBounds();
        for (const obstacle of obstacleTiles) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(bulletRect, obstacle.rect)) {
                this.sprite.destroy();
                return false;
            }
        }
        
        // Check player collision
        if (Phaser.Geom.Intersects.RectangleToRectangle(bulletRect, player.rect)) {
            if (player.takeDamage(CONFIG.ENEMY_BULLET_DAMAGE, this.scene.time.now)) {
                this.scene.gameState.screenShake = 5;
                this.sprite.destroy();
                return true;
            }
        }
        
        return false;
    }
}
