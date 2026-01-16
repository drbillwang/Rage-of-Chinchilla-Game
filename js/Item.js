// Item class - handles coins and health potions
class Item {
    constructor(scene, x, y, itemType) {
        this.scene = scene;
        this.itemType = itemType; // 0 = coin, 1 = cola
        
        const texKey = itemType === 0 ? 'coin_0' : 'cola';
        this.sprite = scene.physics.add.sprite(x, y, texKey);
        this.sprite.setScale(itemType === 0 ? CONFIG.MONEY_SCALE : CONFIG.COLA_SCALE);
        this.sprite.setDepth(7);
        
        // Coin animation
        if (itemType === 0) {
            this.sprite.animFrame = 0;
            this.sprite.animTimer = 0;
        }
        
        this.sprite.itemRef = this;
    }
    
    update(player, addCoinsCallback, potionSound) {
        if (!this.sprite.active) return;
        
        // Coin animation
        if (this.itemType === 0) {
            this.sprite.animTimer += 16;
            if (this.sprite.animTimer > 100) {
                this.sprite.animFrame = (this.sprite.animFrame + 1) % 4;
                this.sprite.setTexture(`coin_${this.sprite.animFrame}`);
                this.sprite.animTimer = 0;
            }
        }
        
        // Player pickup
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.sprite.getBounds(), player.rect)) {
            if (this.itemType === 0) {
                // Coin - Python: coin_callback(10)
                if (addCoinsCallback) {
                    addCoinsCallback(10);
                }
            } else if (this.itemType === 1) {
                // Cola - Python: player.health += 20, then if player.health > 100: player.health = 100
                player.health += 20;
                if (player.health > 100) {
                    player.health = 100;
                }
                potionSound.play();
            }
            this.sprite.destroy();
        }
    }
}
