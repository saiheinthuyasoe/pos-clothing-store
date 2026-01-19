## 🔥 Firebase Firestore (Free Plan)

**What it is:**
Firebase Firestore is a **cloud database** made by Google. It stores data like users, messages, products, etc.

**Free (Spark) plan gives you:**

* ✅ **1 GB storage**
* ✅ **50,000 reads per day**
* ✅ **20,000 writes per day**
* ✅ **20,000 deletes per day**
* ✅ Works in real-time (data updates instantly)
* ✅ Very easy to use with Android, Web, iOS

**Good for:**

* Small apps
* Student projects
* Chat apps
* Apps that need real-time data

**Limitations:**

* ❌ Daily limits (reads/writes)
* ❌ No advanced server features
* ❌ Can become expensive if app grows a lot

---

## ☁️ Cloudflare R2 (Free Plan)

**What it is:**
Cloudflare R2 is **object storage**. It stores **files**, not app data logic.
Example: images, videos, backups, PDFs.

**Free plan gives you:**

* ✅ **10 GB storage**
* ✅ **No egress (download) fees**
* ✅ **1 million Class A operations/month**
* ✅ **10 million Class B operations/month**

**Good for:**

* Storing images and videos
* Website assets
* Backups
* Cheap file storage

**Limitations:**

* ❌ Not a database
* ❌ No real-time updates
* ❌ Needs extra logic to connect with apps

---

## 🔄 Simple Comparison

| Feature      | Firestore       | Cloudflare R2          |
| ------------ | --------------- | ---------------------- |
| Type         | Database        | File storage           |
| Stores       | App data (JSON) | Files (images, videos) |
| Real-time    | ✅ Yes           | ❌ No                   |
| Free storage | 1 GB            | 10 GB                  |
| Best for     | App logic       | Media & files          |

---

Sure! Here’s a **simple pricing plan comparison** for **Firebase Firestore (Blaze plan)** and **Cloudflare R2** so you can see how much they cost and what’s free:

---

## 📌 **1. Firebase Firestore (Blaze — Pay-as-you-go)**

Firestore charges based on what you *actually use* after you go above the free quotas. You still get the free quotas from the Spark (free) plan, but if you pass them you pay for extra usage. ([Firebase][1])

### 🆓 **Free quotas (per day/month)**

✔ 1 GiB data stored
✔ 50,000 document **reads per day**
✔ 20,000 **writes per day**
✔ 20,000 **deletes per day**
✔ 10 GiB **outgoing data per month**
(All these are free even on Blaze — you pay only for usage above these) ([Firebase][1])

---

### 💵 **Typical Blaze pricing (approx US rates)**

**After free quotas are used:**

| Charge Type                   | Price (approx)                                       |
| ----------------------------- | ---------------------------------------------------- |
| **Reads** (100,000 reads)     | ~$0.06                                               |
| **Writes** (100,000 writes)   | ~$0.18                                               |
| **Deletes** (100,000 deletes) | ~$0.02                                               |
| **Storage**                   | ~$0.18 per GiB-month                                 |
| **Bandwidth** (data sent out) | Depends on region (often ~$0.12/GB after free limit) |

*(exact rates may vary by region)* 

---

### 📍 **How billing works**

* You pay **only for the extra usage** beyond the free quotas.
* You **add a payment method** (Blaze plan requires this).
* No monthly base fee — just pay what you use.
**Example:**
If you store 2 GiB total and use 300,000 reads/month beyond free quota:
✔ Storage cost ~ (1 GiB extra × $0.18)
✔ Reads cost ~ (200,000 extra reads × $0.06/100k ≈ $0.12)
➡️ Total ≈ ~$0.30/month (very rough example)

---

## 📌 **2. Cloudflare R2 (Object Storage)**

Cloudflare R2 is for storing **files** (images, videos, backups). It’s cheaper for large files and has no egress (download bandwidth) cost.

### 🆓 **Free tier**

✔ **10 GB storage free per month**
✔ **1,000,000 Class A ops free** (writes & list)
✔ **10,000,000 Class B ops free** (reads)
✔ **Data egress (downloads) free** (no charge) 

---

### 💵 **R2 pricing after free tier**

(approx US pricing)

| Component                    | Price                   |
| ---------------------------- | ----------------------- |
| **Storage**                  | **$0.015 per GB/month** |
| **Class A ops** (write/list) | **$4.50 per 1,000,000** |
| **Class B ops** (read)       | **$0.36 per 1,000,000** |
| **Egress** (downloads)       | **FREE**                |


---

## 🧠 **Simple comparison summary**

| Feature        | **Firestore (Blaze)**            | **Cloudflare R2**            |                 |
| -------------- | -------------------------------- | ---------------------------- | --------------- |
| What it stores | Database documents (text/JSON)   | Files (images, videos, docs) |                 |
| Free tier      | 1 GiB, daily ops                 | 10 GB, free egress           |                 |
| Main cost type | Reads/writes, storage, bandwidth | Storage + operations         |                 |
| Good for       | App data                         | File storage & delivery      |                 |
| Egress cost    | Billed after free tier           | **Free**                     | ([Firebase][1]) |


---

[1]: https://firebase.google.com/docs/firestore/pricing?utm_source=chatgpt.com "Understand Cloud Firestore billing  |  Firebase"
[2]: https://r2-calculator.cloudflare.com/?utm_source=chatgpt.com "Cloudflare R2 - Pricing Calculator"
