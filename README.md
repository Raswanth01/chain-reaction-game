# ⛓️ CHAIN REACTOR: SYSTEM PROTOCOL 

### ► CORE SYSTEM OBJECTIVE

The grid is a $6 \times 12$ network of vulnerable nodes. Your mission is to infiltrate, occupy, and expand your signature across all sectors.

* **Victory Condition (Wipeout):** Achieve total domination by eliminating every rival signature from the grid.
* **Victory Condition (Timeout):** If the **Global Clock** hits `00:00`, the entity with the highest **Accumulated Score** is granted root access.
* **The Draw Protocol:** In the event of a score parity at `00:00`, the system records a **DRAW**, and no supremacy is awarded.

### ► DEPLOYMENT & INITIALIZATION

* **1. Action Window:** You are allotted a **20-second turn** to execute code. You may either **Place a Dot** or **Execute a Power-Up**.
* **2. Jumpstart Initialization:** To prevent early-game stalemates, your very first move instantly fills a cell to **[Capacity - 1]**.
* *Example:* A Center node (Cap 4) starts with 3 dots; a Corner (Cap 2) starts with 1.


* **3. Standard Expansion:** All subsequent moves inject exactly **+1 dot** into empty or controlled cells.
* **4. Access Denied:** You cannot manually place dots in sectors owned by opponents unless an active **Bomb** or **Swap** override is in progress.

### ► CHAIN REACTION MECHANICS

* **Critical Mass:** Stability thresholds are determined by node coordinates:
* **Corners:** 2 Dots (High Volatility).
* **Edges:** 3 Dots.
* **Center:** 4 Dots.


* **Detonation Flow:** Upon hitting critical mass, a cell detonates, dispersing dots to **orthogonal neighbors** (North, South, East, West).
* **Recursive Exploits:** If a neighbor hits its threshold from a transfer, it triggers an immediate secondary explosion, creating a **Chain Reaction**.

### ► HACKER OVERRIDES (REWARDS)

* **Portal Warp (Hacker Mode):** Specific cells are hardcoded as entry/exit pairs. Explosions hitting a portal are instantly re-routed to the linked coordinate.
* **Kinetic Bomb:** Earned after a **5-step chain reaction**. Deploys a high-impact surge that clears every dot from the **target cell and its four neighbors**.
* **Empire Swap:** The ultimate heist, earned through a **7-step chain** + **250 score**. This allows you to trade your entire territory with a targeted opponent in one move.

### ► SCORING & DATA YIELD

* **Deployment Points:** Every manual placement grants **+1 point**.
* **Explosion Yield:** You earn **+1 point for every dot** that successfully transfers into a new cell during an explosion.
* **Tactical Score:** Cumulative points are used to unlock high-tier assets like the **Empire Swap**.

To complete your **System Protocol** for the **NIT Trichy** inductions, here is the detailed breakdown of the **Elimination Protocol**. This section is crucial because it explains the "blacklist" logic you coded to keep the game running smoothly when players lose or drop out.

---

### ► ELIMINATION & INACTIVITY PROTOCOLS

**1. TOTAL WIPEOUT (Hard Elimination)**

* **Trigger:** A player is officially eliminated when they control **zero nodes** on the grid.
* **Safety Lock:** A player cannot be wiped out before they have executed their **Initialization Move** (First Turn).
* **Verification:** The system only confirms a wipeout once all **active animations** (flying dots) have landed to ensure no last-second captures are possible.

**2. SYSTEM TIMEOUT (Inactivity)**

* **Turn Expiry:** If a player's individual **20-second turn clock** hits `00:00` without an action, they are flagged as **Inactive**.
* **Asset Freeze:** Upon timing out, the player's existing dots remain on the board as **Frozen Assets**. These nodes can be captured by rivals, but the timed-out player can no longer take turns.



## 🎬 WORKING DEMO

