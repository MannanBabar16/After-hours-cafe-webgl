// Generated from form-spec.json. Run createCafeFeedbackForm in your own Apps Script project.
// Creates a private response spreadsheet and an UNPUBLISHED form. Never deletes responses.
const CAFE_FORM = {
  "title": "After Hours Café · leave a little feedback",
  "description": "I'm testing ideas for a future PC café game. A few honest taps help me decide what to keep, fix and build next. About a minute; typing is optional. No name or email needed.",
  "confirmation": "Thanks for stopping by. I'll use this to choose what to fix and build next for the PC game. Even one small observation helps. — Mannan",
  "theme": {
    "accent": "#35664f",
    "background": "#f4e8d6",
    "text": "#493c2f",
    "headerFont": "Georgia",
    "bodyFont": "Arial"
  },
  "entry": {
    "id": "experience",
    "title": "What did you get to try?",
    "required": true,
    "options": [
      "I played a little",
      "I tried, but couldn't play",
      "I only saw the screenshots / post"
    ],
    "routes": [
      "played",
      "blocked",
      "preview"
    ]
  },
  "branches": {
    "played": {
      "title": "2 / 3 · how was your evening?",
      "description": "A short session is enough. Pick what fits your experience.",
      "questions": [
        {
          "id": "highlight",
          "title": "What did you enjoy most?",
          "required": true,
          "options": [
            "Making and serving coffee",
            "Running the café and earning money",
            "The cozy café atmosphere",
            "Baking, restocking or upgrading",
            "I didn't get far enough to tell",
            "Nothing stood out yet"
          ]
        },
        {
          "id": "friction",
          "title": "Where did you get stuck, if anywhere?",
          "required": true,
          "options": [
            "Working out what to do first",
            "Moving or using the camera",
            "Making coffee / using equipment",
            "Finding or completing an order",
            "Buying supplies / understanding money",
            "Nothing got in my way",
            "I didn't get far enough to tell"
          ]
        },
        {
          "id": "pace",
          "title": "How did the pace feel?",
          "required": true,
          "options": [
            "Too slow — I wanted more to do",
            "About right for me",
            "Too rushed — I wanted more breathing room",
            "I didn't play long enough to tell"
          ]
        },
        {
          "id": "return",
          "title": "After this session, would you choose another evening?",
          "required": true,
          "options": [
            "Yes, I'd keep playing",
            "Maybe, with a few changes",
            "Probably not for me",
            "I didn't play enough to decide"
          ]
        }
      ]
    },
    "blocked": {
      "title": "2 / 3 · what got in the way?",
      "description": "You don't need to review gameplay you couldn't try.",
      "questions": [
        {
          "id": "blocker",
          "title": "What happened when you tried?",
          "required": true,
          "options": [
            "The page wouldn't open / asked me to sign in",
            "The game kept loading or showed a blank screen",
            "It ran too slowly / froze",
            "I couldn't work out the controls",
            "It was difficult to use on my phone",
            "Something else"
          ]
        }
      ]
    },
    "preview": {
      "title": "2 / 3 · just your first impression",
      "description": "No need to guess how it plays. This part is about what you saw.",
      "questions": [
        {
          "id": "first_impression",
          "title": "What caught your attention, if anything?",
          "required": true,
          "options": [
            "The cozy café art and mood",
            "Making coffee",
            "Running a café business",
            "The customers, robots or drive-through",
            "Nothing caught my attention yet",
            "I couldn't tell what the game was about"
          ]
        }
      ]
    }
  },
  "common": {
    "title": "3 / 3 · help me choose the next step",
    "description": "One priority is more useful to me than a long wishlist.",
    "questions": [
      {
        "id": "priority",
        "title": "If I focused on one thing next, what would you pick?",
        "required": true,
        "options": [
          "Clearer first steps and controls",
          "More hands-on coffee making",
          "More café decoration and layouts",
          "Deeper business choices and progression",
          "More customer stories and regulars",
          "More recipes, food and daily events",
          "Smoother performance and fewer bugs",
          "Something else / I'm not sure yet"
        ]
      },
      {
        "id": "device",
        "title": "What did you use to view or play?",
        "required": false,
        "options": [
          "Windows PC / laptop",
          "Mac / Linux computer",
          "Android phone / tablet",
          "iPhone / iPad",
          "Another device"
        ]
      },
      {
        "id": "pc_habit",
        "title": "Do you usually play café / cozy management games on PC?",
        "required": false,
        "options": [
          "Yes, fairly often",
          "Sometimes",
          "Rarely / never",
          "I don't play on PC"
        ]
      },
      {
        "id": "detail",
        "title": "One thing you'd change?",
        "required": false,
        "type": "paragraph",
        "help": "Optional. One sentence is plenty. If something broke, what were you doing and which browser were you using? Please leave out personal information."
      }
    ]
  }
};

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
