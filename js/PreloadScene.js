class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffd700, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
        
        // Load images from images directory
        const basePath = 'images/';
        
        // Player sprites
        for (let i = 0; i < 4; i++) {
            this.load.image(`player_normal_${i}`, `${basePath}characters/smile/normal/${i}.png`);
            this.load.image(`player_dead_${i}`, `${basePath}characters/smile/dead/${i}.png`);
            this.load.image(`player_sunglasses_${i}`, `${basePath}characters/smile/sunglasses/${i}.png`);
        }
        
        // Enemy sprites - antonio_zombie (character_type 1)
        for (let i = 0; i < 4; i++) {
            this.load.image(`enemy_1_normal_${i}`, `${basePath}characters/antonio_zombie/normal/${i}.png`);
            this.load.image(`enemy_1_dead_${i}`, `${basePath}characters/antonio_zombie/dead/${i}.png`);
        }
        
        // Enemy sprites - joker_zombie (character_type 2)
        for (let i = 0; i < 4; i++) {
            this.load.image(`enemy_2_normal_${i}`, `${basePath}characters/joker_zombie/normal/${i}.png`);
            this.load.image(`enemy_2_dead_${i}`, `${basePath}characters/joker_zombie/dead/${i}.png`);
        }
        
        // Enemy sprites - antonio_shooter (character_type 4)
        for (let i = 0; i < 4; i++) {
            this.load.image(`enemy_4_normal_${i}`, `${basePath}characters/antonio_shooter/normal/${i}.png`);
            this.load.image(`enemy_4_dead_${i}`, `${basePath}characters/antonio_shooter/dead/${i}.png`);
        }
        
        // Enemy sprites - joker_shooter (character_type 4 alternative)
        for (let i = 0; i < 4; i++) {
            this.load.image(`enemy_4j_normal_${i}`, `${basePath}characters/joker_shooter/normal/${i}.png`);
            this.load.image(`enemy_4j_dead_${i}`, `${basePath}characters/joker_shooter/dead/${i}.png`);
        }
        
        // Weapons
        this.load.image('gun', `${basePath}weapons/0.png`);
        this.load.image('bullet', `${basePath}weapons/bullet.png`);
        this.load.image('shooter_bullet', `${basePath}weapons/shooter_bullet.png`);
        
        // Items
        for (let i = 0; i < 4; i++) {
            this.load.image(`coin_${i}`, `${basePath}items/money_f${i}.png`);
        }
        this.load.image('cola', `${basePath}items/cola.png`);
        
        // Background tiles
        for (let i = 0; i < 8; i++) {
            this.load.image(`tile_${i}`, `${basePath}background/${i}.png`);
        }
        
        // Life
        this.load.image('life', `${basePath}life/life.png`);
        this.load.image('life_empty', `${basePath}life/life_empty.png`);
        
        // Load sounds from sound directory
        this.load.audio('music', 'sound/music.mp3');
        this.load.audio('shot', 'sound/shooting.mp3');
        this.load.audio('hit', 'sound/hit.mp3');
        this.load.audio('potion', 'sound/portion.mp3');
        
        // Load map CSV
        this.load.text('map1', 'maps/map1_data.csv');
    }

    create() {
        this.scene.start('MenuScene');
    }
}
