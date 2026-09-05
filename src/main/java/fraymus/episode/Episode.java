package fraymus.episode;

public class Episode implements AutoCloseable {
    public Episode() {
        System.out.println("Entered fraymus.episode.Episode");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.episode.Episode");
    }
}