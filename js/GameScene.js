// GameScene - Main game scene using modular components
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Fade in effect when scene starts
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        // Initialize game state - Python: all global variables
        this.gameState = {
            wave: 1,
            coins: 0,
            kills: 0,
            waveEnemiesSpawned: 0,
            enemiesPerWave: 5,
            bossSpawnedThisWave: false,
            waveInProgress: false,
            waveComplete: false,
            waveCompleteTimer: 0,
            shopPhase: false,
            paused: false,
            justResumed: false, // Flag to restore bullets after pause
            countdownActive: true,
            countdownValue: 3,
            countdownStartTime: 0,
            comboCount: 0,
            comboMultiplier: 1.0,
            lastKillTime: 0,
            weaponLevel: 1,
            weaponDamageBonus: 0,
            hasLaserSight: false,
            powerInvincible: false,
            powerInvincibleTimer: 0,
            powerMultishot: false,
            powerMultishotTimer: 0,
            powerPurple: false,
            powerPurpleTimer: 0,
            screenShake: 0,
            hurtFlash: 0,
            lastDashTime: 0,
            spawnTimer: 0,
            spawnInterval: 3000,
            colaSpawnTimer: 0,
            starSpawnTimer: 0,
            shootDisabledUntil: 0  // Python: shoot_disabled_until
        };
        
        // Set up world bounds
        this.physics.world.setBounds(0, 0, CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
        
        // Create background and map
        const mapText = this.cache.text.get('map1');
        this.background = new Background(this, mapText);
        
        // Create player
        const arenaCenterX = (CONFIG.MAP_X_START + CONFIG.MAP_X_END) / 2;
        const arenaCenterY = (CONFIG.MAP_Y_START + CONFIG.MAP_Y_END) / 2;
        this.player = new Player(this, arenaCenterX, arenaCenterY);
        
        // Add collision with walls
        this.background.walls.forEach(wall => {
            this.physics.add.collider(this.player.sprite, wall);
        });
        
        // Create weapon
        this.weapon = new Weapon(this, this.player.sprite);
        
        // Create groups for game objects
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.items = [];
        this.stars = [];
        this.particles = [];
        this.damageTexts = [];
        
        // Game over state - Python: game_over_fade
        this.gameOverShown = false;
        
        // Create HUD
        this.hud = new HUD(this);
        
        // Set up camera
        this.cameras.main.setBounds(0, 0, CONFIG.MAP_SIZE, CONFIG.MAP_SIZE);
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameraFollowing = true; // Track if camera is following
        
        // Set up input
        this.setupInput();
        
        // Spawn initial colas - Python: spawn_initial_colas(2)
        this.spawnCola();
        this.spawnCola();
        
        // Start countdown - Reset to ensure full 3 seconds
        // countdownStartTime will be set in update() when countdownActive is true and countdownStartTime is 0
        this.gameState.countdownActive = true;
        this.gameState.countdownValue = 3;
        this.gameState.countdownStartTime = 0; // Will be set in update() on first check
        
        // Sound effects - Python: volume 0.5
        this.shotSound = this.sound.add('shot', { volume: 0.5 });
        this.hitSound = this.sound.add('hit', { volume: 0.5 });
        this.potionSound = this.sound.add('potion', { volume: 0.5 });
    }
    
    setupInput() {
        // Keyboard - Python: WASD movement, SPACE dash, ESC pause
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            dash: Phaser.Input.Keyboard.KeyCodes.SPACE,
            pause: Phaser.Input.Keyboard.KeyCodes.ESC,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            four: Phaser.Input.Keyboard.KeyCodes.FOUR
        });
        
        // Pause
        this.input.keyboard.on('keydown-ESC', () => {
            if (!this.gameState.shopPhase && !this.gameState.countdownActive) {
                const wasPaused = this.gameState.paused;
                this.gameState.paused = !this.gameState.paused;
                if (this.gameState.paused) {
                    this.showPauseMenu();
                } else {
                    this.hidePauseMenu();
                    // Mark that we just resumed, so bullets can be restored
                    this.gameState.justResumed = true;
                }
            }
        });
        
        // Shop continue - Python: only ENTER key, not SPACE
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.gameState.shopPhase) {
                this.nextWave();
            }
        });
        
        // Shop purchases
        this.input.keyboard.on('keydown-ONE', () => this.buyUpgrade(1));
        this.input.keyboard.on('keydown-TWO', () => this.buyUpgrade(2));
        this.input.keyboard.on('keydown-THREE', () => this.buyUpgrade(3));
        this.input.keyboard.on('keydown-FOUR', () => this.buyUpgrade(4));
    }
    
    update(time, delta) {
        // Check game over FIRST - Python: if player.alive == False (only check once, after fade)
        // Python: game over check is inside the main game loop, after all updates
        // Stop ALL game updates immediately when player dies
        if (!this.player || !this.player.alive || this.player.health <= 0) {
            // Stop camera following
            if (this.cameraFollowing) {
                this.cameras.main.stopFollow();
                this.cameraFollowing = false;
            }
            // Stop physics IMMEDIATELY
            if (!this.physics.paused) {
                this.physics.pause();
            }
            // Stop all sprite movement
            if (this.player && this.player.sprite) {
                this.player.sprite.setVelocity(0, 0);
            }
            this.enemies.forEach(enemy => {
                if (enemy && enemy.sprite && enemy.sprite.body) {
                    enemy.sprite.setVelocity(0, 0);
                }
            });
            // Show game over screen (only once)
            if (!this.gameOverShown) {
                this.gameOver();
            }
            // Only update HUD to show game over screen
            if (this.hud && this.player) {
                this.hud.update(time, this.player, this.gameState);
            }
            return;
        }
        
        // Don't check during shop phase, countdown, or pause
        if (this.gameState.shopPhase || this.gameState.countdownActive || this.gameState.paused) {
            // These checks are handled below
        }
        
        // Paused - Python: pause_game == True, only show pause menu, no game updates
        // Python does NOT pause physics, it just skips the update loop
        // But user wants bullets to stop moving when paused (like enemies)
        if (this.gameState.paused) {
            // Stop camera following - Python: no player movement, no camera scroll
            if (this.cameraFollowing) {
                this.cameras.main.stopFollow();
                this.cameraFollowing = false;
            }
            // Python: Just stop updating game logic, don't pause physics
            // Stop player movement by setting velocity to 0 (but don't pause physics)
            if (this.player && this.player.sprite) {
                this.player.sprite.setVelocity(0, 0);
            }
            this.enemies.forEach(enemy => {
                if (enemy && enemy.sprite && enemy.sprite.body) {
                    enemy.sprite.setVelocity(0, 0);
                }
            });
            // Stop all bullets - user wants bullets to stop when paused
            this.playerBullets.forEach(bullet => {
                if (bullet && bullet.sprite && bullet.sprite.body) {
                    bullet.sprite.setVelocity(0, 0);
                }
            });
            this.enemyBullets.forEach(bullet => {
                if (bullet && bullet.sprite && bullet.sprite.body) {
                    bullet.sprite.setVelocity(0, 0);
                }
            });
            // Only update HUD to show pause menu
            this.hud.update(time, this.player, this.gameState);
            return;
        }
        
        // Shop phase - only update HUD, no game updates
        if (this.gameState.shopPhase) {
            // Stop camera following - Python: no player movement, no camera scroll
            if (this.cameraFollowing) {
                this.cameras.main.stopFollow();
                this.cameraFollowing = false;
            }
            // Python: Just stop updating game logic, don't pause physics
            // Stop player movement by setting velocity to 0 (but don't pause physics)
            if (this.player && this.player.sprite) {
                this.player.sprite.setVelocity(0, 0);
            }
            this.enemies.forEach(enemy => {
                if (enemy && enemy.sprite && enemy.sprite.body) {
                    enemy.sprite.setVelocity(0, 0);
                }
            });
            // Stop all bullets - user wants bullets to stop when in shop
            this.playerBullets.forEach(bullet => {
                if (bullet && bullet.sprite && bullet.sprite.body) {
                    bullet.sprite.setVelocity(0, 0);
                }
            });
            this.enemyBullets.forEach(bullet => {
                if (bullet && bullet.sprite && bullet.sprite.body) {
                    bullet.sprite.setVelocity(0, 0);
                }
            });
            // Only update HUD to show shop menu
            this.hud.update(time, this.player, this.gameState);
            return;
        }
        
        // Resume camera following if not paused and not in shop
        if (!this.cameraFollowing) {
            this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
            this.cameraFollowing = true;
        }
        
        // Resume bullet movement after pause - restore saved velocity
        // Only restore once when just resumed from pause
        if (this.gameState.justResumed && !this.gameState.paused && !this.gameState.shopPhase) {
            this.playerBullets.forEach(bullet => {
                if (bullet && bullet.sprite && bullet.sprite.body && bullet.velocityX !== undefined) {
                    bullet.sprite.setVelocity(bullet.velocityX, bullet.velocityY);
                }
            });
            this.enemyBullets.forEach(bullet => {
                if (bullet && bullet.sprite && bullet.sprite.body && bullet.velocityX !== undefined) {
                    bullet.sprite.setVelocity(bullet.velocityX, bullet.velocityY);
                }
            });
            this.gameState.justResumed = false; // Reset flag after restoring
        }
        
        // Handle countdown - Python: if countdown_start_time == 0: countdown_start_time = current_time
        if (this.gameState.countdownActive) {
            if (this.gameState.countdownStartTime === 0) {
                this.gameState.countdownStartTime = time;
            }
            const elapsed = time - this.gameState.countdownStartTime;
            this.gameState.countdownValue = 3 - Math.floor(elapsed / 1000);
            
            if (this.gameState.countdownValue <= 0) {
                // Python: countdown_start_time = 0 after countdown finishes
                this.gameState.countdownActive = false;
                this.gameState.waveInProgress = true;
                this.gameState.spawnTimer = time; // Reset spawn timer
                this.gameState.countdownStartTime = 0;
                this.hideCountdown();
            } else {
                this.showCountdown();
            }
        }
        
        // Update player - Python: only update if not paused and not in shop
        // Also skip if player is dead
        if (!this.gameState.paused && !this.gameState.shopPhase && this.player && this.player.alive) {
            this.player.lastDashTime = this.gameState.lastDashTime;
            this.player.update(time, delta, this.keys, this.background.obstacleTiles);
            this.gameState.lastDashTime = this.player.lastDashTime;
            
            // Update weapon - Python: can_shoot = time > shoot_disabled_until
            const pointer = this.input.activePointer;
            const canShoot = time > (this.gameState.shootDisabledUntil || 0);
            const weaponResult = this.weapon.update(time, pointer, this.player.x, this.player.y, canShoot);
            
            // Apply invulnerable flash effect to weapon (same as player)
            if (this.player.sprite.invulnerable && !this.player.isDashing && !this.gameState.powerInvincible) {
                // Match player's alpha flash effect
                this.weapon.sprite.setAlpha(Math.sin(time / 50) * 0.5 + 0.5);
            } else {
                // Reset weapon alpha when not invulnerable
                this.weapon.sprite.setAlpha(1);
            }
            
            // Shooting
            if (weaponResult.bullet !== null) {
                this.shoot(weaponResult.bullet);
                this.shotSound.play();
            }
            
            // Laser sight
            this.weapon.drawLaserSight(weaponResult.angleDeg);
        }
        
        // Update enemies - Python: only update if not paused and not in shop
        if (!this.gameState.paused && !this.gameState.shopPhase) {
            this.updateEnemies(time);
        }
        
        // Update bullets - Python: only update if not paused and not in shop
        if (!this.gameState.paused && !this.gameState.shopPhase) {
            this.updateBullets();
            
            // Update items and stars
            this.updateItems();
            
            // Update particles
            this.updateParticles();
            
            // Update damage texts
            this.updateDamageTexts();
            
            // Draw decorations
            this.background.drawDecorations();
            
            // Wave spawning
            if (this.gameState.waveInProgress) {
                this.updateWaveSpawning(time);
            }
        }
        
        // Check wave completion - Python: only if not paused and not in shop
        if (!this.gameState.paused && !this.gameState.shopPhase) {
            this.checkWaveComplete(time);
            
            // Spawn colas - Python: every 25 seconds
            if (time - this.gameState.colaSpawnTimer >= CONFIG.COLA_SPAWN_INTERVAL) {
                this.spawnCola();
                this.gameState.colaSpawnTimer = time;
            }
            
            // Spawn stars - Python: after wave 3, every 45 seconds
            if (this.gameState.wave >= 3 && time - this.gameState.starSpawnTimer >= CONFIG.STAR_SPAWN_INTERVAL) {
                this.spawnStar();
                this.gameState.starSpawnTimer = time;
            }
            
            // Update power-ups
            this.updatePowerUps(time);
        }
        
        // Update HUD
        this.hud.update(time, this.player, this.gameState);
        
        // Screen shake
        if (this.gameState.screenShake > 0) {
            this.cameras.main.shake(50, this.gameState.screenShake * 0.002);
            this.gameState.screenShake--;
        }
        
        // Combo decay - Python: reset after 2 seconds
        if (this.gameState.comboCount > 0 && time - this.gameState.lastKillTime > 2000) {
            this.gameState.comboCount = 0;
            this.gameState.comboMultiplier = 1.0;
        }
        
        // Hurt flash - Python: red vignette effect when hit
        if (this.gameState.hurtFlash > 0) {
            this.gameState.hurtFlash -= 2;
        }
        
        // Draw hurt flash effect - Python: red vignette with multiple border layers
        if (this.gameState.hurtFlash > 0) {
            if (!this.hurtFlashGraphics) {
                this.hurtFlashGraphics = this.add.graphics();
                this.hurtFlashGraphics.setDepth(99); // Below HUD, above game
                this.hurtFlashGraphics.setScrollFactor(0); // Fixed to camera
            }
            
            this.hurtFlashGraphics.clear();
            // Python: hurt_alpha = min(hurt_flash * 3, 150)
            const hurtAlpha = Math.min(this.gameState.hurtFlash * 3, 150) / 255;
            
            // Python: for i in range(50): draw rect border with decreasing alpha
            for (let i = 0; i < 50; i++) {
                const alpha = hurtAlpha * (1 - i / 50);
                this.hurtFlashGraphics.lineStyle(1, 0xff0000, alpha); // (255, 0, 0)
                this.hurtFlashGraphics.strokeRect(i, i, CONFIG.WIDTH - i * 2, CONFIG.HEIGHT - i * 2);
            }
        } else if (this.hurtFlashGraphics) {
            this.hurtFlashGraphics.clear();
        }
    }
    
    shoot(angleDeg) {
        // Main bullet
        const bulletX = this.player.x + CONFIG.BULLET_OFFSET_X;
        const bulletY = this.player.y + CONFIG.BULLET_OFFSET_Y;
        
        const bullet = new PlayerBullet(this, bulletX, bulletY, angleDeg, 
            this.gameState.weaponDamageBonus, this.gameState.powerPurple);
        this.playerBullets.push(bullet);
        
        // Multishot power-up - Python: 16 directions (0, 22, 44, 66, 88...)
        // Python creates 16 extra bullets regardless of main bullet angle
        if (this.gameState.powerMultishot) {
            for (let deg = 0; deg < 360; deg += 22) {
                const extraBullet = new PlayerBullet(this, bulletX, bulletY, deg,
                    this.gameState.weaponDamageBonus, this.gameState.powerPurple);
                this.playerBullets.push(extraBullet);
            }
        }
    }
    
    updateEnemies(time) {
        const scrollCamera = [0, 0]; // Camera follows player, enemies don't scroll
        
        // Python: for enemy in enemy_list: enemy.ai() then enemy.update()
        // Process all enemies first, then handle deaths
        this.enemies.forEach((enemy, index) => {
            // Skip if already dead and processed
            if (!enemy.alive && enemy.dropSpawned) {
                return;
            }
            
            const result = enemy.update(time, this.player, this.background.obstacleTiles);
            
            // Handle enemy shooting
            if (result && result.bullet) {
                if (Array.isArray(result.bullet)) {
                    // Boss shotgun
                    result.bullet.forEach(b => {
                        const bullet = new EnemyBullet(this, b.x, b.y, b.angle);
                        this.enemyBullets.push(bullet);
                    });
                } else {
                    const bullet = new EnemyBullet(this, result.bullet.x, result.bullet.y, result.bullet.angle);
                    this.enemyBullets.push(bullet);
                }
            }
            
            // Handle player damage from melee
            if (result && result.playerDamaged) {
                this.gameState.hurtFlash = 50;
                // Also set in registry for MenuScene
                this.registry.set('hurtFlash', 50);
            }
        });
        
        // Python: Check death AFTER processing all enemies
        // if not enemy.alive and not hasattr(enemy, 'drop_spawned')
        this.enemies.forEach((enemy, index) => {
            if (!enemy.alive && !enemy.dropSpawned) {
                // Enemy just died - process death logic
                enemy.dropSpawned = true; // Mark as processed
                this.enemyDeath(enemy, time);
            }
        });
        
        // Remove dead enemies after processing
        this.enemies = this.enemies.filter(e => e.alive || !e.dropSpawned);
    }
    
    enemyDeath(enemy, time) {
        // Python: player.score += 1 in enemy.update() when health <= 0
        // But we handle it here to match the flow
        // Note: enemy.alive is already set to false before calling this
        this.gameState.kills++;
        this.player.score++;
        
        // Combo system - Python: if within 2 seconds
        if (time - this.gameState.lastKillTime < 2000) {
            this.gameState.comboCount++;
            this.gameState.comboMultiplier = 1.0 + this.gameState.comboCount * 0.1;
        } else {
            this.gameState.comboCount = 1;
            this.gameState.comboMultiplier = 1.0;
        }
        this.gameState.lastKillTime = time;
        
        // Bonus coins - Python: (5 if not boss else 25) * combo_multiplier
        const baseBonus = enemy.isBoss ? 25 : 5;
        const bonusCoins = Math.floor(baseBonus * this.gameState.comboMultiplier);
        this.gameState.coins += bonusCoins;
        
        // Boss bonus
        if (enemy.isBoss) {
            this.gameState.coins += 100 + this.gameState.wave * 20;
        }
        
        // Screen shake
        this.gameState.screenShake = enemy.isBoss ? 15 : 5;
        
        // Particles - Python: spawn_particles()
        // Python: normal enemy spawns 2 batches: (200, 50, 50) count=12, speed=5 and (255, 100, 100) count=8, speed=3
        // Total 20 particles for normal enemy
        if (enemy.isBoss) {
            // Boss: 30 particles
            const particleColor = 0xff6432;
            const newParticles = spawnParticles(this, enemy.x, enemy.y, particleColor, 30, 8);
            this.particles.push(...newParticles);
        } else {
            // Normal enemy: 2 batches like Python
            // Batch 1: dark red (200, 50, 50) - 12 particles, speed 5
            const darkRedParticles = spawnParticles(this, enemy.x, enemy.y, 0xc83232, 12, 5);
            // Batch 2: light red (255, 100, 100) - 8 particles, speed 3
            const lightRedParticles = spawnParticles(this, enemy.x, enemy.y, 0xff6464, 8, 3);
            this.particles.push(...darkRedParticles, ...lightRedParticles);
        }
        
        // Drop items
        this.dropItem(enemy.x, enemy.y, enemy.isBoss);
        
        // Death animation
        this.tweens.add({
            targets: enemy.sprite,
            alpha: 0,
            duration: 300,
            onComplete: () => enemy.destroy()
        });
    }
    
    dropItem(x, y, isBoss) {
        if (isBoss) {
            // Boss drops 5 items
            for (let i = 0; i < 5; i++) {
                const ix = x + Phaser.Math.Between(-50, 50);
                const iy = y + Phaser.Math.Between(-50, 50);
                if (this.background.isValidSpawnPosition(ix, iy)) {
                    const itemType = Math.random() < 0.5 ? 0 : 1;
                    this.items.push(new Item(this, ix, iy, itemType));
                }
            }
        } else {
            // Normal drop - Python: 15% coin, 5% cola
            const chance = Math.random();
            if (chance < 0.15) {
                if (this.background.isValidSpawnPosition(x, y)) {
                    this.items.push(new Item(this, x, y, 0));
                }
            } else if (chance < 0.20) {
                if (this.background.isValidSpawnPosition(x, y)) {
                    this.items.push(new Item(this, x, y, 1));
                }
            }
        }
    }
    
    updateBullets() {
        // Player bullets
        this.playerBullets = this.playerBullets.filter(bullet => {
            if (!bullet.sprite.active) return false;
            
            const result = bullet.update(this.enemies, this.background.obstacleTiles);
            if (result) {
                this.showDamageText(result.pos.centerX, result.pos.y, `-${result.damage}`);
                this.hitSound.play();
                this.gameState.screenShake = 3;
            }
            
            return bullet.sprite.active;
        });
        
        // Enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            if (!bullet.sprite.active) return false;
            
            const hit = bullet.update(this.player, this.background.obstacleTiles);
            if (hit) {
                this.gameState.hurtFlash = 50;
                // Also set in registry for MenuScene
                this.registry.set('hurtFlash', 50);
            }
            
            return bullet.sprite.active;
        });
    }
    
    updateItems() {
        // Items
        this.items = this.items.filter(item => {
            if (!item.sprite.active) return false;
            item.update(this.player, (amount) => {
                this.gameState.coins += amount;
            }, this.potionSound);
            return item.sprite.active;
        });
        
        // Stars
        this.stars.forEach((star, index) => {
            if (!star.sprite.active) {
                this.stars.splice(index, 1);
                return;
            }
            
            const collected = star.update(this.player);
            if (collected !== null) {
                this.activatePowerUp(collected, this.time.now);
                star.sprite.destroy();
                this.stars.splice(index, 1);
            }
        });
    }
    
    updateParticles() {
        const scrollCamera = [0, 0];
        this.particles = this.particles.filter(particle => {
            if (particle.update(scrollCamera)) {
                particle.draw();
                return true;
            } else {
                particle.destroy();
                return false;
            }
        });
    }
    
    updateDamageTexts() {
        this.damageTexts = this.damageTexts.filter(text => {
            text.y -= 2; // Move up
            text.setAlpha(text.alpha - 0.1);
            return text.alpha > 0;
        });
    }
    
    showDamageText(x, y, text) {
        const damageText = this.add.text(x, y, text, {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '20px',
            color: '#ff0000'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: damageText,
            y: y - 40,
            alpha: 0,
            duration: 500,
            onComplete: () => damageText.destroy()
        });
    }
    
    updateWaveSpawning(time) {
        // Python: max_enemies = min(5 + current_wave * 2, 25)
        const maxEnemies = Math.min(5 + this.gameState.wave * 2, 25);
        // Python: enemies_per_spawn = min(1 + current_wave // 2, 10)
        const enemiesPerSpawn = Math.min(1 + Math.floor(this.gameState.wave / 2), 10);
        
        const aliveEnemies = this.enemies.filter(e => e.alive).length;
        
        // Spawn enemies in batches
        if (time - this.gameState.spawnTimer > this.gameState.spawnInterval &&
            aliveEnemies < maxEnemies &&
            this.gameState.waveEnemiesSpawned < this.gameState.enemiesPerWave) {
            
            const spawnCount = Math.min(
                enemiesPerSpawn,
                this.gameState.enemiesPerWave - this.gameState.waveEnemiesSpawned,
                maxEnemies - aliveEnemies
            );
            
            for (let i = 0; i < spawnCount; i++) {
                this.spawnEnemy();
                this.gameState.waveEnemiesSpawned++;
            }
            
            this.gameState.spawnTimer = time;
        }
        
        // Boss spawn logic - Python: wave 1-5 boss every 3 waves (wave 3), wave 6+ boss every 2 waves (2 bosses)
        if (!this.gameState.bossSpawnedThisWave && this.gameState.waveEnemiesSpawned >= 1) {
            let shouldSpawnBoss = false;
            let bossCount = 1;
            
            if (this.gameState.wave >= 6) {
                // After wave 6: every 2 waves, 2 bosses
                if (this.gameState.wave % 2 === 0) {
                    shouldSpawnBoss = true;
                    bossCount = 2;
                }
            } else {
                // Before wave 6: every 3 waves, 1 boss
                if (this.gameState.wave % CONFIG.BOSS_SPAWN_WAVE === 0) {
                    shouldSpawnBoss = true;
                    bossCount = 1;
                }
            }
            
            if (shouldSpawnBoss) {
                for (let i = 0; i < bossCount; i++) {
                    this.spawnEnemy(true);
                }
                this.gameState.bossSpawnedThisWave = true;
                this.gameState.screenShake = 10 + bossCount * 5; // Python: screen_shake = 10 + boss_count * 5
            }
        }
    }
    
    spawnEnemy(isBoss = false) {
        // Python: spawn_enemy() - try 50 times to find valid position
        let x, y;
        for (let attempt = 0; attempt < 50; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(300, 1000);
            x = this.player.x + Math.cos(angle) * dist;
            y = this.player.y + Math.sin(angle) * dist;
            
            // Clamp to bounds - Python uses screen bounds, not map bounds
            const margin = 100;
            // Note: In Python, it clamps to WINDOW_WIDTH/HEIGHT, but in world coordinates
            // We need to clamp relative to player's current position
            x = Math.max(CONFIG.MAP_X_START + margin, Math.min(CONFIG.MAP_X_END - margin, x));
            y = Math.max(CONFIG.MAP_Y_START + margin + 100, Math.min(CONFIG.MAP_Y_END - margin, y));
            
            // Pass isBoss parameter to use correct size for collision test
            if (this.background.isValidSpawnPosition(x, y, isBoss)) {
                break;
            }
        }
        
        let characterType, isShooter;
        
        if (isBoss) {
            // Python: is_shooter_boss = (wave // BOSS_SPAWN_WAVE) % 2 == 0
            isShooter = (Math.floor(this.gameState.wave / CONFIG.BOSS_SPAWN_WAVE) % 2 === 0);
            characterType = isShooter ? 4 : 1;
        } else {
            // Python: shooter_chance = min(0.1 + wave * 0.05, 0.5)
            const shooterChance = Math.min(0.1 + this.gameState.wave * 0.05, 0.5);
            isShooter = Math.random() < shooterChance;
            
            if (isShooter) {
                characterType = 4; // joker_shooter
            } else {
                characterType = 1; // antonio_zombie (only antonio_zombie, not joker_zombie)
            }
        }
        
        const enemy = new Enemy(this, x, y, characterType, isShooter, isBoss, this.gameState.wave);
        this.enemies.push(enemy);
        
        // Add collision with walls
        this.background.walls.forEach(wall => {
            this.physics.add.collider(enemy.sprite, wall);
        });
    }
    
    checkWaveComplete(time) {
        if (!this.gameState.waveInProgress || this.gameState.waveComplete) return;
        
        // Python: Count enemies that are truly alive (health > 0)
        // Filter out enemies that are not alive or have health <= 0
        const aliveEnemies = this.enemies.filter(e => {
            // Make sure enemy still exists and is truly alive
            return e && e.alive && e.health > 0;
        }).length;
        
        // Python: wave_enemies_spawned >= enemies_per_wave and alive_enemies == 0
        if (this.gameState.waveEnemiesSpawned >= this.gameState.enemiesPerWave && aliveEnemies === 0) {
            this.gameState.waveInProgress = false;
            this.gameState.waveComplete = true;
            this.gameState.waveCompleteTimer = time;
            
            // Bonus coins
            this.gameState.coins += this.gameState.wave * 20;
            
            // Show celebration
            this.showWaveComplete();
            
            // After 1.5 seconds, show shop
            this.time.delayedCall(1500, () => {
                this.gameState.waveComplete = false;
                this.gameState.shopPhase = true;
                this.showShop();
            });
        }
    }
    
    spawnCola() {
        // Python: spawn_random_cola() - try 50 times
        // Fix: Use player position relative coordinates (Python uses screen coords due to scroll_camera)
        for (let attempt = 0; attempt < 50; attempt++) {
            const margin = 150;
            // Spawn relative to player position (like enemies), but within screen bounds
            const angle = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(200, 500);
            let x = this.player.x + Math.cos(angle) * dist;
            let y = this.player.y + Math.sin(angle) * dist;
            
            // Clamp to map bounds
            x = Math.max(CONFIG.MAP_X_START + margin, Math.min(CONFIG.MAP_X_END - margin, x));
            y = Math.max(CONFIG.MAP_Y_START + margin + 100, Math.min(CONFIG.MAP_Y_END - margin, y));
            
            if (this.background.isValidSpawnPosition(x, y)) {
                this.items.push(new Item(this, x, y, 1));
                return;
            }
        }
        // Fallback to player position
        this.items.push(new Item(this, this.player.x, this.player.y, 1));
    }
    
    spawnStar() {
        // Python: spawn_star()
        // Fix: Use player position relative coordinates (Python uses screen coords due to scroll_camera)
        for (let attempt = 0; attempt < 50; attempt++) {
            const margin = 150;
            // Spawn relative to player position (like enemies), but within screen bounds
            const angle = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(200, 500);
            let x = this.player.x + Math.cos(angle) * dist;
            let y = this.player.y + Math.sin(angle) * dist;
            
            // Clamp to map bounds
            x = Math.max(CONFIG.MAP_X_START + margin, Math.min(CONFIG.MAP_X_END - margin, x));
            y = Math.max(CONFIG.MAP_Y_START + margin + 100, Math.min(CONFIG.MAP_Y_END - margin, y));
            
            if (this.background.isValidSpawnPosition(x, y)) {
                const starType = Phaser.Math.Between(0, 2);
                this.stars.push(new Star(this, x, y, starType));
                return;
            }
        }
    }
    
    activatePowerUp(type, time) {
        if (type === 0) {
            // Red - invincibility
            this.gameState.powerInvincible = true;
            this.gameState.powerInvincibleTimer = time;
        } else if (type === 1) {
            // Yellow - multishot
            this.gameState.powerMultishot = true;
            this.gameState.powerMultishotTimer = time;
        } else if (type === 2) {
            // Purple - boss killer
            this.gameState.powerPurple = true;
            this.gameState.powerPurpleTimer = time;
        }
    }
    
    updatePowerUps(time) {
        // Python: POWER_DURATION = 10000ms
        if (this.gameState.powerInvincible && time - this.gameState.powerInvincibleTimer >= CONFIG.POWER_DURATION) {
            this.gameState.powerInvincible = false;
        }
        if (this.gameState.powerMultishot && time - this.gameState.powerMultishotTimer >= CONFIG.POWER_DURATION) {
            this.gameState.powerMultishot = false;
        }
        if (this.gameState.powerPurple && time - this.gameState.powerPurpleTimer >= CONFIG.POWER_DURATION) {
            this.gameState.powerPurple = false;
        }
        
        // Update power-up text - 现在在 HUD.update() 中处理，支持多个效果同时显示
        
        // Professional glow effect when powered up - Multi-layer gradient glow
        // Only if player is alive
        if (this.player && this.player.alive) {
            if (!this.playerGlow) {
                this.playerGlow = this.add.graphics();
                this.playerGlow.setDepth(9.5); // Below player (10) but above other objects
            }
            
            if (this.gameState.powerInvincible || this.gameState.powerMultishot || this.gameState.powerPurple) {
                this.playerGlow.clear();
                const pulse = (Math.sin(time / 100) + 1) / 2;
                const pulse2 = (Math.sin(time / 150) + 1) / 2; // Secondary pulse for depth
                
                let baseColor, glowColor, outerColor;
                if (this.gameState.powerInvincible) {
                    // Red invincibility - vibrant red glow
                    baseColor = { r: 255, g: 50, b: 50 };
                    glowColor = { r: 255, g: 100, b: 100 };
                    outerColor = { r: 255, g: 150, b: 150 };
                } else if (this.gameState.powerMultishot) {
                    // Yellow multishot - golden glow
                    baseColor = { r: 255, g: 255, b: 50 };
                    glowColor = { r: 255, g: 255, b: 120 };
                    outerColor = { r: 255, g: 255, b: 180 };
                } else if (this.gameState.powerPurple) {
                    // Purple boss killer - mystical purple glow
                    baseColor = { r: 180, g: 50, b: 255 };
                    glowColor = { r: 200, g: 100, b: 255 };
                    outerColor = { r: 220, g: 150, b: 255 };
                }
                
                // Multi-layer gradient glow for professional look
                // Outer glow layers (larger, more transparent)
                for (let i = 0; i < 5; i++) {
                    const radius = 55 - i * 3;
                    const alpha = (0.15 * pulse * (1 - i / 5));
                    const color = Phaser.Display.Color.GetColor(
                        Math.floor(outerColor.r * (1 - i / 5) + baseColor.r * (i / 5)),
                        Math.floor(outerColor.g * (1 - i / 5) + baseColor.g * (i / 5)),
                        Math.floor(outerColor.b * (1 - i / 5) + baseColor.b * (i / 5))
                    );
                    this.playerGlow.fillStyle(color, alpha);
                    this.playerGlow.fillCircle(this.player.x, this.player.y, radius);
                }
                
                // Middle glow layers (medium intensity)
                for (let i = 0; i < 4; i++) {
                    const radius = 42 - i * 2;
                    const alpha = (0.4 * pulse2 * (1 - i / 4));
                    const color = Phaser.Display.Color.GetColor(
                        Math.floor(glowColor.r * (1 - i / 4) + baseColor.r * (i / 4)),
                        Math.floor(glowColor.g * (1 - i / 4) + baseColor.g * (i / 4)),
                        Math.floor(glowColor.b * (1 - i / 4) + baseColor.b * (i / 4))
                    );
                    this.playerGlow.fillStyle(color, alpha);
                    this.playerGlow.fillCircle(this.player.x, this.player.y, radius);
                }
                
                // Inner core glow (bright, pulsing)
                const coreAlpha = 0.6 + 0.2 * pulse;
                const coreColor = Phaser.Display.Color.GetColor(baseColor.r, baseColor.g, baseColor.b);
                this.playerGlow.fillStyle(coreColor, coreAlpha);
                this.playerGlow.fillCircle(this.player.x, this.player.y, 35);
                
                // Bright center sparkle
                const sparkleAlpha = 0.8 * pulse;
                this.playerGlow.fillStyle(0xffffff, sparkleAlpha);
                this.playerGlow.fillCircle(this.player.x, this.player.y, 8);
            } else {
                if (this.playerGlow) {
                    this.playerGlow.clear();
                }
            }
        } else {
            if (this.playerGlow) {
                this.playerGlow.clear();
            }
        }
    }
    
    nextWave() {
        // Python: next wave logic
        this.hideShop();
        this.gameState.shopPhase = false;
        this.gameState.wave++;
        this.gameState.waveEnemiesSpawned = 0;
        this.gameState.bossSpawnedThisWave = false;
        this.gameState.enemiesPerWave = 5 + this.gameState.wave * 2;
        this.gameState.spawnInterval = Math.max(1500, 3000 - this.gameState.wave * 100);
        this.gameState.countdownActive = true;
        this.gameState.countdownStartTime = 0; // Python: countdown_start_time = 0, then set in update if 0
        
        // Clear all bullets before next wave - user requirement
        this.playerBullets.forEach(bullet => {
            if (bullet && bullet.sprite) {
                bullet.sprite.destroy();
            }
        });
        this.playerBullets = [];
        
        this.enemyBullets.forEach(bullet => {
            if (bullet && bullet.sprite) {
                bullet.sprite.destroy();
            }
        });
        this.enemyBullets = [];
        
        // Clear items and spawn initial colas
        this.items.forEach(item => item.sprite.destroy());
        this.items = [];
        this.spawnCola();
        this.spawnCola();
        this.gameState.colaSpawnTimer = this.time.now;
    }
    
    buyUpgrade(num) {
        if (!this.gameState.shopPhase) return;
        
        const upgradeCost = this.gameState.weaponLevel * 50;
        
        if (num === 1 && this.gameState.coins >= upgradeCost) {
            this.gameState.coins -= upgradeCost;
            this.gameState.weaponLevel++;
            this.gameState.weaponDamageBonus += 10;
            this.updateShopDisplay();
        } else if (num === 2 && this.gameState.coins >= 30 && this.player.health < 100) {
            this.gameState.coins -= 30;
            this.player.health = Math.min(this.player.health + 20, 100);
            this.updateShopDisplay();
        } else if (num === 3 && this.gameState.coins >= 80 && this.player.health < 100) {
            this.gameState.coins -= 80;
            this.player.health = 100;
            this.updateShopDisplay();
        } else if (num === 4 && this.gameState.coins >= 200 && !this.gameState.hasLaserSight) {
            this.gameState.coins -= 200;
            this.gameState.hasLaserSight = true;
            // laserLine will be created automatically in drawLaserSight() when needed
            this.updateShopDisplay();
        }
    }
    
    // UI Methods - Countdown, Shop, Pause, Game Over
    showCountdown() {
        // Check if container or elements were destroyed (e.g., after restart or returning from main menu)
        // Always check if elements are valid before using them
        if (!this.countdownContainer || !this.countdownNumber || !this.countdownLabel || 
            !this.countdownContainer.active || !this.countdownNumber.active || !this.countdownLabel.active) {
            // Destroy existing container if it exists but elements are invalid
            if (this.countdownContainer) {
                this.countdownContainer.destroy(true);
                this.countdownContainer = null;
                this.countdownNumber = null;
                this.countdownLabel = null;
                this.countdownOverlay = null;
            }
            
            // Recreate everything
            this.countdownContainer = this.add.container(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
            this.countdownContainer.setScrollFactor(0);
            this.countdownContainer.setDepth(200);
            
            // Overlay
            this.countdownOverlay = this.add.graphics();
            this.countdownOverlay.fillStyle(0x000000, 0.4);
            this.countdownOverlay.fillRect(-CONFIG.WIDTH/2, -CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT);
            this.countdownContainer.add(this.countdownOverlay);
            
            // Number - Python: countdown_font (120px)
            this.countdownNumber = this.add.text(0, 0, '3', {
                fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
                fontSize: '120px',
                color: '#ffd700'
            }).setOrigin(0.5);
            this.countdownContainer.add(this.countdownNumber);
            
            // Label
            this.countdownLabel = this.add.text(0, 100, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '28px',
                color: '#ffd700'
            }).setOrigin(0.5);
            this.countdownContainer.add(this.countdownLabel);
        }
        
        // Animated scale - Python: scale_factor = 1.0 + (1.0 - elapsed_in_second / 1000) * 0.3
        const elapsed = this.time.now - this.gameState.countdownStartTime;
        const elapsedInSecond = elapsed % 1000;
        const scaleFactor = 1.0 + (1.0 - elapsedInSecond / 1000) * 0.3;
        
        // Final safety check before using - ensure elements are still valid
        if (this.countdownNumber && this.countdownNumber.active && 
            this.countdownLabel && this.countdownLabel.active && 
            this.countdownContainer && this.countdownContainer.active) {
            this.countdownNumber.setText(String(this.gameState.countdownValue));
            this.countdownNumber.setFontSize(120 * scaleFactor);
            this.countdownLabel.setText(`Wave ${this.gameState.wave} Starting...`);
            this.countdownContainer.setVisible(true);
        }
    }
    
    hideCountdown() {
        if (this.countdownContainer) {
            this.countdownContainer.setVisible(false);
        }
    }
    
    showWaveComplete() {
        if (!this.waveCompleteContainer) {
            this.waveCompleteContainer = this.add.container(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
            this.waveCompleteContainer.setScrollFactor(0);
            this.waveCompleteContainer.setDepth(200);
            
            this.waveCompleteText = this.add.text(0, 0, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
                fontSize: '60px',
                color: '#ffd700',
                stroke: '#000000',
                strokeThickness: 4,
                shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, fill: true }
            }).setOrigin(0.5);
            this.waveCompleteContainer.add(this.waveCompleteText);
            
            this.waveBonusText = this.add.text(0, 60, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '28px',
                color: '#ffff64',
                stroke: '#000000',
                strokeThickness: 2,
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
            }).setOrigin(0.5);
            this.waveCompleteContainer.add(this.waveBonusText);
        }
        
        // Python: bounce animation
        const bounce = Math.sin((this.time.now - this.gameState.waveCompleteTimer) / 100) * 10;
        this.waveCompleteText.setText(`WAVE ${this.gameState.wave} COMPLETE!`);
        this.waveCompleteText.y = bounce;
        this.waveBonusText.setText(`+${this.gameState.wave * 20} coins!`);
        this.waveBonusText.y = 60 + bounce / 2;
        this.waveCompleteContainer.setVisible(true);
        
        // Flash effect
        this.cameras.main.flash(200, 255, 215, 0, false);
    }
    
    hideWaveComplete() {
        if (this.waveCompleteContainer) {
            this.waveCompleteContainer.setVisible(false);
        }
    }
    
    showShop() {
        this.hideWaveComplete();
        
        if (!this.shopContainer) {
            this.shopContainer = this.add.container(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
            this.shopContainer.setScrollFactor(0);
            this.shopContainer.setDepth(200);
            
            // Overlay - Python: (20, 30, 20, 230)
            const overlay = this.add.graphics();
            overlay.fillStyle(0x141e14, 0.9);
            overlay.fillRect(-CONFIG.WIDTH/2, -CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT);
            this.shopContainer.add(overlay);
            
            // Title - Python: font_title (80px)
            const title = this.add.text(0, -260, 'SHOP', {
                fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
                fontSize: '80px',
                color: '#64ff64' // (100, 255, 100)
            }).setOrigin(0.5);
            this.shopContainer.add(title);
            
            // Next wave label
            this.shopWaveLabel = this.add.text(0, -160, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '36px',
                color: '#ffd700'
            }).setOrigin(0.5);
            this.shopContainer.add(this.shopWaveLabel);
            
            // Stats
            this.shopCoinsText = this.add.text(0, -120, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '36px',
                color: '#ffd700'
            }).setOrigin(0.5);
            this.shopContainer.add(this.shopCoinsText);
            
            this.shopHealthText = this.add.text(0, -80, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '20px',
                color: '#64ff64'
            }).setOrigin(0.5);
            this.shopContainer.add(this.shopHealthText);
            
            // Shop box - Python: 500x300
            const box = this.add.graphics();
            box.fillStyle(0x283228, 0.86); // (40, 50, 40, 220)
            box.fillRoundedRect(-250, -50, 500, 300, 15);
            box.lineStyle(3, 0x64c864); // (100, 200, 100)
            box.strokeRoundedRect(-250, -50, 500, 300, 15);
            this.shopContainer.add(box);
            
            // Shop items
            this.shopItems = [];
            const boxLeft = -250;
            const boxTop = -50;
            const itemsY = [
                boxTop + 25,
                boxTop + 85,
                boxTop + 145,
                boxTop + 205
            ];
            
            for (let i = 0; i < 4; i++) {
                const item = this.add.text(boxLeft + 30, itemsY[i], '', {
                    fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                    fontSize: '20px',
                    color: '#64ff64',
                    wordWrap: { width: 440 }
                });
                this.shopContainer.add(item);
                this.shopItems.push(item);
            }
            
            // Continue hint - Python: pulse effect, only ENTER key
            this.shopContinue = this.add.text(0, 280, 'Press [ENTER] to Continue', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '20px',
                color: '#96ff96'
            }).setOrigin(0.5);
            this.shopContainer.add(this.shopContinue);
        }
        
        this.updateShopDisplay();
        this.shopContainer.setVisible(true);
    }
    
    updateShopDisplay() {
        if (!this.shopContainer) return;
        
        this.shopWaveLabel.setText(`Preparing for Wave ${this.gameState.wave + 1}`);
        this.shopCoinsText.setText(`Coins: ${this.gameState.coins}`);
        
        const healthColor = this.player.health > 50 ? '#64ff64' : 
                          this.player.health > 25 ? '#ffc800' : '#ff6464';
        this.shopHealthText.setStyle({ color: healthColor });
        this.shopHealthText.setText(`Health: ${this.player.health}/100`);
        
        const upgradeCost = this.gameState.weaponLevel * 50;
        
        // Item 1
        const canBuyWeapon = this.gameState.coins >= upgradeCost;
        this.shopItems[0].setStyle({ color: canBuyWeapon ? '#64ff64' : '#646464' });
        this.shopItems[0].setText(`[1] Weapon Upgrade (Lv.${this.gameState.weaponLevel} -> Lv.${this.gameState.weaponLevel + 1})\n    +10 Damage | Cost: ${upgradeCost} coins`);
        
        // Item 2
        const canBuyHealth = this.gameState.coins >= 30 && this.player.health < 100;
        this.shopItems[1].setStyle({ color: canBuyHealth ? '#64ff64' : '#646464' });
        this.shopItems[1].setText('[2] Health +20\n    Cost: 30 coins');
        
        // Item 3
        const canBuyFull = this.gameState.coins >= 80 && this.player.health < 100;
        this.shopItems[2].setStyle({ color: canBuyFull ? '#64ff64' : '#646464' });
        this.shopItems[2].setText('[3] Full Heal (100 HP)\n    Cost: 80 coins');
        
        // Item 4
        if (this.gameState.hasLaserSight) {
            this.shopItems[3].setStyle({ color: '#ffd700' });
            this.shopItems[3].setText('[4] Laser Sight - OWNED');
        } else {
            const canBuyLaser = this.gameState.coins >= 200;
            this.shopItems[3].setStyle({ color: canBuyLaser ? '#ff6464' : '#646464' });
            this.shopItems[3].setText('[4] Laser Sight\n    Cost: 200 coins (permanent)');
        }
        
        // Pulse continue hint
        const pulse = (Math.sin(this.time.now / 300) + 1) / 2;
        const pulseColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0x96ff96),
            Phaser.Display.Color.ValueToColor(0xffff00),
            100,
            pulse * 100
        );
        const color = Phaser.Display.Color.GetColor(pulseColor.r, pulseColor.g, pulseColor.b);
        this.shopContinue.setColor(`#${color.toString(16).padStart(6, '0')}`);
    }
    
    hideShop() {
        if (this.shopContainer) {
            this.shopContainer.setVisible(false);
        }
    }
    
    showPauseMenu() {
        if (!this.pauseContainer) {
            this.pauseContainer = this.add.container(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
            this.pauseContainer.setScrollFactor(0);
            this.pauseContainer.setDepth(200);
            
            // Overlay
            const overlay = this.add.graphics();
            overlay.fillStyle(0x14141e, 0.9);
            overlay.fillRect(-CONFIG.WIDTH/2, -CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT);
            this.pauseContainer.add(overlay);
            
            // Title
            const title = this.add.text(0, -150, 'PAUSED', {
                fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
                fontSize: '80px',
                color: '#ffd700'
            }).setOrigin(0.5);
            this.pauseContainer.add(title);
            
            // Stats box
            const box = this.add.graphics();
            const boxLeft = -160;
            const boxTop = -70;
            box.fillStyle(0x28283c, 0.8);
            box.fillRoundedRect(boxLeft, boxTop, 320, 160, 10);
            box.lineStyle(2, 0x646496);
            box.strokeRoundedRect(boxLeft, boxTop, 320, 160, 10);
            this.pauseContainer.add(box);
            
            // Continue hint - Python: "Press ESC to continue" (user requested)
            const continueHint = this.add.text(0, 200, 'Press [ESC] to Continue', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '24px',
                color: '#c8c8dc'
            }).setOrigin(0.5);
            this.pauseContainer.add(continueHint);
            
            // Stats
            this.pauseWaveText = this.add.text(boxLeft + 30, boxTop + 25, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '36px',
                color: '#ffffff'
            });
            this.pauseContainer.add(this.pauseWaveText);
            
            this.pauseKillsText = this.add.text(boxLeft + 30, boxTop + 70, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '36px',
                color: '#ff6464'
            });
            this.pauseContainer.add(this.pauseKillsText);
            
            this.pauseCoinsText = this.add.text(boxLeft + 30, boxTop + 115, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '36px',
                color: '#ffd700'
            });
            this.pauseContainer.add(this.pauseCoinsText);
        }
        
        this.pauseWaveText.setText(`Wave: ${this.gameState.wave}`);
        this.pauseKillsText.setText(`Kills: ${this.gameState.kills}`);
        this.pauseCoinsText.setText(`Coins: ${this.gameState.coins}`);
        this.pauseContainer.setVisible(true);
    }
    
    hidePauseMenu() {
        if (this.pauseContainer) {
            this.pauseContainer.setVisible(false);
        }
    }
    
    gameOver() {
        if (this.gameOverShown) return;
        this.gameOverShown = true;
        
        // Pause physics but keep input active for buttons
        this.physics.pause();
        
        // Ensure input is still active for buttons
        this.input.enabled = true;
        
        const container = this.add.container(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
        container.setScrollFactor(0);
        container.setDepth(300);
        container.setInteractive(new Phaser.Geom.Rectangle(-CONFIG.WIDTH/2, -CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT), Phaser.Geom.Rectangle.Contains);
        
        // Overlay - Python: (40, 10, 10, 200)
        const overlay = this.add.graphics();
        overlay.fillStyle(0x280a0a, 0.78);
        overlay.fillRect(-CONFIG.WIDTH/2, -CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT);
        container.add(overlay);
        
        // Title with shake - Python: shake_x = sin(current_time / 100) * 3
        const shakeX = Math.sin(this.time.now / 100) * 3;
        
        // Glow effect for title - Python: 3 layers with different colors (255, 50+i*30, 50+i*30)
        for (let i = 0; i < 3; i++) {
            const glowR = 50 + i * 30;
            const glowG = 50 + i * 30;
            const glowB = 50;
            const glowHex = Phaser.Display.Color.GetColor(255, glowR, glowG);
            const alpha = (100 - i * 30) / 255;
            
            const glowText = this.add.text(shakeX + i, -150 + i, 'GAME OVER', {
                fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
                fontSize: '80px',
                color: '#' + glowHex.toString(16).padStart(6, '0')
            }).setOrigin(0.5).setAlpha(alpha);
            container.add(glowText);
        }
        
        // Main title - Python: (255, 50, 50)
        const title = this.add.text(shakeX, -150, 'GAME OVER', {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '80px',
            color: '#ff3232',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, fill: true }
        }).setOrigin(0.5);
        container.add(title);
        
        // Enhanced stats box with gradient and glow
        const box = this.add.graphics();
        // Outer glow
        box.fillStyle(0x1e1e28, 0.3);
        box.fillRoundedRect(-180, -75, 360, 190, 18);
        // Main box with gradient effect
        box.fillStyle(0x1e1e28, 0.92);
        box.fillRoundedRect(-175, -70, 350, 180, 15);
        // Inner highlight
        box.fillStyle(0x2a2a3a, 0.5);
        box.fillRoundedRect(-173, -68, 346, 30, 13);
        // Border with gradient
        box.lineStyle(2, 0x8a6a6a, 0.8);
        box.strokeRoundedRect(-175, -70, 350, 180, 15);
        box.lineStyle(1, 0xaa8a8a, 0.4);
        box.strokeRoundedRect(-175, -70, 350, 180, 15);
        container.add(box);
        
        // Stats
        const waveText = this.add.text(0, -40, `Survived: ${this.gameState.wave} Waves`, {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '28px',
            color: '#ffd700'
        }).setOrigin(0.5);
        container.add(waveText);
        
        const killsText = this.add.text(0, 10, `Total Kills: ${this.gameState.kills}`, {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '28px',
            color: '#ff7878'
        }).setOrigin(0.5);
        container.add(killsText);
        
        const coinsText = this.add.text(0, 60, `Coins Earned: ${this.gameState.coins}`, {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '28px',
            color: '#ffe664'
        }).setOrigin(0.5);
        container.add(coinsText);
        
        // Restart button - Python: restart_button.draw() resets all game state
        const restartBtn = this.createButton(0, 160, 'RESTART', 0x326496, 0x4682c8, () => {
            // Add fade transition for smooth restart
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // Reset all game state before restarting
                this.gameOverShown = false;
                this.physics.resume();
                
                // Restart scene (will call create() again) - Python: start_intro = True
                // create() will reset all gameState and recreate player with full health
                this.scene.restart();
                
                // Fade in after restart
                this.cameras.main.fadeIn(300, 0, 0, 0);
            });
        });
        container.add(restartBtn);
        
        // Menu button - Python: exit_button.draw() sets run = False
        const menuBtn = this.createButton(0, 240, 'MAIN MENU', 0x963232, 0xc84646, () => {
            // Add fade transition for smooth menu transition
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // Python: exit_button.draw() sets run = False, which exits game loop
                // In JS, we go to menu scene
                this.gameOverShown = false;
                this.physics.resume();
                // Go to menu - scene will be recreated when returning, so state will be reset
                this.scene.start('MenuScene');
            });
        });
        container.add(menuBtn);
    }
    
    createButton(x, y, text, color, hoverColor, callback) {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        
        // Professional button with gradient and glow
        const drawButton = (btnColor, isHover = false) => {
            bg.clear();
            // Outer glow
            bg.fillStyle(btnColor, 0.2);
            bg.fillRoundedRect(-113, -33, 226, 66, 17);
            // Main button background
            bg.fillStyle(btnColor, 1);
            bg.fillRoundedRect(-110, -30, 220, 60, 15);
            // Inner highlight (top gradient)
            const highlightColor = Phaser.Display.Color.ValueToColor(btnColor);
            // Manually brighten the color (Phaser 3 doesn't have Brighten function)
            highlightColor.r = Math.min(255, highlightColor.r + 20);
            highlightColor.g = Math.min(255, highlightColor.g + 20);
            highlightColor.b = Math.min(255, highlightColor.b + 20);
            bg.fillStyle(Phaser.Display.Color.GetColor(highlightColor.r, highlightColor.g, highlightColor.b), 0.4);
            bg.fillRoundedRect(-110, -30, 220, 20, 15);
            // Border with gradient
            bg.lineStyle(isHover ? 3 : 2, 0xffffff, isHover ? 0.5 : 0.3);
            bg.strokeRoundedRect(-110, -30, 220, 60, 15);
            bg.lineStyle(1, 0x000000, 0.2);
            bg.strokeRoundedRect(-110, -30, 220, 60, 15);
        };
        
        drawButton(color);
        
        const btnText = this.add.text(0, -1, text, {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
        }).setOrigin(0.5);
        
        container.add(bg);
        container.add(btnText);
        
        // Make interactive - ensure it's clickable even when physics is paused
        const hitArea = new Phaser.Geom.Rectangle(-110, -30, 220, 60);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        container.setDepth(301); // Above overlay (300) and game objects
        container.setScrollFactor(0); // Fixed to camera
        // Ensure input is enabled for this container
        container.inputEnabled = true;
        
        container.on('pointerover', () => {
            drawButton(hoverColor, true);
            container.setScale(1.05);
        });
        
        container.on('pointerout', () => {
            drawButton(color, false);
            container.setScale(1);
        });
        
        let isPointerDown = false;
        
        container.on('pointerdown', () => {
            container.setScale(0.95);
            isPointerDown = true;
        });
        
        container.on('pointerup', () => {
            container.setScale(1.05);
            if (isPointerDown) {
                callback();
                isPointerDown = false;
            }
        });
        
        container.on('pointerout', () => {
            isPointerDown = false;
        });
        
        return container;
    }
}
