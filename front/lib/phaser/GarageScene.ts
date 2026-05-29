import Phaser from 'phaser';

export interface GarageSceneData {
  carSlug: string;
  colorHex: string;
}

const FLOOR_Y = 1.03;

export class GarageScene extends Phaser.Scene {
  private carSprite?: Phaser.GameObjects.Image;
  private bgSprite?: Phaser.GameObjects.Image;
  private carSlug: string = 'renault-12';
  private entryPlayed = false; // la animación de entrada solo se ejecuta una vez

  constructor() {
    super({ key: 'GarageScene' });
  }

  init(data: GarageSceneData) {
    this.carSlug = data?.carSlug ?? 'renault-12';
    this.entryPlayed = false;
  }

  preload() {
    this.load.image('car', `/assets/cars/${this.carSlug}.png`);
    this.load.image('garage-bg', '/assets/garage/floor.png');
  }

  create() {
    this.buildScene(true);

    this.scale.on('resize', () => {
      this.buildScene(false);
    });
  }

  setCarColor(hexColor: string) {
    if (!this.carSprite) return;
    if (!hexColor || hexColor === '#ffffff' || hexColor === '#FFFFFF') {
      this.carSprite.clearTint();
    } else {
      this.carSprite.setTint(parseInt(hexColor.replace('#', ''), 16));
    }
  }

  clearCarColor() {
    this.carSprite?.clearTint();
  }

  private buildScene(playEntry: boolean) {
    const { width, height } = this.scale;

    this.children.removeAll(true);
    this.tweens.killAll();

    // Fondo
    if (this.textures.exists('garage-bg')) {
      this.bgSprite = this.add.image(width * 0.55, height / 2, 'garage-bg');
      this.bgSprite.setDisplaySize(width * 1.15, height);
    }

    if (!this.textures.exists('car')) {
      this.showPlaceholder(width, height);
      return;
    }

    const finalX = width / 2;
    const floorY  = height * FLOOR_Y;
    const maxW    = width * 0.78;
    const maxH    = height * FLOOR_Y * 0.9;

    this.carSprite = this.add.image(finalX, floorY, 'car');
    this.carSprite.setOrigin(0.5, 1);

    const scale = Math.min(maxW / this.carSprite.width, maxH / this.carSprite.height);
    this.carSprite.setScale(scale);

    // Animación de entrada: solo la primera vez que se construye la escena
    if (playEntry && !this.entryPlayed) {
      this.entryPlayed = true;

      const carHalfWidth = (this.carSprite.width * scale) / 2;
      this.carSprite.setX(width + carHalfWidth); // empieza fuera de pantalla a la derecha

      this.tweens.add({
        targets: this.carSprite,
        x: finalX,
        duration: 1400,
        ease: 'Cubic.easeOut', // desacelera como si frenara
      });
    }
  }

  private showPlaceholder(width: number, height: number) {
    const box = this.add.graphics();
    box.lineStyle(2, 0x444444);
    box.strokeRect(width / 2 - 100, height / 2 - 40, 200, 80);
    this.add.text(width / 2, height / 2, 'Renault 12\n(imagen pendiente)', {
      fontSize: '13px',
      color: '#888888',
      align: 'center',
    }).setOrigin(0.5);
  }
}
