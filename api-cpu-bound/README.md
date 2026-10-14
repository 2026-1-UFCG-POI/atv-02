# CPU BOUND API

A FastAPI service that counts the prime numbers up to a given limit using the Sieve of Eratosthenes. It's a CPU-bound workload.

## Running with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running

### 1. Build the image

From the project root (where the `Dockerfile` lives):

```bash
docker build -t cpu-bound-api .
```

### 2. Run the container

```bash
docker run --rm -p 8000:8000 --name cpu-bound-api cpu-bound-api
```

The API is now available at `http://localhost:8000`.

To run it in the background instead, add `-d`:

```bash
docker run -d --rm -p 8000:8000 --name cpu-bound-api cpu-bound-api
```

To use a different host port (e.g. `9000`), change the left side of `-p`:

```bash
docker run --rm -p 9000:8000 cpu-bound-api
```

### 3. Call the API

```bash
curl "http://localhost:8000/primes/count?limit=1000000"
```

Response:

```json
{"limit":1000000,"count":78498}
```

| Query param | Type | Default     | Constraints              |
|-------------|------|-------------|--------------------------|
| `limit`     | int  | `1000000`   | `0 <= limit <= 500000000` |

Interactive docs (Swagger UI) are at `http://localhost:8000/docs`.

> **Note:** large `limit` values use a lot of CPU and memory (the sieve allocates a list of `limit + 1` entries). You can cap the container's resources with flags such as `--cpus=1 --memory=2g`.

### 4. Stop the container

If running in the foreground, press `Ctrl+C`. If running detached:

```bash
docker stop cpu-bound-api
```
