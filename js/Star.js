// Star class - power-up stars (invincibility, multishot, boss killer)
class Star {
    constructor(scene, x, y, starType) {
        this.scene = scene;
        this.starType = starType; // 0=red, 1=yellow, 2=purple
        
        // Colors - Python: ((255, 80, 80), (255, 150, 150)) etc.
        const colors = [
            { core: 0xff5050, glow: 0xff9696 },    // Red
            { core: 0xffdc32, glow: 0xfff696 },    // Gold
            { core: 0xc850ff, glow: 0xe696ff }     // Purple
        ];
        
        this.color = colors[starType];
        this.spawnTime = scene.time.now;
        
        // Create star graphics - Python: _create_star_image() method
        const size = 70;
        const baseImage = scene.add.graphics();
        
        // Draw star shape - Python: 5-pointed star
        baseImage.clear();
        const center = size / 2;
        
        // Outer glow
        for (let r = 25; r > 10; r -= 3) {
            const alpha = (60 * (1 - (r - 10) / 15)) / 255;
            baseImage.fillStyle(this.color.glow, alpha);
            baseImage.fillCircle(center, center, r);
        }
        
        // Star shape points
        const points = [];
        for (let i = 0; i < 5; i++) {
            // Outer point
            const angle1 = Phaser.Math.DegToRad(i * 72 - 90);
            points.push(center + 22 * Math.cos(angle1));
            points.push(center + 22 * Math.sin(angle1));
            // Inner point
            const angle2 = Phaser.Math.DegToRad(i * 72 + 36 - 90);
            points.push(center + 10 * Math.cos(angle2));
            points.push(center + 10 * Math.sin(angle2));
        }
        
        baseImage.fillStyle(this.color.core, 1);
        baseImage.fillPoints(points, true);
        
        // Inner highlight
        const innerPoints = [];
        for (let i = 0; i < 5; i++) {
            const angle1 = Phaser.Math.DegToRad(i * 72 - 90);
            innerPoints.push(center + 12 * Math.cos(angle1));
            innerPoints.push(center + 12 * Math.sin(angle1));
            const angle2 = Phaser.Math.DegToRad(i * 72 + 36 - 90);
            innerPoints.push(center + 6 * Math.cos(angle2));
            innerPoints.push(center + 6 * Math.sin(angle2));
        }
        baseImage.fillStyle(this.color.glow, 1);
        baseImage.fillPoints(innerPoints, true);
        
        // Center sparkle
        baseImage.fillStyle(0xffffff, 1);
        baseImage.fillCircle(center, center, 4);
        
        // Generate texture
        baseImage.generateTexture('star_' + starType, size, size);
        baseImage.destroy();
        
        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'star_' + starType);
        this.sprite.setDepth(7);
        this.sprite.starRef = this;
        
        // Scale up 2.5x - user requested larger stars
        this.sprite.setScale(2.5);
        
        // Store base image reference for pulsing
        this.baseSize = size;
    }
    
    update(player) {
        if (!this.sprite.active) return null;
        
        // Pulsing animation - Python: pulse = 1.0 + 0.15 * sin((current_time - spawn_time) / 150)
        // Apply pulse on top of base 2.5x scale (user requested larger stars)
        const currentTime = this.scene.time.now;
        const pulse = 1.0 + 0.15 * Math.sin((currentTime - this.spawnTime) / 150);
        this.sprite.setScale(2.5 * pulse);
        
        // Check player collision
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.sprite.getBounds(), player.rect)) {
            this.sprite.destroy();
            return this.starType;
        }
        
        return null;
    }
}
