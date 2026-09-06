package fraymus.renderer.java2d;

import fraymus.core.Entity;
import fraymus.core.Transform;
import fraymus.core.World;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Point2D;
import java.awt.geom.Rectangle2D;

/** Stateless Java2D adapter that draws a snapshot of a Core world. */
public final class Java2DRenderer {
    private static final Color BACKGROUND = new Color(16, 22, 34);
    private static final Color GRID = new Color(39, 50, 67);
    private final Camera2D camera;

    public Java2DRenderer(Camera2D camera) {
        this.camera = camera;
    }

    public void render(Graphics2D graphics, int width, int height, World world) {
        graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        graphics.setColor(BACKGROUND);
        graphics.fillRect(0, 0, width, height);
        drawGrid(graphics, width, height);
        for (Entity entity : world.getEntities()) {
            entity.getComponent(Primitive2D.class)
                    .ifPresent(primitive -> drawPrimitive(graphics, width, height, entity, primitive));
        }
    }

    private void drawGrid(Graphics2D graphics, int width, int height) {
        double spacing = camera.getPixelsPerUnit();
        Point2D.Double origin = camera.worldToScreen(0.0, 0.0, width, height);
        graphics.setColor(GRID);
        graphics.setStroke(new BasicStroke(1.0f));
        for (double x = origin.x % spacing; x < width; x += spacing) {
            graphics.draw(new java.awt.geom.Line2D.Double(x, 0, x, height));
        }
        for (double y = origin.y % spacing; y < height; y += spacing) {
            graphics.draw(new java.awt.geom.Line2D.Double(0, y, width, y));
        }
    }

    private void drawPrimitive(
            Graphics2D graphics, int width, int height, Entity entity, Primitive2D primitive) {
        Transform transform = entity.getTransform();
        Point2D.Double position = camera.worldToScreen(
                transform.getX(), transform.getY(), width, height);
        double shapeWidth = primitive.getWidth() * transform.getScaleX() * camera.getPixelsPerUnit();
        double shapeHeight = primitive.getHeight() * transform.getScaleY() * camera.getPixelsPerUnit();

        Graphics2D transformed = (Graphics2D) graphics.create();
        try {
            transformed.translate(position.x, position.y);
            transformed.rotate(-transform.getRotation());
            transformed.setColor(primitive.getColor());
            if (primitive.getShape() == Primitive2D.Shape.CIRCLE) {
                transformed.fill(new Ellipse2D.Double(
                        -shapeWidth / 2.0, -shapeHeight / 2.0, shapeWidth, shapeHeight));
            } else {
                transformed.fill(new Rectangle2D.Double(
                        -shapeWidth / 2.0, -shapeHeight / 2.0, shapeWidth, shapeHeight));
            }
        } finally {
            transformed.dispose();
        }
    }
}