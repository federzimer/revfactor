# FIFA 2026 Match-Day Precision Analysis

Pull date: 2026-04-24
Match-day nights = match date + night before, per city (~2 nights per match)
Non-match control = all other nights inside June 11 – July 19 window

## Asking ADR on match-day nights vs 3-yr baseline

| City | # matches | Baseline Jun/Jul ADR (3yr) | Match-day asking ADR | % above baseline | Match-day fill | Non-match fill | Fill ratio |
|---|---:|---:|---:|---:|---:|---:|---:|
| Kansas City | 6 | $195.42 | $699.73 | 258.1% | 0.42 | 0.2 | 2.1x |
| Dallas | 9 | $210.13 | $623.36 | 196.7% | 0.24 | 0.15 | 1.6x |
| Philadelphia | 6 | $165.32 | $476.79 | 188.4% | 0.29 | 0.16 | 1.81x |
| Atlanta | 8 | $200.22 | $471.34 | 135.4% | 0.17 | 0.12 | 1.42x |
| Houston | 7 | $179.22 | $416.96 | 132.7% | 0.18 | 0.12 | 1.5x |
| Miami | 7 | $236.05 | $532.61 | 125.6% | 0.19 | 0.12 | 1.58x |
| Seattle | 6 | $240.08 | $532.58 | 121.8% | 0.38 | 0.27 | 1.41x |
| Boston | 7 | $278.82 | $450.91 | 61.7% | 0.48 | 0.26 | 1.85x |
| San Jose | 6 | $183.72 | $272.43 | 48.3% | 0.23 | 0.16 | 1.44x |
| New York | 8 | $206.03 | $257.28 | 24.9% | 0.23 | 0.21 | 1.1x |
| Los Angeles | 8 | $297.92 | $365.82 | 22.8% | 0.18 | 0.14 | 1.29x |

## Match-day asking vs non-match asking (how much more hosts charge on match nights inside the tournament)

| City | Match-day asking | Non-match asking | Gap % |
|---|---:|---:|---:|
| Kansas City | $699.73 | $578.2 | 21.0% |
| Dallas | $623.36 | $541.68 | 15.1% |
| Philadelphia | $476.79 | $332.51 | 43.4% |
| Atlanta | $471.34 | $442.92 | 6.4% |
| Houston | $416.96 | $328.91 | 26.8% |
| Miami | $532.61 | $508.92 | 4.7% |
| Seattle | $532.58 | $445.28 | 19.6% |
| Boston | $450.91 | $425.11 | 6.1% |
| San Jose | $272.43 | $243.29 | 12.0% |
| New York | $257.28 | $260.38 | -1.2% |
| Los Angeles | $365.82 | $353.18 | 3.6% |

## Booked ADR on match-day nights (inventory already sold)

| City | Match-day booked ADR | vs baseline |
|---|---:|---:|
| Kansas City | $447.72 | 129.1% |
| Dallas | $319.25 | 51.9% |
| Philadelphia | $301.25 | 82.2% |
| Atlanta | $317.8 | 58.7% |
| Houston | $268.74 | 49.9% |
| Miami | $358.54 | 51.9% |
| Seattle | $422.48 | 76.0% |
| Boston | $425.66 | 52.7% |
| San Jose | $229.1 | 24.7% |
| New York | $254.27 | 23.4% |
| Los Angeles | $313.56 | 5.2% |
