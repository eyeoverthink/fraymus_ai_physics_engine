package fraymus.episode;

public class ActionRecord implements AutoCloseable {
    public ActionRecord() {
        System.out.println("Entered fraymus.episode.ActionRecord");
    }

    @Override
    public void close() {
        System.out.println("Exited fraymus.episode.ActionRecord");
    }
}