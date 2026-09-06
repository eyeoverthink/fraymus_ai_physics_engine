package fraymus.renderer.java2d;

import fraymus.app.DemoWorld;
import fraymus.core.SimulationClock;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.SwingUtilities;
import javax.swing.Timer;

/** Swing host for the Java2D renderer adapter. */
public final class DesktopWindow {
    private DesktopWindow() {
    }

    public static void launch() {
        SwingUtilities.invokeLater(DesktopWindow::createAndShow);
    }

    private static void createAndShow() {
        DemoWorld demo = DemoWorld.create();
        SimulationClock clock = new SimulationClock();
        Java2DRenderer renderer = new Java2DRenderer(new Camera2D());
        WorldPanel panel = new WorldPanel(demo, renderer);
        JFrame frame = new JFrame("FRAYMUS — Java2D World");
        frame.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        frame.setContentPane(panel);
        frame.pack();
        frame.setLocationByPlatform(true);

        long[] lastFrameNanos = {System.nanoTime()};
        Timer timer = new Timer(16, event -> {
            long now = System.nanoTime();
            double elapsedSeconds = (now - lastFrameNanos[0]) / 1_000_000_000.0;
            lastFrameNanos[0] = now;
            clock.advance(elapsedSeconds,
                    () -> demo.world().step(clock.getFixedStepSeconds()));
            panel.repaint();
        });
        frame.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosed(WindowEvent event) {
                timer.stop();
                demo.close();
            }
        });
        timer.start();
        frame.setVisible(true);
    }

    private static final class WorldPanel extends JPanel {
        private final DemoWorld demo;
        private final Java2DRenderer renderer;

        private WorldPanel(DemoWorld demo, Java2DRenderer renderer) {
            this.demo = demo;
            this.renderer = renderer;
            setPreferredSize(new Dimension(960, 600));
        }

        @Override
        protected void paintComponent(Graphics graphics) {
            super.paintComponent(graphics);
            renderer.render((Graphics2D) graphics, getWidth(), getHeight(), demo.world());
        }
    }
}