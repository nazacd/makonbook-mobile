# Google Play listing: MakonBook

Everything to paste into Play Console for the first release. Character
limits are Google's; all text below fits.

## Store listing (Grow users → Store presence → Main store listing)

**App name** (26/30)

```
MakonBook: SAT Level Check
```

**Short description** (75/80)

```
Timed SAT-style Math and English placement tests that recommend your level.
```

**Full description** (1148/4000)

```
MakonBook is SAT MAKON's level check app. Take a timed, SAT-style placement test in Math or English and get a recommended starting class: Foundation, Pre-SAT or Advanced.

The test is built to feel like the real digital SAT, right on your phone:

• 50 questions and a 60-minute timer for each subject
• Multiple-choice and student-produced (grid-in) Math questions
• Built-in Desmos graphing calculator for Math
• Mark questions for review and rule out answer choices you've eliminated
• Jump to any question from the question navigator
• Review screen before you submit, showing answered, unanswered and marked questions
• Leave and come back: your progress is saved on your phone and the timer pauses until you return

After you submit, you'll see your recommended starting level and a color-coded question grid. Open any question to compare your answer with the correct one and read the explanation.

No account or sign-in needed. Everything except the graphing calculator works offline, and your answers never leave your device.

SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this app.
```

**Graphics**

| Field | File | Spec |
|---|---|---|
| App icon | `store/icon-512.png` | 512×512 PNG |
| Feature graphic | `store/feature-graphic.png` | 1024×500 PNG, no transparency |
| Phone screenshots | take on a phone (see below) | 2–8 images, PNG/JPEG, 16:9 or 9:16 |

Suggested screenshots, in this order: Home (Math / English), a Math question
with the calculator open, the question navigator, the review-before-submit
screen, Results, and a reviewed question with its explanation shown.

**Category:** Education
**Tags:** Education, Test preparation (pick the closest available)
**Contact email:** required, shown publicly on the listing

## App content (Policy → App content)

| Section | Answer |
|---|---|
| Privacy policy | URL of `store/privacy-policy.html` once hosted (replace `CONTACT_EMAIL` first) |
| App access | All functionality is available without special access |
| Ads | No, the app does not contain ads |
| Content rating | Category: Education/Reference. Answer "No" to violence, sexuality, language, controlled substances, gambling, user interaction/sharing, location sharing, purchases |
| Target audience | 13–15, 16–17, 18 and over. Do **not** select any under-13 group |
| Data safety | Data collection: **No**. "Does your app collect or share any of the required user data types?" → No |
| Government app | No |
| Financial features | None |
| Health | None |
| News app | No |

Data safety note: the app stores test progress only on the device and sends
nothing to any server. The Desmos calculator loads from desmos.com, but the app
passes it no user data, so there is nothing to declare.

When the login version ships, revisit App access (add a reviewer test
account), Data safety, the privacy policy, and Google's account-deletion
requirement before uploading it.

## Release

1. **Testing → Internal testing → Create new release**
2. Accept **Play App Signing** (default).
3. Upload the `.aab` from the EAS production build.
4. Release name: `1.0.0 (2)`. Release notes:

   ```
   First release: Math and English level check tests.
   ```

5. Add testers (an email list), save, and share the opt-in link.
6. Personal developer accounts created after Nov 2023: run a **closed test**
   with at least 12 testers for 14 days in a row, then apply for production
   access under **Dashboard**.
