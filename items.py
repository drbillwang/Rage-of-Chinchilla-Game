import pygame



class Item(pygame.sprite.Sprite):
    def __init__(self, x, y, item_type, animation_list):
        pygame.sprite.Sprite.__init__(self)
        self.item_type = item_type # 0 - coin, 1 = health potion
        self.animation_list = animation_list
        self.frame_index = 0
        self.update_time = pygame.time.get_ticks()
        self.image = self.animation_list[self.frame_index]
        self.rect = self.image.get_rect()
        self.rect.center = (x, y)




    def update(self, scroll_camera, player, portion_fx):
        # reposition based on camera
        self.rect.x += scroll_camera[0]
        self.rect.y += scroll_camera[1]

        # item collected
        if self.rect.colliderect(player.rect):
            # money collected
            if self.item_type == 0:
                player.score += 0
            elif self.item_type == 1:
                player.health += 20
                portion_fx.play()
                if player.health > 100:
                    player.health = 100
            self.kill()





