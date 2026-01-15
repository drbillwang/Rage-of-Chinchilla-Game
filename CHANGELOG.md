# Changelog

## v2.0 - Major Update (January 2026)

### New Features

**Wave System**
- Endless survival mode with progressive difficulty
- Enemy count and strength scale with each wave
- 3-second countdown before each wave starts
- Wave completion celebration with bonus rewards

**Boss Enemies**
- Boss enemies spawn starting from Wave 3
- 2x size, increased health and speed
- Unique shotgun attack pattern for shooter bosses
- Higher coin rewards for defeating bosses

**Power-Up Stars** (appear after Wave 3)
- Red Star: 10 seconds of invincibility + contact damage to enemies
- Yellow Star: 10 seconds of 16-directional shooting
- Purple Star: 3x damage to bosses, one-shot kill on regular enemies
- Stars spawn every 45 seconds, last 10 seconds on the ground
- Player wears sunglasses when power-up is active

**Shop System**
- Shop opens after each wave completion
- Weapon Upgrade: Increase damage (+10 per level)
- Health +20: Restore some health
- Full Heal: Restore to 100 HP
- Laser Sight: Permanent red aiming line (200 coins)

**Combat Improvements**
- Player dash ability (Spacebar) with 1-second cooldown
- Combo system for consecutive kills
- Screen shake effects on hits and boss deaths
- Death particles (red blood effect for enemies, gold for bosses)

**UI/UX Overhaul**
- Redesigned start screen with animated title and gradient background
- Stylized buttons with hover effects and animations
- Enhanced HUD with gradient health bar and wave display
- Improved pause menu and game over screen
- Stats display: Waves survived, total kills, coins earned

### Balance Changes
- Initial colas reduced from 5 to 2
- Cola spawn interval increased to 25 seconds
- Star spawn interval set to 45 seconds
- Enemy drop rates reduced (15% coin, 5% cola)
- Enemies spawn in batches that scale with wave number
- Maximum simultaneous enemies capped at 25

### Bug Fixes
- Fixed enemies spawning outside arena walls
- Fixed items spawning in invalid locations
- Fixed boss spawn logic (one boss event per wave)
- Fixed invincibility not preventing damage
- Fixed shooting on button click
- Fixed UI elements overlapping

### Technical
- Improved spawn validation with obstacle tile collision
- Added weapon upgrade system with damage bonuses
- Implemented particle system for visual effects
- Refactored button system with procedural drawing

---

## v1.0 - Initial Release (December 2022)

Original CS50 final project featuring:
- Basic shooting gameplay with Smile the Chinchilla
- Two enemy types: Antonio (melee) and Joker (ranged)
- Health restoration with cola pickups
- Kill tracking score system
