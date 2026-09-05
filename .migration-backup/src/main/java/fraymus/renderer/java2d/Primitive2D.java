package fraymus.renderer.java2d;

import fraymus.core.Component;
import java.awt.Color;
import java.util.Objects;

/** Java2D adapter metadata for the first visible simulation primitives. */
public final class Primitive2D extends Component {
    public enum Shape {
        RECTANGLE,
        CIRCLE
    }

    private final Shape shape;
    private final double width;
    private final double height;
    private final Color color;

    private Primitive2D(Shape shape, double width, double height, Color color) {
        if (!(width > 0.0) || !(height > 0.0)
                || !Double.isFinite(width) || !Double.isFinite(height)) {
            throw new IllegalArgumentException("Primitive dimensions must be finite and > 0");
        }
        this.shape = Objects.requireNonNull(shape, "shape");
        this.width = width;
        this.height = height;
        this.color = Objects.requireNonNull(color, "color");
    }

    public static Primitive2D rectangle(double width, double height, Color color) {
        return new Primitive2D(Shape.RECTANGLE, width, height, color);
    }

    public static Primitive2D circle(double diameter, Color color) {
        return new Primitive2D(Shape.CIRCLE, diameter, diameter, color);
    }

    public Shape getShape() { return shape; }
    public double getWidth() { return width; }
    public double getHeight() { return height; }
    public Color getColor() { return color; }
}