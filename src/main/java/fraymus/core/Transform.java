package fraymus.core;

import java.util.Objects;

/** Renderer-independent spatial state. No OpenGL/LWJGL dependencies. */
public final class Transform {
    private double x;
    private double y;
    private double rotation;
    private double scaleX = 1.0;
    private double scaleY = 1.0;

    public Transform() {}

    public Transform(double x, double y) { this.x = x; this.y = y; }

    public Transform(Transform other) {
        copyFrom(other);
    }

    public double getX() { return x; }
    public double getY() { return y; }
    public double getRotation() { return rotation; }
    public double getScaleX() { return scaleX; }
    public double getScaleY() { return scaleY; }

    public Transform setPosition(double x, double y) { this.x = x; this.y = y; return this; }
    public Transform translate(double dx, double dy) { x += dx; y += dy; return this; }
    public Transform setRotation(double rotation) { this.rotation = rotation; return this; }
    public Transform setScale(double x, double y) { scaleX = x; scaleY = y; return this; }

    public Transform copy() {
        return new Transform(this);
    }

    public Transform copyFrom(Transform other) {
        Objects.requireNonNull(other, "other");
        x = other.x;
        y = other.y;
        rotation = other.rotation;
        scaleX = other.scaleX;
        scaleY = other.scaleY;
        return this;
    }

    @Override
    public boolean equals(Object value) {
        if (this == value) return true;
        if (!(value instanceof Transform other)) return false;
        return Double.compare(x, other.x) == 0
                && Double.compare(y, other.y) == 0
                && Double.compare(rotation, other.rotation) == 0
                && Double.compare(scaleX, other.scaleX) == 0
                && Double.compare(scaleY, other.scaleY) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y, rotation, scaleX, scaleY);
    }
}
