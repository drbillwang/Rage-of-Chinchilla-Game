import pygame
import math

class Button():
    def __init__(self, x, y, image=None, text="", width=200, height=60, 
                 color=(80, 80, 120), hover_color=(100, 100, 150), 
                 text_color=(255, 255, 255), border_radius=15):
        self.original_image = image
        self.text = text
        self.width = width
        self.height = height
        self.color = color
        self.hover_color = hover_color
        self.text_color = text_color
        self.border_radius = border_radius
        self.clicked = False
        self.click_time = 0
        
        if image:
            self.image = image
            self.rect = self.image.get_rect()
        else:
            self.rect = pygame.Rect(0, 0, width, height)
        self.rect.topleft = (x, y)
        
        # Font for text buttons
        self.font = pygame.font.Font("fonts/MontserratAlternates-Bold.otf", 24)

    def draw(self, surface):
        action = False
        current_time = pygame.time.get_ticks()
        
        # Get mouse position
        pos = pygame.mouse.get_pos()
        is_hovered = self.rect.collidepoint(pos)
        
        # Check for click
        if is_hovered and pygame.mouse.get_pressed()[0]:
            if not self.clicked:
                action = True
                self.clicked = True
                self.click_time = current_time
        else:
            self.clicked = False
        
        # Calculate animation effects
        scale = 1.0
        if is_hovered:
            scale = 1.05
        if self.clicked or (current_time - self.click_time < 100):
            scale = 0.95
        
        if self.original_image:
            # Image-based button with effects
            scaled_width = int(self.original_image.get_width() * scale)
            scaled_height = int(self.original_image.get_height() * scale)
            scaled_image = pygame.transform.scale(self.original_image, (scaled_width, scaled_height))
            
            # Center the scaled image
            img_rect = scaled_image.get_rect(center=self.rect.center)
            
            # Draw glow effect on hover
            if is_hovered:
                glow_surface = pygame.Surface((self.rect.width + 20, self.rect.height + 20), pygame.SRCALPHA)
                pygame.draw.rect(glow_surface, (255, 255, 255, 50), 
                               (0, 0, self.rect.width + 20, self.rect.height + 20), 
                               border_radius=self.border_radius + 5)
                surface.blit(glow_surface, (self.rect.x - 10, self.rect.y - 10))
            
            surface.blit(scaled_image, img_rect)
        else:
            # Draw custom styled button
            btn_width = int(self.width * scale)
            btn_height = int(self.height * scale)
            btn_x = self.rect.centerx - btn_width // 2
            btn_y = self.rect.centery - btn_height // 2
            
            # Shadow
            shadow_rect = pygame.Rect(btn_x + 4, btn_y + 4, btn_width, btn_height)
            pygame.draw.rect(surface, (30, 30, 40), shadow_rect, border_radius=self.border_radius)
            
            # Main button body with gradient effect
            btn_rect = pygame.Rect(btn_x, btn_y, btn_width, btn_height)
            base_color = self.hover_color if is_hovered else self.color
            
            # Draw gradient background
            btn_surface = pygame.Surface((btn_width, btn_height), pygame.SRCALPHA)
            for i in range(btn_height):
                ratio = i / btn_height
                r = int(base_color[0] * (1 - ratio * 0.3))
                g = int(base_color[1] * (1 - ratio * 0.3))
                b = int(base_color[2] * (1 - ratio * 0.3))
                pygame.draw.line(btn_surface, (r, g, b), (0, i), (btn_width, i))
            
            # Apply border radius by masking
            mask_surface = pygame.Surface((btn_width, btn_height), pygame.SRCALPHA)
            pygame.draw.rect(mask_surface, (255, 255, 255), (0, 0, btn_width, btn_height), border_radius=self.border_radius)
            btn_surface.blit(mask_surface, (0, 0), special_flags=pygame.BLEND_RGBA_MIN)
            
            surface.blit(btn_surface, (btn_x, btn_y))
            
            # Border
            border_color = (150, 150, 200) if is_hovered else (100, 100, 140)
            pygame.draw.rect(surface, border_color, btn_rect, width=2, border_radius=self.border_radius)
            
            # Shine effect at top
            shine_rect = pygame.Rect(btn_x + 5, btn_y + 3, btn_width - 10, btn_height // 4)
            shine_surface = pygame.Surface((shine_rect.width, shine_rect.height), pygame.SRCALPHA)
            pygame.draw.rect(shine_surface, (255, 255, 255, 30), (0, 0, shine_rect.width, shine_rect.height), border_radius=self.border_radius)
            surface.blit(shine_surface, shine_rect)
            
            # Text with shadow
            if self.text:
                text_shadow = self.font.render(self.text, True, (0, 0, 0))
                text_surface = self.font.render(self.text, True, self.text_color)
                text_rect = text_surface.get_rect(center=(self.rect.centerx, self.rect.centery))
                surface.blit(text_shadow, (text_rect.x + 2, text_rect.y + 2))
                surface.blit(text_surface, text_rect)
        
        return action


class FancyButton(Button):
    """A more stylized button with specific color themes"""
    
    @staticmethod
    def start_button(x, y):
        return FancyButton(x, y, text="START", width=220, height=65,
                          color=(50, 150, 80), hover_color=(70, 200, 100),
                          text_color=(255, 255, 255))
    
    @staticmethod
    def exit_button(x, y):
        return FancyButton(x, y, text="EXIT", width=220, height=65,
                          color=(150, 50, 50), hover_color=(200, 70, 70),
                          text_color=(255, 255, 255))
    
    @staticmethod
    def restart_button(x, y):
        return FancyButton(x, y, text="RESTART", width=220, height=65,
                          color=(50, 100, 150), hover_color=(70, 130, 200),
                          text_color=(255, 255, 255))
    
    @staticmethod
    def resume_button(x, y):
        return FancyButton(x, y, text="RESUME", width=220, height=65,
                          color=(100, 100, 150), hover_color=(130, 130, 200),
                          text_color=(255, 255, 255))
    
    def __init__(self, x, y, text="", width=200, height=60,
                 color=(80, 80, 120), hover_color=(100, 100, 150),
                 text_color=(255, 255, 255)):
        super().__init__(x, y, None, text, width, height, color, hover_color, text_color)
