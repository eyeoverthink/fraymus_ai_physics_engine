# FRAYMUS AI Physics Engine

## Current baseline

This repository is a Java 17 Maven project. `src/main/java` contains the
renderer-independent FRAYMUS Core. `Vaughn_Scott_Agent_Physics` is preserved as
legacy/reference source and is not compiled into Core.

Modernization follows `FRAYMUS_BUILD_ORDER.md` one independently verifiable
section at a time. Keep the original logic and recognizable data structures,
but do not make OpenGL, GLFW, GLSL, LWJGL, or ImGui dependencies of Core.

## Run

```sh
mvn clean package
java -jar target/fraymus-ai-physics-engine-0.1.0-SNAPSHOT.jar --headless
```

To run an exact number of deterministic fixed steps:

```sh
java -jar target/fraymus-ai-physics-engine-0.1.0-SNAPSHOT.jar --ticks 600
```

## Test

```sh
mvn test
```

Every modernization section must compile, pass its tests, run, and expose
observable behavior before work starts on the next section.