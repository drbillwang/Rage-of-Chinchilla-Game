// Particle class - visual effects for deaths and explosions
class Particle {
    constructor(scene, x, y, color, velocity, size = 5, lifetime = 30) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = velocity[0];
        this.vy = velocity[1];
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        
        // Create graphics
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(6);
    }
    
    update(scrollCamera) {
        this.x += this.vx + scrollCamera[0];
        this.y += this.vy + scrollCamera[1];
        this.lifetime -= 1;
        this.size = Math.max(1, this.size * 0.95);
        
        return this.lifetime > 0;
    }
    
    draw() {
        const alpha = this.lifetime / this.maxLifetime;
        const alphaValue = Math.floor(255 * alpha);
        
        this.graphics.clear();
        this.graphics.fillStyle(this.color, alpha);
        this.graphics.fillCircle(this.x, this.y, this.size);
    }
    
    destroy() {
        this.graphics.destroy();
    }
}

// Helper function to spawn particles - Python: spawn_particles()
function spawnParticles(scene, x, y, color, count = 10, speed = 5) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed * 2 + speed * 0.5;
        const vx = Math.cos(angle) * vel;
        const vy = Math.sin(angle) * vel;
        // Increase particle size - user wants bigger blood effect
        const size = Phaser.Math.Between(6, 12); // Increased from 3-8 to 6-12
        const lifetime = Phaser.Math.Between(20, 40);
        
        particles.push(new Particle(scene, x, y, color, [vx, vy], size, lifetime));
    }
    
    return particles;
}
