# DataComPredia demo script

1. Open the Overview. Confirm **Connected** in the top bar and empty-state metrics (not fabricated numbers).
2. **Create Lab** → choose **Star** → name it → Create. You land in Network Playground.
3. Select a PC, note IP/properties. Switch to **3D View**, orbit the scene, return to **2D**.
4. Open **Packet Playground**. Source = PC 1, Destination = Server 1, mode **TCP_SIM**, transmit.
5. Watch status → Running → Completed. Inspect packet fields and the event timeline (SYN / SYN-ACK / hops / delivered).
6. Open **Network Playground** during or after transmit — hop highlight / packet marker reflects server events.
7. Open **Performance Observatory** — throughput, latency, counts update from the same run (**Simulated** labels).
8. Trigger a **link failure**, transmit again with **UDP_SIM**, observe drop or reroute behaviour and timeline reason.
9. **Signal Studio**: enter `10100111`, Manchester, generate; step through bits; compare with AMI.
10. **Channel Lab**: Shannon with B=3000, SNR=30 dB; confirm SNR_linear and capacity units.
11. Save experiment from Packet Playground → **My Experiments** → open report → Export CSV.
