class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Fade in effect when menu starts
        this.cameras.main.fadeIn(300, 0, 0, 0);
        
        const width = CONFIG.WIDTH;
        const height = CONFIG.HEIGHT;
        
        // Background time for animation
        this.backgroundTime = 0;
        
        // Create floating particles - Python: 20 particles
        this.particles = [];
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: i * 100,
                y: (i * 50) % height,
                offset: i
            });
        }
        
        // Create background graphics layer
        this.bgGraphics = this.add.graphics();
        this.drawBackground();
        
        // Title with glow effect - Python: font_title (80px), color (255, 215, 0)
        // Python creates 3 glow layers with offsets
        const titleText = "RAGE OF THE CHINCHILLA";
        
        // Glow layers - Python: for offset in range(3, 0, -1)
        for (let offset = 3; offset > 0; offset--) {
            const glowAlpha = 80 - offset * 20;
            const glowText = this.add.text(width / 2 + offset, 130 + offset, titleText, {
                fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
                fontSize: '80px',
                color: '#ffb400'  // (255, 180, 0)
            });
            glowText.setOrigin(0.5);
            glowText.setAlpha(glowAlpha / 255);
        }
        
        // Main title - Python: (255, 215, 0)
        this.title = this.add.text(width / 2, 130, titleText, {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '80px',
            color: '#ffd700',  // (255, 215, 0)
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, fill: true }
        }).setOrigin(0.5);
        
        // Animated subtitle - Python: pulse effect, font_subtitle (28px)
        this.subtitle = this.add.text(width / 2, 200, 'Survive the endless waves!', {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '28px',
            color: '#c8c8dc',  // Starting color, will pulse
            stroke: '#000000',
            strokeThickness: 2,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
        }).setOrigin(0.5);
        
        // Controls box - Python: box at (300, 180) size, (30, 30, 50, 200) background, (100, 100, 150, 150) border
        const boxX = width / 2 - 150;
        const boxY = 250;
        const boxW = 300;
        const boxH = 180;
        
        // Box background
        const boxBg = this.add.graphics();
        boxBg.fillStyle(0x1e1e32, 0.78);  // (30, 30, 50, 200/255)
        boxBg.fillRoundedRect(boxX, boxY, boxW, boxH, 15);
        boxBg.lineStyle(2, 0x646496, 0.59);  // (100, 100, 150, 150/255)
        boxBg.strokeRoundedRect(boxX, boxY, boxW, boxH, 15);
        
        // Controls header - Python: font_large (36px), color (255, 215, 0)
        this.add.text(width / 2, boxY + 30, 'CONTROLS', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#ffd700'
        }).setOrigin(0.5);
        
        // Control items - Python: font (20px)
        const controls = [
            { key: 'WASD', action: 'Move' },
            { key: 'MOUSE', action: 'Aim & Shoot' },
            { key: 'SPACE', action: 'Dash' },
            { key: 'ESC', action: 'Pause' }
        ];
        
        controls.forEach((ctrl, i) => {
            const yPos = boxY + 65 + i * 28;
            // Key highlight - Python: (100, 200, 255)
            this.add.text(boxX + 20, yPos, `[${ctrl.key}]`, {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '20px',
                color: '#64c8ff'
            });
            // Action - Python: (200, 200, 200)
            this.add.text(boxX + 120, yPos, ctrl.action, {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '20px',
                color: '#c8c8c8'
            });
        });
        
        // Create buttons with hover effects - Python: FancyButton class
        this.startButton = this.createFancyButton(width / 2, 480, 'START', 0x329650, 0x46c864, () => {
            // Add fade transition for smooth game start
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        });
        
        this.exitButton = this.createFancyButton(width / 2, 560, 'EXIT', 0x963232, 0xc84646, () => {
            // Python: exit_button.draw() returns True when clicked, closes game
            // In browser, show confirmation and close window/tab
            if (confirm('Are you sure you want to exit?')) {
                window.close();
                // If window.close() doesn't work (some browsers block it), show message
                if (!document.hidden) {
                    alert('Please close this browser tab to exit the game.');
                }
            }
        });
        
        // Version text - Python: bottom left, (80, 80, 100)
        this.add.text(10, height - 30, 'v2.0 - Made with Pygame (JS Port)', {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '14px',
            color: '#505064'
        });
        
        // Play background music - Python: music at 0.5 volume, loop -1
        if (!this.sound.get('music')) {
            this.bgMusic = this.sound.add('music', { loop: true, volume: 0.5 });
            this.bgMusic.play();
        }
    }
    
    drawBackground() {
        this.bgGraphics.clear();
        const width = CONFIG.WIDTH;
        const height = CONFIG.HEIGHT;
        
        // Python: Dynamic gradient background with animated color shift
        // for y in range(constants.WINDOW_HEIGHT):
        //     shift = math.sin(current_time / 2000 + y / 100) * 10
        //     r = int(20 + shift)
        //     g = int(20 + shift / 2)
        //     b = int(40 + shift)
        //     pygame.draw.line(screen, (max(0, r), max(0, g), min(60, b)), (0, y), (constants.WINDOW_WIDTH, y))
        
        for (let y = 0; y < height; y++) {
            const shift = Math.sin(this.backgroundTime / 2000 + y / 100) * 10;
            const r = Math.max(0, Math.min(255, 20 + shift));
            const g = Math.max(0, Math.min(255, 20 + shift / 2));
            const b = Math.max(0, Math.min(255, 40 + shift));
            const color = Phaser.Display.Color.GetColor(r, g, b);
            this.bgGraphics.lineStyle(1, color);
            this.bgGraphics.lineBetween(0, y, width, y);
        }
        
        // Python: Floating particles in background (20 particles)
        // for i in range(20):
        //     px = (i * 100 + current_time // 20) % constants.WINDOW_WIDTH
        //     py = (i * 50 + int(math.sin(current_time / 1000 + i) * 30)) % constants.WINDOW_HEIGHT
        //     alpha = 50 + int(math.sin(current_time / 500 + i) * 30)
        //     s = pygame.Surface((6, 6), pygame.SRCALPHA)
        //     pygame.draw.circle(s, (255, 215, 0, alpha), (3, 3), 3)
        
        this.particles.forEach((p, i) => {
            const px = ((i * 100 + Math.floor(this.backgroundTime / 20)) % width);
            const py = ((i * 50 + Math.floor(Math.sin(this.backgroundTime / 1000 + i) * 30)) % height);
            const alpha = (50 + Math.floor(Math.sin(this.backgroundTime / 500 + i) * 30)) / 255;
            
            this.bgGraphics.fillStyle(0xffd700, alpha);  // (255, 215, 0)
            this.bgGraphics.fillCircle(px, py, 3);
        });
    }
    
    createFancyButton(x, y, text, color, hoverColor, callback) {
        // Python: FancyButton has width=220, height=65, with gradient and shadow effects
        const btnWidth = 220;
        const btnHeight = 65;
        
        const container = this.add.container(x, y);
        
        // Button background with gradient effect
        const bg = this.add.graphics();
        
        // Draw button with gradient - Python draws gradient from color1 to color2
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 15);
        
        // Border - Python: border_radius = 15
        bg.lineStyle(2, 0x646496, 1);  // (100, 100, 150)
        bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 15);
        
        // Button text - Python: font (24px), white
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
        }).setOrigin(0.5);
        
        // Shadow for text - Python: draw_text_shadow function (enhanced)
        const shadowText = this.add.text(2, 2, text, {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);
        shadowText.setAlpha(0.5);
        
        container.add([bg, shadowText, buttonText]);
        
        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        // Hover effect - Python: Glow effect on hover
        container.on('pointerover', () => {
            // Glow effect
            const glow = this.add.graphics();
            glow.fillStyle(hoverColor, 0.2);
            glow.fillRoundedRect(-btnWidth/2 - 10, -btnHeight/2 - 10, btnWidth + 20, btnHeight + 20, 15);
            container.addAt(glow, 0);
            
            bg.clear();
            bg.fillStyle(hoverColor, 1);
            bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 15);
            bg.lineStyle(3, 0x9696c8, 1);
            bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 15);
            container.setScale(1.05);
        });
        
        container.on('pointerout', () => {
            container.getAt(0)?.destroy();  // Remove glow
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 15);
            bg.lineStyle(2, 0x646496, 1);
            bg.strokeRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 15);
            container.setScale(1);
        });
        
        let clicked = false;
        
        container.on('pointerdown', () => {
            container.setScale(0.95);
            clicked = true;
        });
        
        container.on('pointerup', () => {
            container.setScale(1.05);
            if (clicked) {
                callback();
                clicked = false;
            }
        });
        
        container.on('pointerout', () => {
            clicked = false;
        });
        
        return container;
    }
    
    update(time, delta) {
        // Update background animation
        this.backgroundTime = time;
        this.drawBackground();
        
        // Pulse subtitle - Python: pulse = math.sin(current_time / 500) * 0.1 + 0.9
        const pulse = Math.sin(time / 500) * 0.1 + 0.9;
        const pulseColor = Math.floor(200 * pulse);
        this.subtitle.setColor(`rgb(${pulseColor}, ${pulseColor}, ${Math.floor(220 * pulse)})`);
        
        // Hurt flash effect - Python: red vignette when player is hit
        // Check if hurtFlash is set in registry (from GameScene)
        const hurtFlash = this.registry.get('hurtFlash') || 0;
        if (hurtFlash > 0) {
            // Update hurtFlash
            this.registry.set('hurtFlash', Math.max(0, hurtFlash - 2));
            
            // Draw hurt flash effect
            if (!this.hurtFlashGraphics) {
                this.hurtFlashGraphics = this.add.graphics();
                this.hurtFlashGraphics.setDepth(1000); // Above everything
                this.hurtFlashGraphics.setScrollFactor(0);
            }
            
            this.hurtFlashGraphics.clear();
            // Python: hurt_alpha = min(hurt_flash * 3, 150)
            const hurtAlpha = Math.min(hurtFlash * 3, 150) / 255;
            
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
}
