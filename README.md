# Rage of the Chinchilla

A top-down survival shooter game built with **JavaScript/Phaser.js**. Control Smile the Chinchilla and survive endless waves of enemies!

> **Note:** The original Python/Pygame version is available in the [`pygame-version`](https://github.com/drbillwang/Rage-of-Chinchilla-Game/tree/pygame-version) branch.

## 🎮 How to Play

### Quick Start

1. **Clone or download** this repository
2. **Start a local server** in the project root directory:
   ```bash
   # Option 1: Python
   python -m http.server 9000
   
   # Option 2: Node.js (if you have it)
   npx http-server -p 9000
   
   # Option 3: Use the provided batch file (Windows)
   start_server.bat
   ```
3. **Open your browser** and navigate to:
   ```
   http://localhost:9000
   ```

That's it! The game should load automatically.

## 🎯 Controls

| Key   | Action         |
| ----- | -------------- |
| WASD  | Move           |
| Mouse | Aim & Shoot    |
| Space | Dash           |
| ESC   | Pause / Shop   |
| 1-4   | Shop purchases |

## ✨ Features

- **Wave System**: Endless survival mode with progressive difficulty
- **Boss Enemies**: Larger enemies with unique attacks starting from Wave 3
- **Power-Up Stars**: 
  - 🔴 Red (Invincibility)
  - 🟡 Yellow (16-directional Multishot)
  - 🟣 Purple (Boss Killer)
- **Shop System**: Upgrade weapons, buy health, unlock laser sight
- **Dash Ability**: Quick dodge with spacebar
- **Combo System**: Chain kills for bonus rewards
- **Enhanced UI**: Animated menus, gradient health bar, visual effects
- **Smooth Transitions**: Fade effects between scenes

## 📁 Project Structure

```
Rage-of-Chinchilla-Game/
├── index.html          # Main HTML file
├── js/                 # JavaScript game code
│   ├── game.js         # Phaser game initialization
│   ├── config.js       # Game configuration
│   ├── PreloadScene.js # Asset loading
│   ├── MenuScene.js    # Main menu
│   ├── GameScene.js    # Main game logic
│   ├── Player.js       # Player class
│   ├── Weapon.js       # Weapon class
│   ├── Enemy.js        # Enemy class
│   ├── Bullet.js       # Bullet class
│   ├── Item.js         # Pickup items
│   ├── Star.js         # Power-up stars
│   ├── HUD.js          # UI elements
│   ├── Background.js   # Map and background
│   └── Particle.js     # Particle effects
├── images/             # Game sprites and textures
├── sound/              # Sound effects and music
├── maps/               # Map data
└── fonts/              # Custom fonts
```

## 🚀 Deploy to GitHub Pages

This repository is ready for GitHub Pages! Just enable it in your repository settings:

1. Go to **Settings** → **Pages**
2. Select **Source**: `main` branch
3. The game will be available at: `https://yourusername.github.io/Rage-of-Chinchilla-Game/`

## 🐍 Python Version

The original Python/Pygame version is preserved in the [`pygame-version`](https://github.com/drbillwang/Rage-of-Chinchilla-Game/tree/pygame-version) branch. To play it:

```bash
git checkout pygame-version
pip install -r requirements.txt
python game.py
```

## 📸 Screenshots

![Start Screen](screenshots/start_screen.png)
![Gameplay](screenshots/gameplay.png)
![Shop System](screenshots/shop.png)

## 🎨 Credits

- **Characters**: SMILE emoji from WeChat
- **Weapon**: Inspired by Halo's Sangheili plasma rifle
- **Game Engine**: [Phaser.js](https://phaser.io/)
- **Tutorial Reference**: [Coding With Russ](https://www.youtube.com/c/CodingWithRuss)

## 📝 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

_Originally created as CS50 Final Project (December 2022)_  
_JavaScript port completed January 2026_
