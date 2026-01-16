// HUD class - handles all UI elements
class HUD {
    constructor(scene) {
        this.scene = scene;
        this.createHUD();
    }
    
    createHUD() {
        // HUD container (fixed to camera)
        this.hudContainer = this.scene.add.container(0, 0);
        this.hudContainer.setScrollFactor(0);
        this.hudContainer.setDepth(100);
        
        // Top panel background - Python: Dark gradient panel
        const panelBg = this.scene.add.graphics();
        // Python: gradient from (20, 20, 35, 200) to (20, 20, 35, 0)
        for (let y = 0; y < 90; y++) {
            const alpha = (200 - y * 1.5) / 255;
            panelBg.fillStyle(0x141423, alpha);
            panelBg.fillRect(0, y, CONFIG.WIDTH, 1);
        }
        panelBg.lineStyle(2, 0x646496); // (100, 100, 150)
        panelBg.lineBetween(0, 90, CONFIG.WIDTH, 90);
        this.hudContainer.add(panelBg);
        
        // Health bar - 完全按照 dash 条的实现方式重写
        // Python: draw_health_bar_fancy(15, 15, 200, 25, player.health, 100)
        const healthBarX = 15;
        const healthBarY = 15;
        const healthBarWidth = 200;
        const healthBarHeight = 25;
        
        // 1. 外背景 (40, 40, 40) - 和 dashBarBg 完全一样，静态创建
        this.healthBgOuter = this.scene.add.graphics();
        this.healthBgOuter.fillStyle(0x282828, 1); // (40, 40, 40)
        this.healthBgOuter.fillRoundedRect(healthBarX - 2, healthBarY - 2, healthBarWidth + 4, healthBarHeight + 4, 5);
        this.healthBgOuter.setScrollFactor(0);
        this.healthBgOuter.setDepth(100);
        this.hudContainer.add(this.healthBgOuter);
        
        // 2. 内背景和颜色条 - 和 dashBar 完全一样，每帧 clear 然后重绘
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setScrollFactor(0);
        this.healthBar.setDepth(100); // 和 dashBar 一样的深度
        this.hudContainer.add(this.healthBar);
        
        // 3. 文本 - 和 dashText 完全一样
        this.healthTextShadow = this.scene.add.text(85 + 2, 17 + 2, '100/100', {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '18px',
            color: '#000000'
        });
        this.healthTextShadow.setScrollFactor(0);
        this.healthTextShadow.setDepth(100);
        this.hudContainer.add(this.healthTextShadow);
        
        this.healthText = this.scene.add.text(85, 17, '100/100', {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        });
        this.healthText.setScrollFactor(0);
        this.healthText.setDepth(100);
        this.hudContainer.add(this.healthText);
        
        // Wave indicator (center) - Python: with glow effect (3 layers)
        // Glow layers - Python: glow_surface at (x+1, y+1) with alpha
        this.waveGlow1 = this.scene.add.text(CONFIG.WIDTH / 2 + 3, 30 + 3, 'WAVE 1', {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '36px',
            color: '#ffb400' // (255, 180, 0)
        });
        this.waveGlow1.setOrigin(0.5);
        this.waveGlow1.setScrollFactor(0);
        this.waveGlow1.setDepth(100);
        this.waveGlow1.setAlpha(0.3);
        this.hudContainer.add(this.waveGlow1);
        
        this.waveGlow2 = this.scene.add.text(CONFIG.WIDTH / 2 + 2, 30 + 2, 'WAVE 1', {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '36px',
            color: '#ffb400'
        });
        this.waveGlow2.setOrigin(0.5);
        this.waveGlow2.setScrollFactor(0);
        this.waveGlow2.setDepth(100);
        this.waveGlow2.setAlpha(0.5);
        this.hudContainer.add(this.waveGlow2);
        
        this.waveText = this.scene.add.text(CONFIG.WIDTH / 2, 30, 'WAVE 1', {
            fontFamily: 'MontserratAlternates-Bold, Arial Black, sans-serif',
            fontSize: '36px',
            color: '#ffd700', // (255, 215, 0) - 金色更醒目
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
        });
        this.waveText.setOrigin(0.5);
        this.waveText.setScrollFactor(0);
        this.waveText.setDepth(100);
        this.hudContainer.add(this.waveText);
        
        // Stats (right side) - Python: Kills, Coins, Weapon Level
        const statsX = CONFIG.WIDTH - 200;
        
        this.killsText = this.scene.add.text(statsX, 12, 'Kills: 0', {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '18px',
            color: '#ff6464' // (255, 100, 100)
        });
        this.killsText.setScrollFactor(0);
        this.killsText.setDepth(100);
        this.hudContainer.add(this.killsText);
        
        this.coinsText = this.scene.add.text(statsX, 35, 'Coins: 0', {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '18px',
            color: '#ffd700', // (255, 215, 0)
            stroke: '#000000',
            strokeThickness: 2,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        });
        this.coinsText.setScrollFactor(0);
        this.coinsText.setDepth(100);
        this.hudContainer.add(this.coinsText);
        
        this.weaponText = this.scene.add.text(statsX, 58, 'Weapon Lv.1', {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '18px',
            color: '#64c8ff', // (100, 200, 255)
            stroke: '#000000',
            strokeThickness: 2,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        });
        this.weaponText.setScrollFactor(0);
        this.weaponText.setDepth(100);
        this.hudContainer.add(this.weaponText);
        
        // Dash bar - Python: draw_dash_bar() - bar_x=15, bar_y=50, bar_width=120, bar_height=12
        const dashBarX = 15;
        const dashBarY = 50;
        const dashBarWidth = 120;
        const dashBarHeight = 12;
        
        this.dashBarBg = this.scene.add.graphics();
        this.dashBarBg.fillStyle(0x282832, 1); // (40, 40, 50)
        this.dashBarBg.fillRoundedRect(dashBarX - 2, dashBarY - 2, dashBarWidth + 4, dashBarHeight + 4, 6);
        this.dashBarBg.setScrollFactor(0);
        this.dashBarBg.setDepth(100);
        this.hudContainer.add(this.dashBarBg);
        
        this.dashBar = this.scene.add.graphics();
        this.dashBar.setScrollFactor(0);
        this.dashBar.setDepth(100);
        this.hudContainer.add(this.dashBar);
        
        this.dashText = this.scene.add.text(dashBarX + dashBarWidth + 10, dashBarY - 3, '', {
            fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
            fontSize: '14px',
            color: '#969696' // (150, 150, 150)
        });
        this.dashText.setScrollFactor(0);
        this.dashText.setDepth(100);
        this.hudContainer.add(this.dashText);
        
        // Power-up indicators - 支持多个效果同时显示，垂直排列
        // 每个效果有独立的文本对象，避免重叠
        this.powerTexts = []; // 数组存储多个效果文本
        for (let i = 0; i < 3; i++) {
            const powerText = this.scene.add.text(CONFIG.WIDTH / 2, 75 + i * 25, '', {
                fontFamily: 'MontserratAlternates-Bold, Arial, sans-serif',
                fontSize: '18px',
                color: '#ff3232', // 默认红色，会根据效果类型改变
                stroke: '#000000',
                strokeThickness: 2,
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true }
            });
            powerText.setOrigin(0.5);
            powerText.setScrollFactor(0);
            powerText.setDepth(100);
            powerText.setVisible(false);
            this.powerTexts.push(powerText);
        }
    }
    
    update(time, player, gameState) {
        // Health bar - 完全按照 dash 条的实现方式重写
        // Python: draw_health_bar_fancy(15, 15, 200, 25, player.health, 100)
        if (!player || !this.healthBar || !this.healthText || !this.healthTextShadow) return;
        
        // 安全检查：确保 maxHealth 存在且不为 0
        // player.maxHealth 可能不存在，使用 player.sprite.maxHealth 或默认值 100
        const maxHealth = (player.sprite && player.sprite.maxHealth) ? player.sprite.maxHealth : 100;
        const currentHealth = player.health || 0;
        const healthRatio = maxHealth > 0 ? Math.max(0, Math.min(1, currentHealth / maxHealth)) : 0;
        const healthBarX = 15;
        const healthBarY = 15;
        const healthBarWidth = 200;
        const healthBarHeight = 25;
        
        // 完全按照 dashBar 的方式：每帧 clear，然后绘制
        this.healthBar.clear();
        
        // 先绘制内背景 (60, 60, 60) - Python: pygame.draw.rect(screen, (60, 60, 60), ...)
        this.healthBar.fillStyle(0x3c3c3c, 1); // (60, 60, 60)
        this.healthBar.fillRoundedRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 3);
        
        // 然后绘制颜色条 (gradient) - Python: if ratio > 0: draw_gradient_rect()
        if (healthRatio > 0) {
            const barWidth = Math.floor(healthBarWidth * healthRatio);
            let color1, color2;
            
            // Python: if ratio > 0.6: green, elif ratio > 0.3: yellow/orange, else: red
            if (healthRatio > 0.6) {
                color1 = { r: 50, g: 205, b: 50 };   // Green
                color2 = { r: 100, g: 255, b: 100 };
            } else if (healthRatio > 0.3) {
                color1 = { r: 255, g: 200, b: 0 };  // Orange/Yellow
                color2 = { r: 255, g: 255, b: 100 };
            } else {
                color1 = { r: 220, g: 50, b: 50 }; // Red
                color2 = { r: 255, g: 100, b: 100 };
            }
            
            // Draw gradient - 和 dashBar 完全一样的绘制方式
            for (let i = 0; i < barWidth; i++) {
                const ratio = barWidth > 1 ? i / (barWidth - 1) : 0;
                const r = Math.floor(color1.r * (1 - ratio) + color2.r * ratio);
                const g = Math.floor(color1.g * (1 - ratio) + color2.g * ratio);
                const b = Math.floor(color1.b * (1 - ratio) + color2.b * ratio);
                const color = Phaser.Display.Color.GetColor(r, g, b);
                this.healthBar.fillStyle(color, 1);
                this.healthBar.fillRect(healthBarX + i, healthBarY, 1, healthBarHeight);
            }
        }
        
        // 光泽效果 - Python: (255, 255, 255, 50) over full width, height // 3
        this.healthBar.fillStyle(0xffffff, 0.196); // (255, 255, 255, 50/255)
        this.healthBar.fillRoundedRect(healthBarX, healthBarY, healthBarWidth, Math.floor(healthBarHeight / 3), 3);
        
        // 文本更新
        const healthText = `${Math.max(0, Math.floor(currentHealth))}/${maxHealth}`;
        if (this.healthTextShadow) this.healthTextShadow.setText(healthText);
        if (this.healthText) this.healthText.setText(healthText);
        
        // Wave indicator
        if (this.waveText && this.waveGlow1 && this.waveGlow2) {
            this.waveText.setText(`WAVE ${gameState.wave}`);
            this.waveGlow1.setText(`WAVE ${gameState.wave}`);
            this.waveGlow2.setText(`WAVE ${gameState.wave}`);
        }
        
        // Stats
        if (this.killsText) this.killsText.setText(`Kills: ${gameState.kills}`);
        if (this.coinsText) this.coinsText.setText(`Coins: ${gameState.coins}`);
        if (this.weaponText) this.weaponText.setText(`Weapon Lv.${gameState.weaponLevel}`);
        
        // Dash bar - Python: draw_dash_bar() - bar_x=15, bar_y=50, bar_width=120, bar_height=12
        const dashBarX = 15;
        const dashBarY = 50;
        const dashBarWidth = 120;
        const dashBarHeight = 12;
        
        const dashCooldown = CONFIG.DASH_COOLDOWN;
        const dashElapsed = time - gameState.lastDashTime;
        const dashRatio = Math.min(1, dashElapsed / dashCooldown);
        
        this.dashBar.clear();
        if (dashRatio >= 1) {
            // Ready - pulsing green - Python: pulse = abs(math.sin(current_time / 200)) * 50
            const pulse = Math.abs(Math.sin(time / 200)) * 50;
            const color1 = { r: 50, g: Math.floor(200 + pulse), b: 50 };
            const color2 = { r: 100, g: 255, b: 100 };
            for (let i = 0; i < dashBarWidth; i++) {
                const ratio = dashBarWidth > 1 ? i / (dashBarWidth - 1) : 0;
                const r = Math.floor(color1.r * (1 - ratio) + color2.r * ratio);
                const g = Math.floor(color1.g * (1 - ratio) + color2.g * ratio);
                const b = Math.floor(color1.b * (1 - ratio) + color2.b * ratio);
                const color = Phaser.Display.Color.GetColor(r, g, b);
                this.dashBar.fillStyle(color, 1);
                this.dashBar.fillRect(dashBarX + i, dashBarY, 1, dashBarHeight);
            }
            this.dashText.setText('DASH READY!');
            this.dashText.setColor('#64ff64'); // (100, 255, 100)
        } else {
            // Cooldown - gradient from blue to cyan - Python: (50, 150, 200) to (100, 200, 255)
            const barWidth = Math.floor(dashBarWidth * dashRatio);
            const color1 = { r: 50, g: 150, b: 200 };
            const color2 = { r: 100, g: 200, b: 255 };
            for (let i = 0; i < barWidth; i++) {
                const ratio = barWidth > 1 ? i / (barWidth - 1) : 0;
                const r = Math.floor(color1.r * (1 - ratio) + color2.r * ratio);
                const g = Math.floor(color1.g * (1 - ratio) + color2.g * ratio);
                const b = Math.floor(color1.b * (1 - ratio) + color2.b * ratio);
                const color = Phaser.Display.Color.GetColor(r, g, b);
                this.dashBar.fillStyle(color, 1);
                this.dashBar.fillRect(dashBarX + i, dashBarY, 1, dashBarHeight);
            }
            this.dashText.setText('DASH [SPACE]');
            this.dashText.setColor('#969696'); // (150, 150, 150)
        }
        
        // Power-up indicators - 支持多个效果同时显示，每个效果独立显示
        let textIndex = 0;
        
        // 隐藏所有文本
        this.powerTexts.forEach(text => text.setVisible(false));
        
        // 红色星星 - INVINCIBLE
        if (gameState.powerInvincible) {
            const remaining = Math.ceil((CONFIG.POWER_DURATION - (time - gameState.powerInvincibleTimer)) / 1000);
            if (textIndex < this.powerTexts.length) {
                this.powerTexts[textIndex].setText(`INVINCIBLE: ${remaining}s`);
                this.powerTexts[textIndex].setColor('#ff5050'); // 红色，匹配红色星星
                this.powerTexts[textIndex].setY(75 + textIndex * 25);
                this.powerTexts[textIndex].setVisible(true);
                textIndex++;
            }
        }
        
        // 黄色星星 - MULTISHOT
        if (gameState.powerMultishot) {
            const remaining = Math.ceil((CONFIG.POWER_DURATION - (time - gameState.powerMultishotTimer)) / 1000);
            if (textIndex < this.powerTexts.length) {
                this.powerTexts[textIndex].setText(`MULTISHOT: ${remaining}s`);
                this.powerTexts[textIndex].setColor('#ffdc32'); // 金色，匹配黄色星星
                this.powerTexts[textIndex].setY(75 + textIndex * 25);
                this.powerTexts[textIndex].setVisible(true);
                textIndex++;
            }
        }
        
        // 紫色星星 - BOSS KILLER
        if (gameState.powerPurple) {
            const remaining = Math.ceil((CONFIG.POWER_DURATION - (time - gameState.powerPurpleTimer)) / 1000);
            if (textIndex < this.powerTexts.length) {
                this.powerTexts[textIndex].setText(`BOSS KILLER: ${remaining}s`);
                this.powerTexts[textIndex].setColor('#c850ff'); // 紫色，匹配紫色星星
                this.powerTexts[textIndex].setY(75 + textIndex * 25);
                this.powerTexts[textIndex].setVisible(true);
                textIndex++;
            }
        }
    }
}
