package fraymus.episode;

public class Observation implements AutoCloseable {
    public Observation() {
        System.out.println("Entered fraymus.episode.Observation");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.episode.Observation");
    }
}