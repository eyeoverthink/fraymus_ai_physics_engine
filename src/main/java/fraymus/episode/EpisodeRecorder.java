package fraymus.episode;

public class EpisodeRecorder implements AutoCloseable {
    public EpisodeRecorder() {
        System.out.println("Entered fraymus.episode.EpisodeRecorder");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.episode.EpisodeRecorder");
    }
}