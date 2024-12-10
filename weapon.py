import pygame
import math
import random
import constants


class Weapon():
    def __init__(self, image, bullet_image):
        self.angle = 0
        self.original_image = image
        self.flip = False
        self.weapon_angle = 0
        self.image = pygame.transform.rotate(self.original_image, self.angle)
        self.bullet_image = bullet_image
        self.rect = self.image.get_rect()
        self.fired = False
        self.last_shot = pygame.time.get_ticks()


    def update(self, player):
        shot_cooldown = 100
        bullet = None
        self.rect.center = player.rect.center

        pos = pygame.mouse.get_pos()
        x_dist = pos[0] - self.rect.centerx
        y_dist = pos[1] - self.rect.centery
        if x_dist < 0:
            self.flip = True
            self.weapon_angle = math.degrees(-math.atan2(x_dist, y_dist))
        else:
            self.flip = False
            self.weapon_angle = math.degrees(math.atan2(x_dist, y_dist))
        self.angle = math.degrees(math.atan2(x_dist, y_dist))

        # get mouseclick
        if pygame.mouse.get_pressed()[0] and self.fired == False and (pygame.time.get_ticks()) - self.last_shot:
            bullet = Bullet(self.bullet_image, self.rect.centerx + constants.BULLET_OFFSET_X, self.rect.centery + constants.BULLET_OFFSET_Y, self.angle)
            self.fired = True
            self.last_shot = pygame.time.get_ticks()
        if pygame.mouse.get_pressed()[0] == False:
            self.fired = False


        return bullet

    def draw(self, surface):
        self.image = pygame.transform.rotate(self.original_image, self.weapon_angle)
        flipped_image = pygame.transform.flip(self.image, self.flip, False)
        surface.blit(flipped_image, ((self.rect.x + constants.WEAPON_OFFSET_X - int(self.image.get_width() / 2)),
                                     self.rect.centery + constants.WEAPON_OFFSET_Y - int(self.image.get_height() / 2)))


class Bullet(pygame.sprite.Sprite):
    def __init__(self, image, x, y, angle):
        pygame.sprite.Sprite.__init__(self)
        self.original_image = image
        self.angle = angle - 90
        self.image = pygame.transform.rotate(self.original_image, self.angle)
        self.rect = self.image.get_rect()
        self.rect.center = (x, y)

        # shooting directions based on angle
        self.dx = math.cos(math.radians(self.angle)) * constants.BULLET_SPEED
        self.dy = -(math.sin(math.radians(self.angle)) * constants.BULLET_SPEED)

    def update(self, scroll_camera, obstacle_tiles, enemy_list):
        self.rect.x += scroll_camera[0] + self.dx
        self.rect.y += scroll_camera[1] + self.dy

        # check collusion with walls
        for obstacle in obstacle_tiles:
            if obstacle[1].colliderect(self.rect):
                self.kill()


        # damage starts at 0
        damage = 0
        damage_pos = None

        # check if bullet is out range
        if self.rect.right < 0 or self.rect.left > constants.WINDOW_WIDTH or self.rect.bottom < 0 or self.rect.top > constants.WINDOW_HEIGHT:
            self.kill()

        # check bullet hit enemy
        for enemy in enemy_list:
            if enemy.rect.colliderect(self.rect) and enemy.alive:
                damage = constants.SMILE_WEAPON + random.randint(-constants.SMILE_WEAPON_RANDOM, constants.SMILE_WEAPON_RANDOM)
                damage_pos = enemy.rect
                enemy.health -= damage
                enemy.hit = True
                self. kill()
                break
        return damage, damage_pos

    def draw(self, surface):
        surface.blit(self.image, ((self.rect.x - int(self.image.get_width() / 2)),
                                  self.rect.centery - int(self.image.get_height() / 2)))

class Shooter_bullet(pygame.sprite.Sprite):
    def __init__(self, image, x, y, target_x, target_y):
        pygame.sprite.Sprite.__init__(self)
        self.original_image = image
        x_distance = target_x - x
        y_distance = - (target_y - y)
        self.angle = math.degrees(math.atan2(x_distance, y_distance))
        self.image = pygame.transform.rotate(self.original_image, self.angle)
        self.rect = self.image.get_rect()
        self.rect.center = (x, y)

        # shooting directions based on angle
        self.dx = math.sin(math.radians(self.angle)) * (constants.SHOOTER_BULLET_SPEED + random.randint(-constants.BULLET_SPEED_RANDOM, constants.BULLET_SPEED_RANDOM))
        self.dy = - (math.cos(math.radians(self.angle)) * (constants.SHOOTER_BULLET_SPEED + random.randint(-constants.BULLET_SPEED_RANDOM, constants.BULLET_SPEED_RANDOM)))

    def update(self, scroll_camera, obstacle_tiles, player):
        self.rect.x += scroll_camera[0] + self.dx
        self.rect.y += scroll_camera[1] + self.dy


        # check if bullet is out range
        if self.rect.right < 0 or self.rect.left > constants.WINDOW_WIDTH or self.rect.bottom < 0 or self.rect.top > constants.WINDOW_HEIGHT:
            self.kill()

        # check collusion with walls
        for obstacle in obstacle_tiles:
            if obstacle[1].colliderect(self.rect):
                self.kill()


        # check bullet hit player
        if player.rect.colliderect(self.rect) and player.hit == False:
            player.hit = True
            player.last_hit = pygame.time.get_ticks()
            player.health -= 20
            self.kill()

    def draw(self, surface):
        surface.blit(self.image, ((self.rect.x - int(self.image.get_width() / 2)),
                                  self.rect.centery - int(self.image.get_height() / 2)))