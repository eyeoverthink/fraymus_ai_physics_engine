package fraymus.core;

/** Renderer-independent spatial state. No OpenGL/LWJGL dependencies. */
public final class Transform {
    private double x;
    private double y;
    private double rotation;
    private double scaleX = 1.0;
    private double scaleY = 1.0;

    public Transform() {}

    public Transform(double x, double y) { this.x = x; this.y = y; }

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
        return new Transform(x, y).setRotation(rotation).setScale(scaleX, scaleY);
    }
}
