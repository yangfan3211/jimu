import { Vector } from "matter";
import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    map: Phaser.Tilemaps.Tilemap;
    objectLayer: Phaser.Tilemaps.TilemapLayer;
    groundLayer: Phaser.Tilemaps.TilemapLayer;
    controls: Phaser.Cameras.Controls.FixedKeyControl;
    preDrawTileIndex: number;
    selectedBox: Phaser.GameObjects.Graphics;

    constructor() {
        super("Game");
    }

    create() {
        this.onListener();

        // this.camera = this.cameras.main;
        // this.controls = new Phaser.Cameras.Controls.FixedKeyControl()

        this.map = this.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: 40,
            height: 23,
        });

        // Load tilemap
        const tilesPrimalPlateauGrass = this.map.addTilesetImage(
            "tiles-primal_plateau-grass"
        ) as Phaser.Tilemaps.Tileset;

        const tilesPrimalPlateauProps = this.map.addTilesetImage(
            "tiles-primal_plateau-props"
        ) as Phaser.Tilemaps.Tileset;

        this.groundLayer = this.map.createBlankLayer("Ground Layer", [
            tilesPrimalPlateauGrass,
        ]) as Phaser.Tilemaps.TilemapLayer;

        this.objectLayer = this.map.createBlankLayer(
            "Object Layer",
            tilesPrimalPlateauProps
        ) as Phaser.Tilemaps.TilemapLayer;

        // Init ground
        this.groundLayer.fill(0, 0, 0, this.map.width, this.map.height);

        // Init selected box
        this.selectedBox = this.add.graphics();
        this.selectedBox.lineStyle(2, 0xffffff, 0.8);
        this.selectedBox.strokeRect(
            0,
            0,
            this.map.tileWidth,
            this.map.tileHeight
        );

        EventBus.emit("current-scene-ready", this);
    }

    update(): void {
        // Update cursor position (e.g. tile selected box)
        const worldPoint = this.input.activePointer.positionToCamera(
            this.cameras.main
        ) as Phaser.Math.Vector2;

        const pointerTileXY = this.map.worldToTileXY(
            worldPoint.x,
            worldPoint.y
        );

        const pointerWorldXY = pointerTileXY
            ? this.map.tileToWorldXY(pointerTileXY.x, pointerTileXY.y)
            : new Phaser.Math.Vector2(0, 0);

        const deltaMoveXY = this.input.manager.activePointer.velocity;

        // Update selected box size and position
        if (deltaMoveXY.x != 0 || deltaMoveXY.y != 0)
            this.onPointerMove(pointerWorldXY);

        // User input
        if (this.input.manager.activePointer.primaryDown)
            this.onPrimaryDown(pointerTileXY);
    }

    changeScene() {
        this.scene.start("GameOver");
    }

    onListener() {
        // Receive tile Index
        EventBus.on("draw-tile", (index: number) => {
            this.preDrawTileIndex = index;
        });
    }

    // Common Action: Move cursor
    onPointerMove(pointerWorldXY: Phaser.Math.Vector2 | null) {
        if (pointerWorldXY != null) {
            this.selectedBox.setPosition(pointerWorldXY.x, pointerWorldXY.y);
        }
    }

    // Create Action: Draw tile
    onPrimaryDown(pointerTileXY: Phaser.Math.Vector2 | null) {
        if (pointerTileXY != null) {
            // Tile index transform & Draw tile
            const tilesetColumns = this.groundLayer.tileset[0].columns;
            const tilesetRows = this.groundLayer.tileset[0].rows;
            const tileColumn = this.preDrawTileIndex % 16;
            const tileRow = Math.floor(this.preDrawTileIndex / 16);
            const finDrawTileIndex = tileRow * tilesetColumns + tileColumn;
            if (
                tileColumn < tilesetColumns &&
                finDrawTileIndex < tilesetColumns * tilesetRows
            ) {
                this.groundLayer.fill(
                    finDrawTileIndex,
                    pointerTileXY.x,
                    pointerTileXY.y,
                    1,
                    1
                );
            }
        }
    }
}
