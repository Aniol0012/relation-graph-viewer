# Instructions to run the project locally using Docker Hub

1. Set up a folder with the [docker-compose.prod.yml](docker-compose.prod.yml) file.

2. Pull the image from Docker Hub

```docker compose pull```

3. Run and deploy the project

```docker compose up -d```

4. Check status

```docker compose ps```

> [!IMPORTANT]
> You must have Docker installed on your machine and running.

Finally, the backend will be available at [`http://localhost:8001`](http://localhost:8001) and the frontend at [`http://localhost:3000`](http://localhost:3000).