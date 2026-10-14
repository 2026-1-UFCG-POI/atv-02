def count_primes(limit: int) -> int:
    """Count primes up to and including `limit` using a sieve of Eratosthenes."""
    if limit < 2:
        return 0
 
    sieve = [True] * (limit + 1)
    sieve[0] = sieve[1] = False
 
    for i in range(2, int(limit**0.5) + 1):
        if sieve[i]:
            for j in range(i * i, limit + 1, i):
                sieve[j] = False
 
    return sum(sieve)
