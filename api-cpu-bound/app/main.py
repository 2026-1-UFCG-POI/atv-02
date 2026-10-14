from fastapi import FastAPI, Query
 
from app.service import count_primes
 
app = FastAPI(title="Prime Counter")

 
@app.get("/primes/count")
def primes_count(limit: int = Query(1_000_000, ge=0, le=500_000_000)):
    return {"limit": limit, "count": count_primes(limit)}
