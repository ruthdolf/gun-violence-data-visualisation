# Bivariate Choropleth: Gun Violence Rate & Republican Vote Percentage in the US

This project visualises the relationship between **the number of gun violence incidents per thousand population between 2019 and 2020** and **the percentage of Republican votes in the 2020 presidential election** in the United States using a **bivariate choropleth map**. The map highlights patterns across states for incidents per capita and voting behavior.

![Choropleth](choropleth.png)

## Methods

**Definition of gun violence:** Any incident resulting in death, injury, or threat with firearms, without consideration of intent or consequence. This includes officer-involved shootings, accidental shootings, children shooting themselves, murders, armed robberies, familicide, mass shootings, defensive gun use, home invasions, drive-bys, etc.

### Find the rate of gun violence incidents between 2019 and 2020 by state per thousand population

**Raw data example:**

| incident_id | date       | state        | city                  | address                   | n_killed | n_injured |
|------------:|------------|--------------|----------------------|---------------------------|----------|-----------|
| 1512996     | 2019-09-26 | Illinois     | Chicago              | 7000 block of S Perry Ave | 1        | 1         |
| 1513675     | 2019-09-26 | New York     | New York (Manhattan) | W 3rd St and Broadway     | 0        | 0         |
| 1518368     | 2019-09-26 | Pennsylvania | Pittsburgh           |                           | 0        | 0         |

**State-level total incidents (example):**

| State      | Count |
|------------|-------|
| Oklahoma   | 1503  |
| Maryland   | 3337  |
| Michigan   | 4093  |
| Missouri   | 3369  |
| Texas      | 8458  |

**Compute gun violence rate per 10,000 population:**

\[
\text{Gun violence rate} = \frac{\text{Total incidents by state}}{\text{Population by state}} \times 10,000
\]

| State      | Gun Violence Rate (per 10,000) |
|------------|-------------------------------|
| Oklahoma   | 3.80                          |
| Maryland   | 5.40                          |
| Michigan   | 4.06                          |
| Missouri   | 5.47                          |
| Texas      | 2.90                          |

**Merge with 2020 Election votes:**

| State       | Incident_Rate | Republicans_Percentage |
|-------------|---------------|-----------------------|
| Oklahoma    | 3.80          | 65.0                  |
| Maryland    | 5.40          | 35.0                  |
| Michigan    | 4.06          | 47.0                  |
| Missouri    | 5.47          | 56.0                  |
| Texas       | 2.90          | 52.0                  |

### Quantile Classification

- Sort gun violence rates and Republican vote percentages in ascending order.
- Identify lower (33%) and upper (66%) quantiles.
- Classify states into quantiles for **bivariate mapping**.

## Data Sets

[Download all required CSV files here](https://drive.google.com/drive/folders/1GeyRs_ODFIm-DsTjXGKTzu6kTxSg5fd9?usp=sharing)  

Sources:  
- [Gun Violence Archive](https://www.gunviolencearchive.org/)  
- [US Population by State (Kaggle)](https://www.kaggle.com/datasets/alexandrepetit881234/us-population-by-state)  
- [US Election Dataset (Kaggle)](https://www.kaggle.com/datasets/essarabi/ultimate-us-election-dataset)  

## Visualization

- **Map Type:** Bivariate choropleth  
- **X-axis:** Gun incident rate (low → high)  
- **Y-axis:** Republican vote percentage (low → high)  
- **Color Scheme:** Nine-color matrix representing combinations of quantiles  
- **Interactivity:** Hover over a state to display its gun incident rate and Republican vote percentage  

## Technologies

- **JavaScript & D3.js (v6)** for data processing and visualization  
- **HTML/CSS** for page structure and styling  

---

## File Structure

