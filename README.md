# Slime Mold: CS420X Assignment 3

Slime Mold (physarum) simulation. Based on [this blog post](https://sagejenson.com/physarum) and [this paper](https://uwe-repository.worktribe.com/output/980579). Inspiration for the implementation was sourced from [this blog post](https://kaesve.nl/projects/mold/summary.html).

[Demo](https://ollien.github.io/slime-mold/)

If you get poor performance with the demo, shrink your window and/or zoom in. This shader renders about 622k particles on a 1080p screen, so performance can suffer on some systems.

![Image of the simulation](https://raw.githubusercontent.com/ollien/slime-mold/master/screenshot.png?token=AAHOR72ED77AIEZUUPMKXC26LCBN4)

## Controls
Parameters of the simulation, which are described in the paper, can be adjusted in a GUI within the simulation. Further, dragging within the simulation will "disturb" the mold, allowing you to cut through it. Holding shift while you do this will bring some mold closer to your cursor.

## Installation

To run the development server, run.
```
npm install
npm start
```
If you just wish to build the static files and host this on your own webserver, you can run
```
npm run-script build
```
