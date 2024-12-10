import pygame
import math
import weapon
import constants
import random



# use class to define a class of factors for the character
# make the self - character itself as the image
# rect is the rectangle captures position data x and y and size
class Character:
    def __init__(self, x, y, health, character_animations, character_type, shooter):
        self.alive = True
        self.character_type = character_type
        self.shooter = shooter
        self.score = 0
        self.flip = False
        self.animation_list = character_animations[character_type]
        self.frame_index = 0
        self.status = 0  # 0: normal, 1: dead
        self.update_time = pygame.time.get_ticks()
        self.sunglasses = False
        self.health = health
        self.hit = False
        self.last_hit = pygame.time.get_ticks()
        self.last_attack = pygame.time.get_ticks()
        self.stunned = False

        self.image = self.animation_list[self.status][self.frame_index]
        self.rect = pygame.Rect(0, 0, constants.CHARACTER_SIZE_X, constants.CHARACTER_SIZE_Y)
        self.rect.center = (x, y)



    def move(self, change_x, change_y, obstacle_tiles):
        scroll_camera = [0, 0]
        self.rect.x += change_x
        # check if collide with obstacles
        for obstacle in obstacle_tiles:
            if obstacle[1].colliderect(self.rect):
                if change_x > 0:
                    self.rect.right = obstacle[1].left
                if change_x < 0:
                    self.rect.left = obstacle[1].right

        self.rect.y += change_y
        # check if collide with obstacles
        for obstacle in obstacle_tiles:
            if obstacle[1].colliderect(self.rect):
                if change_y > 0:
                    self.rect.bottom = obstacle[1].top
                if change_y < 0:
                    self.rect.top = obstacle[1].bottom

        if change_x < 0:
            self.flip = True
        if change_x > 0:
            self.flip = False
        # diagonal speed calculation
        if change_x != 0 and change_y != 0:
            change_x = change_x * (math.sqrt(2) / 2)
            change_y = change_y * (math.sqrt(2) / 2)

        # screen camera only applies to player
        if self.character_type == 0:

            # update camera based on player position
            if self.rect.right > (constants.WINDOW_WIDTH - constants.SCROLL_EDGE):
                scroll_camera[0] = (constants.WINDOW_WIDTH - constants.SCROLL_EDGE) - self.rect.right
                self.rect.right = constants.WINDOW_WIDTH - constants.SCROLL_EDGE
            if self.rect.left < constants.SCROLL_EDGE:
                scroll_camera[0] = constants.SCROLL_EDGE - self.rect.left
                self.rect.left = constants.SCROLL_EDGE
            if self.rect.bottom > (constants.WINDOW_HEIGHT - constants.SCROLL_EDGE):
                scroll_camera[1] = (constants.WINDOW_HEIGHT - constants.SCROLL_EDGE) - self.rect.bottom
                self.rect.bottom = constants.WINDOW_HEIGHT - constants.SCROLL_EDGE
            if self.rect.top < constants.SCROLL_EDGE:
                scroll_camera[1] = constants.SCROLL_EDGE - self.rect.top
                self.rect.top = constants.SCROLL_EDGE

        return scroll_camera

    def ai(self, player, obstacle_tiles, scroll_camera, shooter_bullet_image):
        stun_cooldown = 100
        ai_change_x = 0
        ai_change_y = 0
        shooter_bullet = None
        self.add_score = False

        # enemy position based on camera
        self.rect.x += scroll_camera[0]
        self.rect.y += scroll_camera[1]

        # enemy distant to player
        distance = math.sqrt(((self.rect.centerx - player.rect.centerx)**2) + ((self.rect.centery - player.rect.centery)**2))

        # enemy move to player
        if self.shooter:
            if distance > constants.SHOOTER_SHOOTING_RANGE:
                if self.rect.centerx > player.rect.centerx:
                    ai_change_x = -constants.ANTONIO_SPEED - random.randint(-constants.ANTONIO_SPEED_RANDOM, constants.ANTONIO_SPEED_RANDOM)
                if self.rect.centerx < player.rect.centerx:
                    ai_change_x = constants.ANTONIO_SPEED + random.randint(-constants.ANTONIO_SPEED_RANDOM, constants.ANTONIO_SPEED_RANDOM)
                if self.rect.centery > player.rect.centery:
                    ai_change_y = -constants.ANTONIO_SPEED - random.randint(-constants.ANTONIO_SPEED_RANDOM, constants.ANTONIO_SPEED_RANDOM)
                if self.rect.centery < player.rect.centery:
                    ai_change_y = constants.ANTONIO_SPEED + random.randint(-constants.ANTONIO_SPEED_RANDOM, constants.ANTONIO_SPEED_RANDOM)
        if not self.shooter:
            if distance > constants.ENEMY_RANGE:
                if self.rect.centerx > player.rect.centerx:
                    ai_change_x = -constants.ANTONIO_SPEED - random.randint(-constants.ANTONIO_SPEED_RANDOM, constants.ANTONIO_SPEED_RANDOM)
                if self.rect.centerx < player.rect.centerx:
                    ai_change_x = constants.ANTONIO_SPEED + random.randint(-constants.ANTONIO_SPEED_RANDOM, constants.ANTONIO_SPEED_RANDOM)
                if self.rect.centery > player.rect.centery:
                    ai_change_y = -constants.ANTONIO_SPEED - random.randint(-constants.ANTONIO_SPEED_RANDOM, constants.ANTONIO_SPEED_RANDOM)
                if self.rect.centery < player.rect.centery:
                    ai_change_y = constants.ANTONIO_SPEED + random.randint(-constants.ANTONIO_SPEED_RANDOM, constants.ANTONIO_SPEED_RANDOM)

        if self.alive == True:

            if not self.stunned:

                # Enemy move to player
                self.move(ai_change_x, ai_change_y, obstacle_tiles)
                # attack player and create damage
                if distance < constants.ENEMY_ATTACK_RANGE and player.hit == False:
                    player.health -= 20
                    player.hit = True
                    player.last_hit = pygame.time.get_ticks()
                # shooting function for shooter
                shooter_bullet_cooldown = 1000
                if self.shooter:
                    if distance < constants.SHOOTER_SHOOTING_RANGE:
                        if pygame.time.get_ticks() - self.last_attack >= shooter_bullet_cooldown:
                            shooter_bullet = weapon.Shooter_bullet(shooter_bullet_image, self.rect.centerx, self.rect.centery, player.rect.centerx, player.rect.centery)
                            self.last_attack = pygame.time.get_ticks()

            # check if it is hit
            if self.hit == True:
                self.hit = False
                self.last_hit = pygame.time.get_ticks()
                self.stunned = True

            if (pygame.time.get_ticks() - self.last_hit > stun_cooldown):
                self.stunned = False


        if self.alive == True and self.health <= 0:
            player.score += 1


        return shooter_bullet




    def update(self):
        # check character health
        if self.health <= 0 and self.alive == True:
            self.health = 0
            self.alive = False


        # timer for resetting when player taking a hit
        hit_cooldown = 500
        if self.character_type == 0:
            if self.hit == True:
                if pygame.time.get_ticks() - self.last_hit > hit_cooldown:
                    self.hit = False

        # check character status
        if self.alive == False and self.character_type != 0:
            self.update_status(1)  # 1: death
        else:
            self.update_status(0)  # 0: normal

        animation_cooldown = 60
        # working on animation
        # update image
        self.image = self.animation_list[self.status][self.frame_index]
        # check if enough time has passed since last update
        if pygame.time.get_ticks() - self.update_time > animation_cooldown:
            self.frame_index += 1
            self.update_time = pygame.time.get_ticks()
            # check if animation finished?
            if self.frame_index >= len(self.animation_list[self.status]):
                self.frame_index = 0

    def update_status(self, new_status):
        # check if character status change
        if new_status != self.status:
            self.status = new_status
            # update the animation settings
            self.frame_index = 0
            self.update_time = pygame.time.get_ticks()

    # draw the character on the screen
    def draw(self, surface):
        flipped_image = pygame.transform.flip(self.image, self.flip, False)
        surface.blit(flipped_image, self.rect)






