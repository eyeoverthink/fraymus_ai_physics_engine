package fraymus.renderer.java2d;

import java.awt.geom.Point2D;

/** Maps renderer-independent world coordinates into Java2D screen coordinates. */
public final class Camera2D {
    private double x;
    private double y;
    private double pixelsPerUnit = 72.0;

    public Camera2D setPosition(double x, double y) {
        this.x = x;
        this.y = y;
        return this;
    }

    public Camera2D setPixelsPerUnit(double pixelsPerUnit) {
        if (!(pixelsPerUnit > 0.0) || !Double.isFinite(pixelsPerUnit)) {
            throw new IllegalArgumentException("pixelsPerUnit must be finite and > 0");
        }
        this.pixelsPerUnit = pixelsPerUnit;
        return this;
    }

    public double getPixelsPerUnit() {
        return pixelsPerUnit;
    }

    public Point2D.Double worldToScreen(double worldX, double worldY, int width, int height) {
        return new Point2D.Double(
                width / 2.0 + (worldX - x) * pixelsPerUnit,
                height / 2.0 - (worldY - y) * pixelsPerUnit);
    }
}