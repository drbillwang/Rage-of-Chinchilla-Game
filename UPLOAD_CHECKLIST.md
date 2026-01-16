# GitHub上传清单 - Python游戏文件

## ✅ 必须上传的文件

### Python源代码
- ✅ `game.py` - 主游戏逻辑（可直接运行）
- ✅ `character.py` - 角色类
- ✅ `weapon.py` - 武器类
- ✅ `items.py` - 物品类
- ✅ `background.py` - 背景/地图类
- ✅ `button.py` - 按钮类
- ✅ `constants.py` - 常量定义

### 资源文件
- ✅ `images/` - 所有图片资源
- ✅ `sound/` - 所有音效文件
- ✅ `fonts/` - 字体文件
- ✅ `maps/` - 地图数据

### 截图
- ✅ `screenshots/start_screen.png` - 主菜单截图
- ✅ `screenshots/gameplay.png` - 游戏画面截图
- ✅ `screenshots/shop.png` - 商店界面截图

### 文档
- ✅ `README.md` - 项目说明
- ✅ `CHANGELOG.md` - 版本更新日志
- ✅ `.gitignore` - Git忽略文件

## ❌ 不要上传

- ❌ `__pycache__/` - Python缓存（已忽略）
- ❌ `*.pyc` - Python编译文件（已忽略）
- ❌ `web/` - JS版本（不需要）
- ❌ `Screenshot*.png` - 根目录截图（已移到screenshots/）
- ❌ `start_server.bat` - Windows脚本（不需要）
- ❌ `GITHUB_DIFF.md` - 临时文档（不需要）
- ❌ `*.md` 除了 README.md 和 CHANGELOG.md

## 📋 Git命令

```bash
# 1. 添加所有Python游戏文件
git add *.py
git add README.md CHANGELOG.md .gitignore
git add images/ sound/ fonts/ maps/ screenshots/

# 2. 检查状态
git status

# 3. 提交
git commit -m "Upload Python game v2.0 with screenshots"

# 4. 推送到GitHub
git push origin main
```

## 🎮 用户下载后如何运行

1. 安装Python 3.x
2. 安装Pygame: `pip install pygame`
3. 运行: `python game.py`

## 📸 截图对应关系

- `Screenshot 2026-01-16 131656.png` → `screenshots/start_screen.png` (主菜单)
- `Screenshot 2026-01-16 131912.png` → `screenshots/gameplay.png` (游戏画面)
- `Screenshot 2026-01-16 132052.png` → `screenshots/shop.png` (商店)
