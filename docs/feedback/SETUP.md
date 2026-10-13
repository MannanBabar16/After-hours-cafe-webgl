# After Hours Café feedback setup

The question flow, theme assets, draft builder and preview are prepared. A live Google Form still needs to be created in the owner's Google account. No Google Form has been created by running these files locally.

## Create it in your Google account

1. Open [a new Apps Script project](https://script.google.com/home/start), signed into the Google account that should own the form.
2. Replace the contents of `Code.gs` with **Create-Feedback-Form.gs** from this folder. The complete configuration is already embedded; you do not need to paste JSON separately.
3. Choose `createCafeFeedbackForm` in the function dropdown, click **Run**, and review Google's requested permissions for Forms and Sheets. This creates your unpublished form and private response spreadsheet. It does not send email, read your inbox, or deploy a web app.
4. Copy the **EDIT (private)** URL from the execution log and open it. Keep that URL and the response spreadsheet private. Repeated runs return the same form; they do not reset responses.
5. In the theme palette, upload **Google-Forms-Header.png** as the header. Set theme color **#35664f**, use a pale cream background, and select a readable body font. Use Georgia for the header where available. Google controls its own layouts; the preview is an approximation, not custom CSS installed into Forms.
6. Check Settings: email collection **off**, limit to one response **off**, response editing **off**, results summary **off**, question shuffling **off**. Keep the form accessible without a Google login. If your account offers **Disable autosave for all respondents**, turn it on to avoid a save-progress sign-in prompt.
7. Click **Publish**, choose responder access **Anyone with the link**, and copy the **responder** link. Keep editor access restricted to you. Publishing alone is not the same as public responder access.
8. Open the responder link in a signed-out/incognito browser. Submit one clearly marked test on each path: played, couldn't play, screenshots only. Confirm each goes to the shared last section and that rows appear in the private spreadsheet. Remove only your test responses after verification.
9. Send the responder link back to this chat so it can be added to the launch caption and verified. Do not send the private spreadsheet or editor link in a LinkedIn post.

Google documents [answer-based sections](https://support.google.com/docs/answer/141062?hl=en), [theming](https://support.google.com/docs/answer/145737?hl=en), and [publishing and responder access](https://support.google.com/docs/answer/2839588?hl=en). The draft builder uses the [Apps Script Forms service](https://developers.google.com/apps-script/reference/forms/form) and the [documented page-break navigation rules](https://developers.google.com/apps-script/reference/forms/page-break-item).

## What people answer

- First screen: whether they played, couldn't play, or only saw screenshots.
- Played: favorite part, biggest friction, pace, and whether they'd choose another shift.
- Couldn't play: the access/loading/performance/control blocker.
- Screenshots: first impression only, with a neutral 'nothing caught my attention' option.
- Last screen: one development priority; optional device, PC genre familiarity and one short comment.

The played route has six required selections; the other routes have three. Three visible sections per route. No name, email, demographic questionnaire, file upload, mandatory typing or grid ranking. The one-minute estimate is a design target; verify it with a few real people.

Progress uses short section titles rather than Google's global progress bar, which can count skipped branches. No answers are preselected. Gameplay and presentation feedback remain separate. Ratings of pace and return include 'not enough play' choices.

The design favors easy choices over mandatory paragraphs, following [Pew's evidence on open-question nonresponse](https://www.pewresearch.org/decoded/2021/10/14/why-do-some-open-ended-survey-questions-result-in-higher-item-nonresponse-rates-than-others/) and [NN/g's form design guidance](https://www.nngroup.com/articles/web-form-design/). These are design principles, not a promised response-rate uplift.

## Turn responses into the next PC build

Start with people who tried and couldn't play. Fix blockers before adding features. Among actual players, count each friction answer, then compare pace and desire for another evening. Exclude 'not enough play' from those judgments and report how many chose it.

Count requested priorities separately for played, blocked and screenshot-only respondents. Optionally split by PC café/management familiarity. Don't treat screenshot interest as playtest success or purchase intent. Use repeated comments to choose one small experiment for the **Next build** sheet: state the change, what problem it addresses and how you'll test it.

Keep the linked raw response sheet private and intact. The builder also makes a **Read me** sheet and an empty **Next build** decision log. These contain guidance, not fabricated responses. A small self-selected LinkedIn sample will help with direction; it won't predict Steam sales.

## Edit centrally

Edit **form-spec.json**, then run `node scripts/prepare-feedback.mjs` from the repository. It regenerates the ready-to-paste builder and standalone preview. The builder intentionally does not overwrite an existing live form. For a major revision, create a new Apps Script project and a new survey; keep old response versions separate.

Open **preview.html** to try all paths. Its answers stay in the page and are not collected. Use the actual Google Form editor to edit minor wording after creation.
