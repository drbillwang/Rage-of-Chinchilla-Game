// Background class - handles map tiles, obstacles, and decorations
class Background {
    constructor(scene, mapText) {
        this.scene = scene;
        this.mapTiles = [];
        this.obstacleTiles = [];
        this.decorations = [];
        
        this.loadMap(mapText);
        this.createWalls();
        this.createDecorations();
    }
    
    loadMap(mapText) {
        const rows = mapText.trim().split('\n');
        const mapData = rows.map(row => row.split(',').map(Number));
        const tileSize = CONFIG.TILE_SIZE;
        
        // Create tile sprites
        for (let y = 0; y < mapData.length; y++) {
            for (let x = 0; x < mapData[y].length; x++) {
                const tileType = mapData[y][x];
                const worldX = x * tileSize;
                const worldY = y * tileSize;
                
                let tileSprite = null;
                
                if (tileType === 0) {
                    // Grass tile
                    tileSprite = this.scene.add.image(worldX, worldY, 'tile_0');
                } else if (tileType >= 1 && tileType <= 3) {
                    // Wall tiles
                    tileSprite = this.scene.add.image(worldX, worldY, `tile_${tileType}`);
                    this.obstacleTiles.push({
                        x: worldX,
                        y: worldY,
                        width: tileSize,
                        height: tileSize,
                        rect: new Phaser.Geom.Rectangle(worldX - tileSize/2, worldY - tileSize/2, tileSize, tileSize)
                    });
                } else if (tileType >= 4 && tileType <= 7) {
                    // Other tiles (enemies, items, player spawn) - show as grass
                    tileSprite = this.scene.add.image(worldX, worldY, 'tile_0');
                }
                
                if (tileSprite) {
                    tileSprite.setOrigin(0, 0);
                    tileSprite.setDepth(0);
                    tileSprite.setScrollFactor(1, 1);
                    this.mapTiles.push(tileSprite);
                }
            }
        }
    }
    
    createWalls() {
        const wallThickness = 48; // 3 tiles
        
        // Top wall
        this.topWall = this.scene.add.rectangle(CONFIG.MAP_SIZE/2, wallThickness/2, CONFIG.MAP_SIZE, wallThickness);
        this.scene.physics.add.existing(this.topWall, true);
        
        // Bottom wall
        this.bottomWall = this.scene.add.rectangle(CONFIG.MAP_SIZE/2, CONFIG.MAP_SIZE - wallThickness/2, CONFIG.MAP_SIZE, wallThickness);
        this.scene.physics.add.existing(this.bottomWall, true);
        
        // Left wall
        this.leftWall = this.scene.add.rectangle(wallThickness/2, CONFIG.MAP_SIZE/2, wallThickness, CONFIG.MAP_SIZE);
        this.scene.physics.add.existing(this.leftWall, true);
        
        // Right wall
        this.rightWall = this.scene.add.rectangle(CONFIG.MAP_SIZE - wallThickness/2, CONFIG.MAP_SIZE/2, wallThickness, CONFIG.MAP_SIZE);
        this.scene.physics.add.existing(this.rightWall, true);
        
        this.walls = [this.topWall, this.bottomWall, this.leftWall, this.rightWall];
    }
    
    createDecorations() {
        // Python: decoration_colors
        const colors = [0x228b22, 0x32cd32, 0x90ee90, 0xffb6c1, 0xffff64, 0xffc864, 0xc896ff];
        
        // Python: Generate 150 decorations
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(CONFIG.MAP_X_START + 50, CONFIG.MAP_X_END - 50);
            const y = Phaser.Math.Between(CONFIG.MAP_Y_START + 50, CONFIG.MAP_Y_END - 50);
            const type = Phaser.Math.Between(0, 2); // 0=grass, 1=small flower, 2=big flower
            const color = Phaser.Math.RND.pick(colors);
            
            this.decorations.push({ x, y, type, color });
        }
        
        // Create graphics layer - Python: decorations drawn after background but before game objects
        this.decorationGraphics = this.scene.add.graphics();
        this.decorationGraphics.setDepth(1);
        this.decorationGraphics.setScrollFactor(1, 1); // Follow camera
    }
    
    drawDecorations() {
        this.decorationGraphics.clear();
        
        const cam = this.scene.cameras.main;
        const camX = cam.scrollX;
        const camY = cam.scrollY;
        const camWidth = cam.width;
        const camHeight = cam.height;
        
        // Python: Only draw if on screen (-20 < dx < WINDOW_WIDTH + 20)
        // Python: dx, dy are screen coordinates after scroll_camera update
        // In JS, decorations are in world coordinates, we convert to screen for culling
        this.decorations.forEach(deco => {
            // Convert world coordinates to screen coordinates for culling check
            const screenX = deco.x - camX;
            const screenY = deco.y - camY;
            
            // Python: if -20 < dx < constants.WINDOW_WIDTH + 20 and -20 < dy < constants.WINDOW_HEIGHT + 20
            if (screenX > -20 && screenX < camWidth + 20 && 
                screenY > -20 && screenY < camHeight + 20) {
                
                // Use world coordinates for drawing (setScrollFactor handles camera)
                // But since we're using graphics with setScrollFactor, we need to use world coords
                // Actually, with setScrollFactor(1,1), graphics should auto-scroll, so use world coords
                const worldX = deco.x;
                const worldY = deco.y;
                
                if (deco.type === 0) {
                    // Grass tuft - Python: 3 lines from (dx, dy)
                    // Python: pygame.draw.line(screen, deco[3], (dx, dy), (dx - 3, dy - 8), 2)
                    this.decorationGraphics.lineStyle(2, deco.color, 1);
                    this.decorationGraphics.lineBetween(worldX, worldY, worldX - 3, worldY - 8);
                    this.decorationGraphics.lineBetween(worldX, worldY, worldX + 2, worldY - 10);
                    this.decorationGraphics.lineBetween(worldX, worldY, worldX + 5, worldY - 7);
                } else if (deco.type === 1) {
                    // Small flower - Python: pygame.draw.circle(screen, deco[3], (dx, dy), 3)
                    // Python: pygame.draw.line(screen, (34, 139, 34), (dx, dy + 3), (dx, dy + 10), 2)
                    this.decorationGraphics.fillStyle(deco.color, 1);
                    this.decorationGraphics.fillCircle(worldX, worldY, 3);
                    this.decorationGraphics.lineStyle(2, 0x228b22, 1); // (34, 139, 34) = Forest green
                    this.decorationGraphics.lineBetween(worldX, worldY + 3, worldX, worldY + 10);
                } else {
                    // Big flower - Python: pygame.draw.circle(screen, deco[3], (dx, dy), 5)
                    // Python: pygame.draw.circle(screen, (255, 255, 200), (dx, dy), 2)
                    // Python: pygame.draw.line(screen, (34, 139, 34), (dx, dy + 5), (dx, dy + 15), 2)
                    this.decorationGraphics.fillStyle(deco.color, 1);
                    this.decorationGraphics.fillCircle(worldX, worldY, 5);
                    this.decorationGraphics.fillStyle(0xfffec8, 1); // (255, 255, 200)
                    this.decorationGraphics.fillCircle(worldX, worldY, 2);
                    this.decorationGraphics.lineStyle(2, 0x228b22, 1); // (34, 139, 34) = Forest green
                    this.decorationGraphics.lineBetween(worldX, worldY + 5, worldX, worldY + 15);
                }
            }
        });
    }
    
    isValidSpawnPosition(x, y, isBoss = false) {
        // Python: is_valid_spawn_position() - check if NOT colliding with obstacles
        // Boss is 2x size, so use larger test rect for boss
        let size;
        if (isBoss) {
            size = CONFIG.CHARACTER_SIZE_X * CONFIG.BOSS_SCALE; // 96 * 2 = 192
        } else {
            size = CONFIG.CHARACTER_SIZE_X; // 96
        }
        const testRect = new Phaser.Geom.Rectangle(x - size / 2, y - size / 2, size, size);
        
        for (const obstacle of this.obstacleTiles) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(testRect, obstacle.rect)) {
                return false;
            }
        }
        return true;
    }
}
