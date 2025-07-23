# Chapter 6: Monorepo Structure & Tooling

In [Chapter 5: Structured Field Values (RFC8941) Serialization/Deserialization](05_structured_field_values__rfc8941__serialization_deserialization_.md), we explored the "grammar" used for formatting data in HTTP headers, like the ones used for CMCD and CMSD. We've covered *what* the `common-media-library` does. Now, let's take a step back and look at *how* the entire project is organized and managed.

## What's the Big Idea? Keeping Related Tools Together

Imagine you have a really nice toolkit. Inside, you have separate compartments for different types of tools: screwdrivers in one, wrenches in another, maybe some sample screws and bolts in a third. They are all related (part of the same toolkit), kept in the same box, share the same overall maintenance (like keeping the box clean), but are organized into distinct sections.

The `common-media-library` project uses a similar approach called a **monorepo**. It means "mono" (single) + "repo" (repository). The entire project, including the main library code, development tools, and example usage code, lives together in *one single Git repository*.

**Use Case:** You want to fix a small bug in the main `@svta/common-media-library` code (let's call this the `lib` package). After fixing it, you want to immediately test if your fix works correctly within one of the sample applications (in the `samples` directory) *without* having to publish a new version of the library first. How does the project structure make this easy?

This chapter explains how the monorepo setup, managed by **npm workspaces**, helps organize the code and simplifies development workflows like building, testing, and managing dependencies across different parts of the project.

## Key Concepts: Organizing the Toolkit

1.  **What is a Monorepo?**
    *   Instead of having separate Git repositories for the library code (`lib`), the developer tools (`dev`), and each sample project (`samples/*`), everything resides in *one* repository.
    *   **Benefit:** Easier to make changes that affect multiple parts (like updating the library and its examples simultaneously). Easier to keep versions and dependencies consistent across all parts.

2.  **npm Workspaces:**
    *   This is the mechanism provided by npm (Node Package Manager) that understands and manages the different packages within the monorepo.
    *   The **root `package.json`** file (at the very top level of the project) acts as the main control center. It defines *which* directories inside the repository are separate packages (the "workspaces").
    *   It also allows you to run commands (like `install`, `build`, `test`) from the root level that apply to *all* the packages within the workspaces.

3.  **Project Structure:**
    If you look at the project files, you'll see several key directories:
    *   `lib/`: Contains the main `@svta/common-media-library` source code (`src/`), tests (`test/`), and its own `package.json`. This is the core library that gets published.
    *   `dev/`: Contains code used for local development and testing, like a development server. It also has its own `package.json`. It's usually not published.
    *   `samples/`: Contains various subdirectories, each being a small example project demonstrating how to use the `lib`. Each sample has its own `package.json`.
    *   `docs/`: Contains the source code for generating the project documentation website.
    *   `scripts/`: Contains helper scripts used for tasks like building, versioning, etc., often called from the root `package.json`.
    *   `package.json` (Root): The main configuration file defining the workspaces and common scripts.
    *   `tsconfig.json` (Root): The base TypeScript configuration used by all packages.

    ```
    common-media-library/
    ├── lib/                 # The core library package
    │   ├── src/
    │   ├── test/
    │   └── package.json
    ├── dev/                 # Development tools package
    │   └── package.json
    ├── samples/             # Directory for sample projects
    │   ├── simple-player/   # Example sample project
    │   │   └── package.json
    │   └── cmaf-ham/        # Another sample project
    │       └── package.json
    ├── docs/                # Documentation source
    ├── scripts/             # Shared utility scripts
    ├── package.json         # <--- Root package.json (Controls Workspaces)
    ├── tsconfig.json        # <--- Root TypeScript config
    └── README.md
    ```

4.  **Shared Tooling (via Root Scripts):**
    *   Instead of defining `build`, `test`, and `lint` commands separately in *each* package's `package.json`, many common tasks are defined in the *root* `package.json`.
    *   These root scripts often use the `-ws` flag (short for `--workspaces`), which tells npm to run the command in *each* workspace directory (`lib`, `dev`, `samples/*`, etc.) that defines that script.
    *   **Benefit:** Ensures consistent build, testing, and linting processes across the entire project with single commands.

## How to Use: Developing within the Monorepo

Let's revisit the use case: fixing a bug in `lib` and testing it in `samples/simple-player`.

1.  **Clone & Install:** First, get the code and install dependencies.
    ```bash
    git clone https://github.com/streaming-video-technology-alliance/common-media-library.git
    cd common-media-library
    npm install
    ```
    *   Running `npm install` in the root directory reads the `workspaces` configuration in the root `package.json`.
    *   It downloads all dependencies needed by `lib`, `dev`, *and* all the `samples` packages.
    *   Crucially, it **links** the local packages together. The `samples/simple-player` package will automatically use the `lib` code directly from your local `lib/` directory, not from a published version on npm.

2.  **Make Changes:** Edit the necessary files inside the `lib/src/` directory to fix the bug.

3.  **Build Everything:** To ensure your changes compile correctly and any dependent code is updated, run the build command from the root.
    ```bash
    npm run build -ws
    ```
    *   The `-ws` flag tells npm: "Go into each workspace (`lib`, `dev`, `samples/*`) and run the `build` script defined in *its* `package.json`, if it exists."
    *   This compiles the TypeScript code in `lib/src/` to JavaScript in `lib/dist/`, and potentially builds other packages too.

4.  **Test:** Run tests across all packages to check for regressions.
    ```bash
    npm test -ws
    ```
    *   Similar to build, this runs the `test` script defined in each workspace's `package.json`.

5.  **Run the Sample:** Now, navigate to the specific sample project and run its start command (defined in `samples/simple-player/package.json`).
    ```bash
    cd samples/simple-player
    npm start # Or whatever the start command is for that sample
    ```
    *   Because `npm install` linked the packages, this sample application is now running using the *exact code* you just modified in the `lib/` directory. You can immediately see if your fix worked without publishing anything!

6.  **Running Scripts in Specific Workspaces:** If you *only* want to run a script in one specific workspace from the root directory, you can use the `-w` (or `--workspace`) flag:
    ```bash
    # Run the 'start' script only in the 'dev' package
    npm start -w dev

    # Run the 'dev' script only in the 'cmaf-ham-conversion' sample
    npm run dev -w cmaf-ham-conversion
    ```

The monorepo structure with npm workspaces makes this cross-package development workflow seamless.

## Under the Hood: How `npm workspaces` Works

The magic happens primarily due to the configuration in the root `package.json` and how npm interprets it.

1.  **Defining Workspaces:** The root `package.json` contains a `workspaces` array listing the paths to the individual packages.

    ```json
    // package.json (Root - Simplified)
    {
      "name": "@svta/common-media-library-workspace",
      "private": true, // Root package is usually not published
      "scripts": {
        // Scripts that run across workspaces using -ws
        "build": "npm run build -ws --if-present",
        "test": "npm test -ws --if-present",
        "lint": "eslint .", // Lint runs from root across all files
        // Script to run a specific workspace command
        "start": "npm start -w dev"
      },
      "workspaces": [ // <--- This is the key!
        "lib",
        "docs",
        "dev",
        "samples/*" // The '*' includes all subdirectories in samples/
      ],
      "devDependencies": {
        // Common tools used across the project (TypeScript, ESLint, etc.)
        "typescript": "...",
        "eslint": "..."
      }
    }
    ```
    *   The `"workspaces"` array tells npm where to find the other `package.json` files that define the individual packages (`lib`, `dev`, etc.).
    *   The `devDependencies` here often include tools used by multiple packages.

2.  **Linking during `npm install`:** When you run `npm install` in the root:
    *   npm finds all packages listed in `workspaces`.
    *   It installs dependencies for *all* these packages.
    *   Crucially, if one workspace (e.g., `samples/simple-player`) lists another workspace (e.g., `@svta/common-media-library` from `lib`) as a dependency in its `package.json`, npm creates a symbolic link (`symlink`) in the `node_modules` folder.
    *   This means `samples/simple-player/node_modules/@svta/common-media-library` points directly to your local `lib/` folder, not to a downloaded copy.

3.  **The `-ws` Flag:** When you use `-ws` with commands like `npm run build -ws` or `npm test -ws`:
    *   npm iterates through each directory listed in the `workspaces` array.
    *   For each directory, it checks if the corresponding script (e.g., `build` or `test`) exists in that workspace's `package.json`.
    *   If the script exists, npm executes it *within that workspace's directory*. The `--if-present` flag prevents errors if a workspace doesn't define that specific script.

**Conceptual Diagram:**

```mermaid
graph TD
    Root[Root `package.json` (Monorepo)] -- manages --> WS[Workspaces]
    Root -- defines common scripts --> BuildCmd(npm run build -ws)
    Root -- defines common scripts --> TestCmd(npm test -ws)
    Root -- defines common scripts --> LintCmd(npm run lint)

    WS --- lib(lib/)
    WS --- dev(dev/)
    WS --- samples(samples/*)
    WS --- docs(docs/)

    subgraph "npm install (in root)"
        direction LR
        Install --> Link1[Link lib to samples]
        Install --> Link2[Link lib to dev]
        Install[npm install] --> Dep1[Install deps for lib]
        Install --> Dep2[Install deps for dev]
        Install --> Dep3[Install deps for samples]
    end

    subgraph "npm run build -ws"
        direction LR
        BuildCmdWS[Run Build in Workspaces] --> BuildLib[Run `build` in lib/]
        BuildCmdWS --> BuildDev[Run `build` in dev/ (if exists)]
        BuildCmdWS --> BuildSamples[Run `build` in samples/* (if exists)]
    end

    click Root "https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/package.json" "Root package.json" _blank
    click lib "https://github.com/streaming-video-technology-alliance/common-media-library/tree/main/lib" "lib/ package" _blank
    click dev "https://github.com/streaming-video-technology-alliance/common-media-library/tree/main/dev" "dev/ package" _blank
    click samples "https://github.com/streaming-video-technology-alliance/common-media-library/tree/main/samples" "samples/ packages" _blank
```

This organized structure makes managing the interconnected parts of the `common-media-library` project much simpler for developers.

## Conclusion

In this final chapter, we pulled back the curtain on the project's overall organization. We learned:

*   The project uses a **monorepo** structure, keeping related packages (`lib`, `dev`, `samples`) in one repository.
*   **npm workspaces** is the tool used to manage these packages, defined in the root `package.json`.
*   This setup simplifies **dependency management** and allows local packages to link together seamlessly during `npm install`.
*   Common development tasks like building (`npm run build -ws`) and testing (`npm test -ws`) can be run across all packages consistently using **root scripts** with the `-ws` flag.
*   This structure greatly facilitates the development workflow, especially when making changes that span across the core library and its usage examples.

You've now journeyed through the core concepts of the `common-media-library`: its API and packaging ([Chapter 1](01_library_api___packaging_.md)), handling CMCD ([Chapter 2](02_cmcd_data_handling_.md)) and CMSD ([Chapter 3](03_cmsd_data_handling_.md)), inspecting MP4 files ([Chapter 4](04_isobmff__mp4__box_parsing_.md)), understanding the SFV format ([Chapter 5](05_structured_field_values__rfc8941__serialization_deserialization_.md)), and finally, the monorepo structure that holds it all together ([Chapter 6](06_monorepo_structure___tooling_.md)).

Hopefully, this gives you a solid foundation for using or contributing to the `common-media-library` project!

---

Generated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)