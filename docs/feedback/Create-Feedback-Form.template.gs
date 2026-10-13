// Generated from form-spec.json. Run createCafeFeedbackForm in your own Apps Script project.
// Creates a private response spreadsheet and an UNPUBLISHED form. Never deletes responses.
const CAFE_FORM = __FORM_SPEC__;

function createCafeFeedbackForm() {
  const props = PropertiesService.getUserProperties();
  const existing = props.getProperty('CAFE_FEEDBACK_FORM_ID');
  if (existing) {
    const form = FormApp.openById(existing);
    logCafeLinks_(form);
    if (props.getProperty('CAFE_FEEDBACK_COMPLETE') !== 'yes') {
      console.log('Previous setup was interrupted. Inspect the draft instead of rerunning or deleting responses.');
    }
    return; // Repeated runs never create duplicate forms or reset real feedback.
  }
  const form = FormApp.create(CAFE_FORM.title, false);
  props.setProperty('CAFE_FEEDBACK_FORM_ID', form.getId());
  form.setDescription(CAFE_FORM.description)
      .setCollectEmail(false)
      .setLimitOneResponsePerUser(false)
      .setAllowResponseEdits(false)
      .setPublishingSummary(false)
      .setShowLinkToRespondAgain(false)
      .setShuffleQuestions(false)
      .setProgressBar(false)
      .setConfirmationMessage(CAFE_FORM.confirmation);

  form.addSectionHeaderItem().setTitle('1 / 3 · a quick check-in');
  const entry = form.addMultipleChoiceItem().setTitle(CAFE_FORM.entry.title).setRequired(true);
  const pages = {};
  const order = ['played', 'blocked', 'preview'];
  order.forEach(function (key) {
    const branch = CAFE_FORM.branches[key];
    pages[key] = form.addPageBreakItem().setTitle(branch.title).setHelpText(branch.description);
    branch.questions.forEach(function (q) { addCafeQuestion_(form, q); });
  });
  const finalPage = form.addPageBreakItem().setTitle(CAFE_FORM.common.title).setHelpText(CAFE_FORM.common.description);
  CAFE_FORM.common.questions.forEach(function (q) { addCafeQuestion_(form, q); });
  entry.setChoices(CAFE_FORM.entry.options.map(function (label, index) {
    return entry.createChoice(label, pages[CAFE_FORM.entry.routes[index]]);
  }));

  // IMPORTANT: PageBreakItem navigation applies to the PREVIOUS section.
  // End of played -> final, end of blocked -> final, end of preview -> final.
  pages.blocked.setGoToPage(finalPage);
  pages.preview.setGoToPage(finalPage);
  finalPage.setGoToPage(FormApp.PageNavigationType.CONTINUE);

  const sheet = SpreadsheetApp.create('After Hours Café · player feedback');
  props.setProperty('CAFE_FEEDBACK_SHEET_ID', sheet.getId());
  const notes = sheet.getSheets()[0];
  notes.setName('Read me');
  notes.getRange(1, 1, 9, 2).setValues([
    ['AFTER HOURS CAFÉ', 'Feedback notebook'],
    ['Owner', 'Keep this spreadsheet private. Share only the responder form URL.'],
    ['Played', 'Use highlight, friction, pace and return answers from actual players.'],
    ['Could not play', 'Fix access, loading, device and control blockers before adding features.'],
    ['Screenshot only', 'Use first-impression answers for presentation; these are not gameplay reviews.'],
    ['Next priority', 'Count separately by experience and optional PC game habit.'],
    ['Unknowns', 'Exclude did-not-play-enough answers from pace/return judgments; report their count.'],
    ['Interpretation', 'A LinkedIn convenience sample is direction, not a Steam sales forecast.'],
    ['Changes', 'Do not rename live questions casually. Duplicate the form for major survey revisions.']
  ]);
  notes.setColumnWidth(1, 190); notes.setColumnWidth(2, 690);
  notes.getRange('A1:B1').setBackground('#35664f').setFontColor('#ffffff').setFontWeight('bold');
  notes.getDataRange().setWrap(true); notes.setFrozenRows(1);
  const roadmap = sheet.insertSheet('Next build');
  roadmap.appendRow(['Issue / feature', 'Evidence / quote', 'Experience segment', 'People mentioning it', 'Severity', 'Decision', 'Next small experiment']);
  roadmap.getRange('A1:G1').setBackground('#35664f').setFontColor('#ffffff').setFontWeight('bold');
  roadmap.setFrozenRows(1); roadmap.setColumnWidths(1, 7, 180);
  roadmap.getRange('E2:E200').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Blocks play', 'Interrupts core loop', 'Polish / request'], true).build());
  roadmap.getRange('F2:F200').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Fix now', 'Test next', 'Explore later', 'Needs evidence'], true).build());
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  props.setProperty('CAFE_FEEDBACK_COMPLETE', 'yes');
  logCafeLinks_(form);
  console.log('DRAFT READY. Add the header/theme in the editor, then Publish -> responder access Anyone with the link. The edit link and response spreadsheet stay private.');
}

function addCafeQuestion_(form, q) {
  const title = q.title + (q.required ? '' : ' (optional)');
  const item = q.type === 'paragraph' ? form.addParagraphTextItem() : form.addMultipleChoiceItem();
  item.setTitle(title).setRequired(q.required);
  if (q.help) item.setHelpText(q.help);
  if (q.options) item.setChoiceValues(q.options);
  return item;
}

function logCafeLinks_(form) {
  console.log('EDIT (private): ' + form.getEditUrl());
  console.log('RESPOND (publish before sharing): ' + form.getPublishedUrl());
  const id = PropertiesService.getUserProperties().getProperty('CAFE_FEEDBACK_SHEET_ID');
  if (id) console.log('RESPONSES (private): https://docs.google.com/spreadsheets/d/' + id + '/edit');
}
