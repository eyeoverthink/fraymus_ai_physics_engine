package fraymus.renderer.java2d;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import fraymus.core.Entity;
import fraymus.core.Transform;
import fraymus.core.World;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.geom.Point2D;
import java.awt.image.BufferedImage;
import org.junit.jupiter.api.Test;

class Java2DRendererTest {
    @Test
    void cameraMapsWorldOriginAndOffsetToScreenCoordinates() {
        Camera2D camera = new Camera2D().setPosition(1.0, -2.0).setPixelsPerUnit(50.0);

        Point2D.Double center = camera.worldToScreen(1.0, -2.0, 800, 600);
        Point2D.Double offset = camera.worldToScreen(3.0, -1.0, 800, 600);

        assertEquals(400.0, center.x);
        assertEquals(300.0, center.y);
        assertEquals(500.0, offset.x);
        assertEquals(250.0, offset.y);
    }

    @Test
    void rendersEntityTransformAndPrimitiveIntoImage() {
        BufferedImage image = new BufferedImage(200, 120, BufferedImage.TYPE_INT_ARGB);
        try (World world = new World()) {
            Entity entity = world.addEntity(new Entity("Visible", new Transform(1.0, 0.0)));
            entity.addComponent(Primitive2D.rectangle(1.0, 1.0, Color.MAGENTA));
            Graphics2D graphics = image.createGraphics();
            try {
                new Java2DRenderer(new Camera2D().setPixelsPerUnit(40.0))
                        .render(graphics, image.getWidth(), image.getHeight(), world);
            } finally {
                graphics.dispose();
            }
        }

        assertEquals(Color.MAGENTA.getRGB(), image.getRGB(140, 60));
        assertNotEquals(Color.MAGENTA.getRGB(), image.getRGB(100, 60));
    }
}