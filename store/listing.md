# Google Play listing: MakonBook

Everything to paste into Play Console for the sign-in release (1.1.0). Character
limits are Google's; all text below fits. Demo passwords are not in this repo
(it is public): type them into Play Console yourself.

## Store listing (Grow users → Store listings → Default store listing)

**App name** (9/30)

```
MakonBook
```

**Short description** (72/80)

```
Classes, QR attendance, SAT practice tests and vocabulary for SAT MAKON.
```

**Full description** (1457/4000)

```
MakonBook is the app for SAT MAKON students, parents and teachers: your classes, attendance, SAT practice and vocabulary in one place.

For students
• Classes: your groups, schedule and next lesson at a glance
• Attendance: check in by scanning your teacher's QR code, and see your attendance in every group
• SAT practice tests: timed Reading and Writing and Math modules like the digital SAT, with your scores and an explanation for every question. Download a test once and take it without internet
• Words: vocabulary lists with spaced repetition, which brings each word back just before you would forget it
• Built-in Desmos graphing calculator for Math

For parents
Enter your child's parent code to follow their classes and attendance, in Uzbek or Russian, and send a message to the SAT MAKON office. No account needed.

For teachers
Take attendance with a rotating QR code, correct marks after class, and follow each group's practice test results and vocabulary progress.

Level check
New to SAT MAKON? Take the free level check: a timed, SAT-style placement test in Math or English (50 questions, 60 minutes) that recommends your starting class: Foundation, Pre-SAT or Advanced. No account needed, and it works offline.

Student and teacher accounts are created by SAT MAKON when you join. Sign in with your phone number or username.

SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this app.
```

**Graphics**

| Field | File | Spec |
|---|---|---|
| App icon | `store/icon-512.png` | 512×512 PNG |
| Feature graphic | `store/feature-graphic.png` | 1024×500 PNG, no transparency |
| Phone screenshots | take on a phone | 2–8 images, PNG/JPEG, 16:9 or 9:16 |

Replace the 5 level-check screenshots with, in this order: Classes (student),
the Scan screen or a check-in result, Practice (a question with the calculator
open), practice results, a Words study card, the teacher's QR screen, the
parent screen, and the level check. Take them with the demo accounts, so no
real student's name is visible.

**Store settings** (unchanged): App, Education; tags Education, Test
preparation; contact nazabakhtiyorov@gmail.com, +998555111600,
https://sat-makon.uz.

## App content (Policy → App content)

### Privacy policy

Replace the page at https://sites.google.com/view/makonbook-privacy-policy/
with `store/privacy-policy.html` (the plain-text copy is
`store/privacy-policy.txt`). The URL stays the same.

### Sign in details

"Is any part of your app restricted?" → **Yes**. Add two sets of
instructions; leave "Allow Android to use the credentials…" unchecked.

**1. Student**: username `demo.student`, password: the demo student's.
Any other information:

```
Student account. On the welcome screen tap "Sign in". Tabs: Classes, Practice, Words, Profile. The raised Scan button in the middle checks in to a lesson by scanning the teacher's QR code (see the teacher account). Profile shows the parent code. Parent mode: sign out, tap "Ota-onalar uchun" on the welcome screen and enter 17110. The level check on the welcome screen needs no account.
```

**2. Teacher**: username `demo.teacher`, password: the demo teacher's.
Any other information:

```
Teacher account. The Classes tab lists today's lessons of the demo group. Open the lesson and start attendance to show a rotating QR code. To test check-in, sign in as demo.student on a second device and tap Scan. Without a second device, the student's attendance history is under Classes, on the group card. Practice and Words show the group's results.
```

Before submitting, on the API side:

- The demo group must have a lesson running at any hour, every day:
  attendance opens 15 minutes before a lesson and closes when it ends, and a
  reviewer can test at any time.
- Neither demo account may start on the forced password screen, and ideally
  the API refuses password and username changes for them, so a reviewer can't
  lock out the next one.
- Seed demo.student with a finished practice test and some vocabulary
  reviews, so Practice, Words and the teacher's group views aren't empty.

### Data safety

**Data collection and security**

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | Yes |
| Is all of the user data collected by your app encrypted in transit? | Yes |
| Which of the following methods of account creation does your app support? | My app does not allow users to create an account (SAT MAKON creates them; there is no sign-up in the app) |
| Do you provide a way for users to request that their data is deleted? | Yes (email or the office, see the privacy policy) |

**Data types**: all *collected*, none *shared* (parents' access is started
by the student, and server hosting is a service provider; neither counts as
sharing). None are processed ephemerally.

| Category → type | What it is | Required? | Purposes |
|---|---|---|---|
| Personal info → Name | name on the account, shown to teachers | Required | App functionality, Account management |
| Personal info → Phone number | used to sign in | Required | App functionality, Account management |
| Personal info → User IDs | username, account id | Required | App functionality, Account management |
| Messages → Other in-app messages | parents' messages to the office | Optional | App functionality |
| App activity → Other user-generated content | practice answers and timings, vocabulary ratings | Optional | App functionality |
| App activity → Other actions | attendance check-ins | Required | App functionality |
| Device or other IDs → Device or other IDs | random install id | Required | App functionality, Fraud prevention, security, and compliance |

Not collected: location, financial info, health, photos and videos (the
camera only reads the QR code), audio, files, calendar, contacts, app info and
performance (no crash or analytics SDK), web browsing, advertising ID.

### Other declarations (unchanged since 1.0.0)

| Section | Answer |
|---|---|
| Ads | No |
| Content rating | Education. "Users can interact or exchange content": No; parents' messages go to the school office, not to other users |
| Target audience | 13–15, 16–17, 18 and over; no under-13 group |
| Advertising ID, Government, Financial, Health | No / none |

## Release

1. Bump `version` in `app.json` to `1.1.0` (the version code is managed by EAS).
2. `eas build --platform android --profile production`, then
   `eas submit --platform android --profile production` (goes to Closed
   testing – Alpha).
3. Release notes (en-US):

   ```
   Sign in for SAT MAKON students, parents and teachers:
   • Classes and schedules
   • Attendance check-in with a QR code
   • SAT practice tests that work offline, with scores and explanations
   • Vocabulary study with spaced repetition
   • Parent mode with the child's parent code
   The level check is still free and needs no account.
   ```

4. Let testers use it for about a week, then **Dashboard → Apply for
   production**.
