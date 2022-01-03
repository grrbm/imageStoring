<h1><b>How to Run this Project</b></h1>

I made everything in Windows. Not sure if it works on Linux/Mac

Open Git Bash on VSCode

In "scripts" folder:

    1) Run "bash initContainers.sh"

This will run kill existing containers and clean.
Then it will build the project and run it

I had to use docker-compose. It is pretty much impossible to
create root user in Mongo 5 when initializing the DB without it.

If you want to change the port mapping check out this file
(docker-compose.yml) in the root folder.

Once everything is up and running, you can test the demo scripts.

    2) Run "bash demoC.sh" to get the samples from the "samples" directory and upload them
    to the database.

    3) Run "bash demoR.sh" to read the images you just uploaded to the database and output them
    to "output" folder.

    4) Run "bash demoU.sh" to substitute (update) the first image in the output folder (outputImage1)

    5) Then run "bash demoR.sh" again to read the images back into that folder, and check
    updated version of outputImage1

If you want to see the description of the methods in the API,
visit http://localhost:8080/docs in your browser.
