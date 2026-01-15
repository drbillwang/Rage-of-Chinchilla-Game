from pickle import NONE
import constants
from items import Item
from character import Character
from random import randrange


class Background():
    def __init__(self):
        self.map_tiles = []
        self.obstacle_tiles = []
        self.item_list = []
        self.player = None
        self.enemy_list = []


    def process_data(self, data, tile_list, item_images, character_animations):
        self.map_length = len(data)
        # map data file
        for y, row in enumerate(data):
            for x, tile in enumerate(row):
                image = tile_list[tile]
                image_rect = image.get_rect()
                image_x = x * constants.TILE_SIZE
                image_y = y * constants.TILE_SIZE
                image_rect.center = (image_x, image_y)
                tile_data = [image, image_rect, image_x, image_y]

                if tile == 1:
                    self.obstacle_tiles.append(tile_data)
                elif tile == 2:
                    self.obstacle_tiles.append(tile_data)
                elif tile == 3:
                    self.obstacle_tiles.append(tile_data)
                elif tile == 7:
                    cola = Item(randrange(constants.MAP_X_START, constants.MAP_X_END), randrange(constants.MAP_Y_START, constants.MAP_Y_END), 1, [item_images[1]])
                    self.item_list.append(cola)
                    tile_data[0] = tile_list[0]
                elif tile == 6:
                    # Player spawns at screen center
                    player = Character(constants.WINDOW_WIDTH // 2, constants.WINDOW_HEIGHT // 2, constants.PLAYER_INITIAL_HEALTH, character_animations, 0, False)
                    self.player = player
                    tile_data[0] = tile_list[0]
                elif tile == 4:
                    enemy = Character(randrange(constants.MAP_X_START, constants.MAP_X_END), randrange(constants.MAP_Y_START, constants.MAP_Y_END), constants.ENEMY_INITIAL_HEALTH, character_animations, 1, False)
                    self.enemy_list.append(enemy)
                    tile_data[0] = tile_list[0]
                elif tile == 5:
                    shooter = Character(randrange(constants.MAP_X_START, constants.MAP_X_END), randrange(constants.MAP_Y_START, constants.MAP_Y_END), constants.ENEMY_INITIAL_HEALTH, character_animations, 4, True)
                    self.enemy_list.append(shooter)
                    tile_data[0] = tile_list[0]


                # add image data to man tile list
                if tile >= 0:
                    self.map_tiles.append(tile_data)

    def update(self, scroll_camera):
        for tile in self.map_tiles:
            tile[2] += scroll_camera[0]
            tile[3] += scroll_camera[1]
            tile[1].center = (tile[2], tile[3])

    def draw(self, surface):
        for tile in self.map_tiles:
            surface.blit(tile[0], tile[1])
