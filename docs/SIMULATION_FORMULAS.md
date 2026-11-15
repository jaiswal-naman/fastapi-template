# Simulation formulas

- **Transmission delay (ms):** `(payloadBytes × 8) / (bandwidthMbps × 1e6) × 1000`
- **Propagation delay (ms):** `(distanceKm × 1000) / propagationSpeedMps × 1000`
- **Processing delay:** default `0.1 ms` per node (overridable)
- **Queueing:** FIFO; overflow → `queue_overflow` drop; simplistic service contribution `0.05 ms × queueLength`
- **Jitter:** mean absolute difference between consecutive delivered packet delays
- **Throughput:** delivered payload bits / elapsed measurement window
- **Packet delivery ratio:** `delivered / sent × 100`
- **Nyquist:** `C = 2B log2(M)`
- **Shannon:** `C = B log2(1 + 10^(SNR_dB/10))`
- **PCM:** `R = n × fs`
