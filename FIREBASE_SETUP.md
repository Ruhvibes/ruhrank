# 🔥 RuhRank Firebase Setup — Hasnain ke liye (sirf ek baar karna hai)

> Har step chhota hai. Ek step karo, tick karo, agla step. Koi password mujhe bhejne ki zaroorat nahi.

## Step 1 — Naya project banao
1. Phone/Chrome me kholo: **console.firebase.google.com**
2. **"Create a new Firebase project"** (ya "Add project") pe tap karo.
3. Project name likho: **`RuhRank`** → Continue dabao.
4. Google Analytics: **OFF** karke (toggle band) → Create project dabao → thoda wait karo.

## Step 2 — Web app add karo + config copy karo
1. Project khulne ke baad **Web icon (`</>`)** pe tap karo ("Add an app" me).
2. App nickname: **`RuhRank Admin`** likho → Register app.
3. Jo `firebaseConfig = {...}` code dikhe, usko **copy** karo.
4. `~/workspace/ruhrank/admin/index.html` me sabse upar wale comment me likhe hisaab se `<script>window.RR_FIREBASE_CONFIG = {...}</script>` chipka do (main script se PEHLE).

## Step 3 — Login methods ON karo
1. Left menu → **Build → Authentication** → **Get started** dabao.
2. **Sign-in method** tab kholo.
3. **Anonymous** → Enable → Save.
4. **Email/Password** → Enable → Save.

## Step 4 — Database banao
1. Left menu → **Build → Firestore Database** → **Create database**.
2. Location: **`asia-south1 (Mumbai)`** select karo → Next.
3. **"Start in production mode"** select karo → Create.

## Step 5 — Security rules lagao
1. Firestore Database → **Rules** tab kholo.
2. Wahan ka saara text delete karo.
3. `~/workspace/ruhrank/FIREBASE_SETUP.md` wale folder ki file **`firestore.rules`** ka poora content copy-paste karo.
4. **Publish** dabao.

## Step 6 — Admin user banao + UID rules me daalo
1. Left menu → **Build → Authentication** → **Users** tab → **Add user**.
2. Apna admin email + strong password daalo → Add user.
3. Users list me us email ke saamne jo **UID** dikhe, use **copy** karo.
4. `firestore.rules` file me **`ADMIN_UID_PLACEHOLDER`** ki jagah wo UID paste karo.
5. Rules tab me dobara paste karke **Publish** dabao. ✅ Done!

## Step 7 — Check karo
1. `admin/index.html` browser me kholo → panel password daalo → top-right **Sign in** → admin email/password.
2. **"Signed in: tumhara-email"** green badge dikhe = sab sahi. Ab questions add kar sakte ho!

---
**Android app ke liye (baad me, ek aur chhota step):** Firebase console → Project settings → "Add app" → Android → package name `com.ruhrank.app` → `google-services.json` download karke mujhe bhej dena — main app me daal dunga. (Push notifications/FCM isi se aayenge.)
