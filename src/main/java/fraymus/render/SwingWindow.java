package fraymus.render;

import java.awt.Canvas;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.GraphicsEnvironment;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.awt.image.BufferStrategy;
import javax.swing.JFrame;

/**
 * FOUNDATION-003 window: standard-JDK Java2D/Swing renderer. Replaces the
 * LWJGL/GLFW/OpenGL reference window (banned for Core by
 * FRAYMUS_BUILD_ORDER.md) while keeping the same shape: open a window, run
 * a loop, clear the frame, present it.
 */
public final class SwingWindow implements RenderSurface {
    private final int width;
    private final int height;
    private final String title;

    private JFrame frame;
    private Canvas canvas;
    private BufferStrategy strategy;
    private volatile boolean closeRequested;

    public SwingWindow(int width, int height, String title) {
        this.width = width;
        this.height = height;
        this.title = title;
    }

    @Override
    public void open() {
        if (GraphicsEnvironment.isHeadless()) {
            throw new IllegalStateException("No display available; use HeadlessSurface instead");
        }

        frame = new JFrame(title);
        frame.setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
        frame.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                closeRequested = true;
            }
        });

        canvas = new Canvas();
        canvas.setPreferredSize(new Dimension(width, height));
        frame.getContentPane().add(canvas);
        frame.pack();
        frame.setResizable(true);
        frame.setExtendedState(JFrame.MAXIMIZED_BOTH);
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);

        canvas.createBufferStrategy(2);
        strategy = canvas.getBufferStrategy();
    }

    @Override
    public boolean isCloseRequested() {
        return closeRequested;
    }

    @Override
    public void beginFrame() {
        // Buffer is fetched fresh in clear(); nothing to prepare here.
    }

    @Override
    public void clear(float r, float g, float b) {
        Graphics g2 = strategy.getDrawGraphics();
        try {
            g2.setColor(new Color(clamp(r), clamp(g), clamp(b)));
            g2.fillRect(0, 0, canvas.getWidth(), canvas.getHeight());
        } finally {
            g2.dispose();
        }
    }

    @Override
    public void endFrame() {
        strategy.show();
    }

    @Override
    public void close() {
        if (frame != null) {
            frame.dispose();
        }
    }

    private static float clamp(float v) {
        return Math.max(0f, Math.min(1f, v));
    }
}
