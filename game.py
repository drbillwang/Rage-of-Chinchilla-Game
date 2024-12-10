import pygame
from pygame import mixer
import csv
import constants
from character import Character
from weapon import Weapon
from items import Item
from background import Background
from button import Button

mixer.init()
pygame.init()

# Game screen set up (width and height) with game name presented on the app
screen = pygame.display.set_mode((constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT))
pygame.display.set_caption("Rage of the Chinchilla")

# create a clock to fix frame rate so things don't run too fast
clock = pygame.time.Clock()

# define game variables
map = 1
start_intro = False
pause_game = False
start_game = False
scroll_camera = [0, 0]

# definition - player movement variables >> they are triggers
move_left = False
move_right = False
move_up = False
move_down = False

# define font
font = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", 20)




# scale images
def scale_image(image, scale):
    w = image.get_width()
    h = image.get_height()
    new_image = pygame.transform.scale(image, (w * scale, h * scale))
    return new_image

# music and sound
pygame.mixer.music.load("sound/music.mp3")
pygame.mixer.music.set_volume (0.5)
pygame.mixer.music.play(-1)

shot_fx = pygame.mixer.Sound("sound/shooting.mp3")
shot_fx.set_volume(0.5)

hit_fx = pygame.mixer.Sound("sound/hit.mp3")
hit_fx.set_volume(0.5)

portion_fx = pygame.mixer.Sound("sound/portion.mp3")
portion_fx.set_volume(0.5)




# button image
start_img = scale_image(pygame.image.load("images/buttons/start.png").convert_alpha(), constants.BUTTON_SCALE)
exit_img = scale_image(pygame.image.load("images/buttons/exit.png").convert_alpha(), constants.BUTTON_SCALE)
restart_img = scale_image(pygame.image.load("images/buttons/restart.png").convert_alpha(), constants.BUTTON_SCALE)
resume_img = scale_image(pygame.image.load("images/buttons/resume.png").convert_alpha(), constants.BUTTON_SCALE)



# load life image
life_image = scale_image(pygame.image.load("images/life/life.png").convert_alpha(), constants.LIFE_SCALE)

# load items images
money_image = []
for x in range(4):
    img = scale_image(pygame.image.load(f"images/items/money_f{x}.png").convert_alpha(), constants.MONEY_SCALE)
    money_image.append(img)

cola_image = scale_image(pygame.image.load("images/items/cola.png").convert_alpha(), constants.COLA_SCALE)

item_images = []
item_images.append(money_image)
item_images.append(cola_image)


# load weapon
gun_image = scale_image(pygame.image.load("images/weapons/0.png").convert_alpha(), constants.WEAPON_SCALE)
bullet_image = scale_image(pygame.image.load("images/weapons/bullet.png").convert_alpha(), constants.WEAPON_SCALE)
shooter_bullet_image = scale_image(pygame.image.load("images/weapons/shooter_bullet.png").convert_alpha(), constants.WEAPON_SCALE)


# load tilemap
tile_list = []
for x in range(constants.TILE_TYPES):
    tile_image = pygame.image.load(f"images/background/{x}.png").convert_alpha()
    tile_image = pygame.transform.scale(tile_image, (constants.TILE_SIZE, constants.TILE_SIZE))
    tile_list.append(tile_image)

# load player/enemies image
character_animations = []
character_types = ["smile", "antonio_zombie", "joker_zombie", "antonio_shooter", "joker_shooter"]
animation_type = ["normal", "dead"]
for character in character_types:
    # load images for different character and their status
    animation_list = []
    for animation in animation_type:
        # reset temporary list of images
        temp_list = []
        for i in range(4):
            player_image = pygame.image.load(f"images/characters/{character}/{animation}/{i}.png").convert_alpha()
            player_image = scale_image(player_image, constants.SCALE)
            temp_list.append(player_image)
        animation_list.append(temp_list)
    character_animations.append(animation_list)


# draw text for kills
def draw_text(text, font, text_col, x, y):
    img = font.render(text, True, text_col)
    screen.blit(img, (x, y))


# Game info
def draw_life():
    pygame.draw.rect(screen, constants.PANEL, (0, 0, constants.WINDOW_WIDTH, 100))
    pygame.draw.line(screen, constants.WHITE, (0, 100), (constants.WINDOW_WIDTH, 100))
    # draw life
    for i in range(5):
        if player.health >= ((i + 1) * 20):
            screen.blit(life_image, (10 + i * 50, 0))
        elif player.health > 0:
            screen.blit(life_image, (10, 0))

    # draw Kill counts on top
    draw_text(f"Kills: {player.score}", font, constants.WHITE, constants.WINDOW_WIDTH - 200, 15)


# create tile list
background_data = []
for row in range(constants.ROWS):
    r = [-1] * constants.COLS
    background_data.append(r)

# load csv for different maps
with open(f"maps/map{map}_data.csv", newline="") as csvfile:
    reader = csv.reader(csvfile, delimiter=",")
    for x, row in enumerate(reader):
        for y, tile in enumerate(row):
            background_data[x][y] = int(tile)

# load in map data and create world


background = Background()
background.process_data(background_data, tile_list, item_images, character_animations)

def reset_map():
    damage_group.empty()
    bullet_group.empty()
    item_group.empty()
    shooter_bullet_group.empty()

    # empty tile list
    data = []
    for row in range (constants.ROWS):
        r = [-1] * constants.COLS
        data.append(r)

    return data



# class text class
class DamageText(pygame.sprite.Sprite):
    def __init__(self, x, y, damage, color):
        pygame.sprite.Sprite.__init__(self)
        self.image = font.render(damage, True, color)
        self.rect = self.image.get_rect()
        self.rect.center = (x, y)
        self.counter = 0

    def update(self):
        # reposition based on screen scroll
        self.rect.x += scroll_camera[0]
        self.rect.y += scroll_camera[1]
        # move damage text up
        self.rect.y -= 2
        # delete counter after a few sec
        self.counter += 1
        if self.counter > 10:
            self.kill()

# Screen fading effect

class ScreenFade():
    def __init__ (self, direction, color, speed):
        self.direction = direction
        self. color = color
        self.speed = speed
        self.fade_counter = 0

    def fade (self):
        fade_complete = False
        self.fade_counter += self.speed
        if self.direction == 1:# outward moving for screen changes
            pygame.draw.rect(screen, self.color, (0 - self.fade_counter, 0, constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT))
            pygame.draw.rect(screen, self.color, (constants.WINDOW_WIDTH // 2 + self.fade_counter, 0, constants.WINDOW_WIDTH, constants.WINDOW_HEIGHT))
        elif self.direction == 2:# outward moving after game over screen changes
            pygame.draw.rect(screen, self.color, (0, 0, constants.WINDOW_WIDTH, 0 + self.fade_counter))

        if self.fade_counter >= constants.WINDOW_WIDTH:
            fade_complete = True

        return fade_complete

# Create player
player = background.player

# Create enemy from background data



# Create weapon
gun = Weapon(gun_image, bullet_image)

# Create enemy from background data
enemy_list = background.enemy_list



# create damage / bullet group
damage_group = pygame.sprite.Group()
bullet_group = pygame.sprite.Group()
item_group = pygame.sprite.Group()
shooter_bullet_group = pygame.sprite.Group()



# add items from map csv

for item in background.item_list:
    item_group.add(item)






# screen fade
intro_fade = ScreenFade(1, constants.BACKGROUND, 16)
game_over_fade = ScreenFade(2, constants.BACKGROUND, 16)


# create button
start_button = Button(constants.WINDOW_WIDTH // 2 - 400, constants.WINDOW_HEIGHT - 400, start_img)
exit_button = Button(constants.WINDOW_WIDTH // 2 - 400, constants.WINDOW_HEIGHT - 200, exit_img)
restart_button = Button(constants.WINDOW_WIDTH // 2 - 400, constants.WINDOW_HEIGHT - 400, restart_img)
resume_button = Button(constants.WINDOW_WIDTH // 2 - 400, constants.WINDOW_HEIGHT - 400, resume_img)


# use a while loop as the main game loop for the game keep running
run = True
while run:
    # control frame rate
    clock.tick(constants.FPS)

    if start_game == False:
        screen.fill(constants.BACKGROUND)
        if start_button.draw(screen):
            start_game = True
            start_intro = True
        if exit_button.draw(screen):
            run = False
    else:
        if pause_game == True:
            screen.fill(constants.BACKGROUND)
            draw_text(f"Total Kills: {player.score}", font, constants.WHITE, constants.WINDOW_WIDTH // 2 + 50,
                      constants.WINDOW_HEIGHT // 2)
            if resume_button.draw(screen):
                pause_game = False
            if exit_button.draw(screen):
                run = False
        else:
            # control screen background
            screen.fill(constants.BACKGROUND)

            if player.alive:

                # Player movement calculation
                change_x = 0
                change_y = 0
                if move_left == True:
                    change_x = -constants.SPEED
                if move_right == True:
                    change_x = constants.SPEED
                if move_up == True:
                    change_y = -constants.SPEED
                if move_down == True:
                    change_y = constants.SPEED

                # Move Player
                scroll_camera = player.move(change_x, change_y, background.obstacle_tiles)

                # Update player / enemy / camera / etc.
                background.update(scroll_camera)
                for enemy in enemy_list:
                    shooter_bullet = enemy.ai(player, background.obstacle_tiles, scroll_camera, shooter_bullet_image)
                    if shooter_bullet:
                        shooter_bullet_group.add(shooter_bullet)
                    if enemy.alive:
                        enemy.update()


                player.update()
                bullet = gun.update(player)
                if bullet:
                    bullet_group.add(bullet)
                    shot_fx.play()
                for bullet in bullet_group:
                    damage, damage_pos = bullet.update(scroll_camera, background.obstacle_tiles, enemy_list)
                    if damage:
                        damage_text = DamageText(damage_pos.centerx, damage_pos.y, str(-damage), constants.RED)
                        damage_group.add(damage_text)
                        hit_fx.play()
                damage_group.update()
                item_group.update(scroll_camera, player, portion_fx)
                shooter_bullet_group.update(scroll_camera, background.obstacle_tiles, player)


            # draw player on screen
            background.draw(screen)
            for enemy in enemy_list:
                enemy.draw(screen)
            player.draw(screen)
            for bullet in bullet_group:
                bullet.draw(screen)
            for shooter_bullet in shooter_bullet_group:
                shooter_bullet.draw(screen)
            gun.draw(screen)
            damage_group.draw(screen)
            item_group.draw(screen)
            draw_life()

            # show game over screen
            if player.alive == False:
                if game_over_fade.fade():
                    draw_text(f"Total Kills: {player.score}", font, constants.WHITE, constants.WINDOW_WIDTH // 2 + 50, constants.WINDOW_HEIGHT // 2)
                    if restart_button.draw(screen):
                        game_over_fade.fade_counter = 0
                        start_intro = True
                        player.health = constants.PLAYER_INITIAL_HEALTH
                        player.score = constants.INITIAL_KILL
                        background_data = reset_map()
                        with open(f"maps/map{map}_data.csv", newline="") as csvfile:
                            reader = csv.reader(csvfile, delimiter=",")
                            for x, row in enumerate(reader):
                                for y, tile in enumerate(row):
                                    background_data[x][y] = int(tile)
                        background = Background()
                        background.process_data(background_data, tile_list, item_images, character_animations)
                        player = background.player
                        enemy_list = background.enemy_list
                        for item in background.item_list:
                            item_group.add(item)





                    if exit_button.draw(screen):
                        run = False

            if start_intro == True:
                intro_fade.fade()


    # build event handler tracks exit, keyboard etc.
    # conditional on exit event to break loop. Use for loop. Quit event is the cross symbol on top right corner
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            run = False
        # Keyboard - if they are pressed down or released
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_a:
                move_left = True
            if event.key == pygame.K_d:
                move_right = True
            if event.key == pygame.K_w:
                move_up = True
            if event.key == pygame.K_s:
                move_down = True
            if event.key == pygame.K_ESCAPE:
                pause_game = True

        if event.type == pygame.KEYUP:
            if event.key == pygame.K_a:
                move_left = False
            if event.key == pygame.K_d:
                move_right = False
            if event.key == pygame.K_w:
                move_up = False
            if event.key == pygame.K_s:
                move_down = False
    pygame.display.update()

pygame.quit()
