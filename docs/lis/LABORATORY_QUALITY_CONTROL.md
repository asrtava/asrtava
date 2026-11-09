# ASRTAVA Internal Quality Control (IQC) & Westgard Multirule Engine

## 1. Quality Control Principles (ISO 15189 / NABL)

ASRTAVA implements automated daily Internal Quality Control (IQC) monitoring using **Levey-Jennings charts** and the standard **Westgard Multirule System**.

```
+---------------------------------------------------------------------------------------------------+
|                                     DAILY CONTROL MEASUREMENT                                     |
|   Target Mean ($\mu$)  |  Standard Deviation ($\sigma$)  |  Analyte Measured Value ($x$)          |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                      Z-SCORE DETERMINATION                                        |
|                                                                                                   |
|                                   $$Z = \frac{x - \mu}{\sigma}$$                                  |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                 WESTGARD MULTIRULE EVALUATION                                     |
|                                                                                                   |
|  $|Z| \le 2.0$                  --> IN CONTROL (Accept patient analytical run)                    |
|  $2.0 < |Z| \le 3.0$ ($1_{2s}$) --> WARNING (Inspect calibration; run patient samples with caution)|
|  $|Z| > 3.0$ ($1_{3s}$)        --> OUT OF CONTROL REJECT (Hard-stop; reject run, recalibrate)     |
|  Two consecutive $|Z| > 2.0$ ($2_{2s}$) --> SYSTEMATIC ERROR REJECT                               |
|  Difference across controls $> 4\sigma$ ($R_{4s}$) --> RANDOM ERROR REJECT                       |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Hard-Stop Analytical Run Gating

When a $1_{3s}$, $2_{2s}$, or $R_{4s}$ rule violation is detected:
1. The LIS sets `run_status = 'OUT_OF_CONTROL_REJECT'`.
2. The analyzer is immediately placed on software hold for that specific analyte.
3. Patient test results cannot be validated or released until a new control measurement is documented within acceptable limits ($\le 2\sigma$).

