/* ============================================================
   TestCraft – script.js
   Responsibilities
     1. Built-in example library (login, cart, file-upload)
     2. Input validation (empty / too short)
     3. Test-case generation from feature description keywords
     4. Render grouped results (Positive / Negative / Edge)
     5. Copy as plain-text table
     6. Download as CSV
     7. Toast notifications
   ============================================================ */

'use strict';

/* ── DOM references ──────────────────────────────────────── */
const featureInput    = document.getElementById('feature-input');
const generateBtn     = document.getElementById('generate-btn');
const inputError      = document.getElementById('input-error');
const outputSection   = document.getElementById('output-section');
const resultsContainer= document.getElementById('results-container');
const summaryCountsEl = document.getElementById('summary-counts');
const copyBtn         = document.getElementById('copy-btn');
const downloadBtn     = document.getElementById('download-btn');
const exampleBtns     = document.querySelectorAll('.btn-example');

/* Minimum description length before generation is allowed */
const MIN_INPUT_LENGTH = 20;

/* ── Example descriptions ─────────────────────────────────
   Three built-in stories that cover common feature types.
   ──────────────────────────────────────────────────────── */
const EXAMPLES = {
  login: `As a registered user I want to log in to the application using my email address and password so that I can access my personal dashboard and manage my account.
The login form has two fields: Email and Password, plus a "Log In" button.
Password must be at least 8 characters. After 5 failed attempts the account is locked for 15 minutes.
There is also a "Forgot Password" link and a "Remember me" checkbox.`,

  cart: `As a shopper I want to add items to my shopping cart and proceed to checkout so that I can purchase products.
The cart displays item name, quantity, unit price, and subtotal. Users can update quantity or remove items.
At checkout the user enters a shipping address and selects a payment method (credit card or PayPal).
Applying a promo code gives a percentage or fixed discount. The order is confirmed by email.`,

  upload: `As a content editor I want to upload files to the media library so that I can attach them to articles.
Accepted formats: JPG, PNG, GIF, PDF, DOCX. Maximum file size is 10 MB per file and 50 MB per session.
Multiple files can be selected at once. Upload progress is shown with a progress bar.
After upload, a thumbnail preview appears. Files can be renamed or deleted.`
};

/* ── Test-case template engine ────────────────────────────
   generateTestCases() analyses the feature description and
   builds domain-aware Positive, Negative, and Edge cases.
   Each test case object has:
     id            – unique string  e.g. "TC-POS-01"
     title         – short description
     preconditions – setup required before the test
     steps         – ordered list of actions
     expected      – what success looks like
     priority      – "High" | "Medium" | "Low"
   ──────────────────────────────────────────────────────── */

/**
 * Main generation function.
 * @param {string} description - Raw feature text from the textarea.
 * @returns {{ positive: TestCase[], negative: TestCase[], edge: TestCase[] }}
 */
function generateTestCases(description) {
  const lower = description.toLowerCase();

  /* ── Detect feature domain from keywords ─────────────── */
  const isLogin    = /\b(log.?in|sign.?in|authenticat|password|credential)\b/.test(lower);
  const isRegister = /\b(register|sign.?up|creat.*account)\b/.test(lower);
  const isCart     = /\b(cart|checkout|purchase|order|payment|promo|discount)\b/.test(lower);
  const isUpload   = /\b(upload|file|attachment|image|photo|pdf|document)\b/.test(lower);
  const isSearch   = /\b(search|filter|query|find|look.?up)\b/.test(lower);
  const isProfile  = /\b(profile|account|settings|update.*user|edit.*user)\b/.test(lower);
  const isForm     = /\b(form|submit|field|input|valid)\b/.test(lower);

  /* ── Pick the most relevant template set ─────────────── */
  if (isLogin)    return buildLoginCases(description);
  if (isCart)     return buildCartCases(description);
  if (isUpload)   return buildUploadCases(description);
  if (isRegister) return buildRegisterCases(description);
  if (isSearch)   return buildSearchCases(description);
  if (isProfile)  return buildProfileCases(description);
  /* Default: treat it as a generic form / feature */
  return buildGenericCases(description);
}

/* ── Shared helpers ───────────────────────────────────────── */

/**
 * Creates a test-case object with a consistent shape.
 * @param {string} prefix   - "POS" | "NEG" | "EDG"
 * @param {number} index    - 1-based sequence number
 * @param {object} fields   - title, preconditions, steps[], expected, priority
 */
function tc(prefix, index, fields) {
  const pad = String(index).padStart(2, '0');
  return {
    id:            `TC-${prefix}-${pad}`,
    title:         fields.title,
    preconditions: fields.preconditions,
    steps:         fields.steps,      // string[]
    expected:      fields.expected,
    priority:      fields.priority    // "High" | "Medium" | "Low"
  };
}

/* ── Login test cases ─────────────────────────────────────── */
function buildLoginCases(desc) {
  const hasLockout     = /lock|attempt|limit/.test(desc.toLowerCase());
  const hasRememberMe  = /remember/.test(desc.toLowerCase());
  const hasForgotPwd   = /forgot|reset/.test(desc.toLowerCase());

  const positive = [
    tc('POS', 1, {
      title:         'Successful login with valid credentials',
      preconditions: 'A registered user account exists with known email and password.',
      steps: [
        'Navigate to the login page.',
        'Enter a valid registered email address.',
        'Enter the correct password.',
        'Click the "Log In" button.'
      ],
      expected:  'User is redirected to the dashboard. A welcome message is displayed.',
      priority:  'High'
    }),
    tc('POS', 2, {
      title:         'Login is case-insensitive for email',
      preconditions: 'Registered user account exists.',
      steps: [
        'Navigate to the login page.',
        'Enter the email address in uppercase (e.g. USER@EXAMPLE.COM).',
        'Enter the correct password.',
        'Click "Log In".'
      ],
      expected:  'Login succeeds; user is taken to the dashboard.',
      priority:  'Medium'
    })
  ];

  if (hasRememberMe) {
    positive.push(tc('POS', 3, {
      title:         '"Remember me" keeps session across browser restart',
      preconditions: 'A registered user account exists.',
      steps: [
        'Navigate to the login page.',
        'Enter valid email and password.',
        'Check the "Remember me" checkbox.',
        'Click "Log In".',
        'Close the browser and reopen it, then navigate to the app.'
      ],
      expected:  'User is still logged in without being prompted for credentials.',
      priority:  'Medium'
    }));
  }

  const negative = [
    tc('NEG', 1, {
      title:         'Login fails with incorrect password',
      preconditions: 'A registered user account exists.',
      steps: [
        'Navigate to the login page.',
        'Enter a valid email address.',
        'Enter an incorrect password.',
        'Click "Log In".'
      ],
      expected:  'An error message is displayed: "Invalid email or password." No redirect occurs.',
      priority:  'High'
    }),
    tc('NEG', 2, {
      title:         'Login fails with unregistered email',
      preconditions: 'No account exists for the email being used.',
      steps: [
        'Navigate to the login page.',
        'Enter an email address that has not been registered.',
        'Enter any password.',
        'Click "Log In".'
      ],
      expected:  'Error message is shown. The system does not reveal whether the email is registered.',
      priority:  'High'
    }),
    tc('NEG', 3, {
      title:         'Login form submission blocked when fields are empty',
      preconditions: 'User is on the login page.',
      steps: [
        'Leave the email field blank.',
        'Leave the password field blank.',
        'Click "Log In".'
      ],
      expected:  'Inline validation errors appear on both fields. The form is not submitted.',
      priority:  'High'
    }),
    tc('NEG', 4, {
      title:         'Login fails with invalid email format',
      preconditions: 'User is on the login page.',
      steps: [
        'Enter a malformed email (e.g. "notanemail").',
        'Enter any password.',
        'Click "Log In".'
      ],
      expected:  'Email field shows a format-validation error. Form is not submitted.',
      priority:  'Medium'
    })
  ];

  if (hasLockout) {
    negative.push(tc('NEG', 5, {
      title:         'Account locks after repeated failed attempts',
      preconditions: 'A registered user account exists.',
      steps: [
        'Navigate to the login page.',
        'Enter the correct email but a wrong password.',
        'Repeat step 2 five times in succession.',
        'Attempt to log in again with the correct password.'
      ],
      expected:  'Account is locked. A message informs the user of the lockout duration.',
      priority:  'High'
    }));
  }

  const edge = [
    tc('EDG', 1, {
      title:         'Password at minimum length boundary',
      preconditions: 'Registered user with a password exactly at the minimum length requirement.',
      steps: [
        'Navigate to the login page.',
        'Enter the registered email.',
        'Enter a password that is exactly the minimum allowed length.',
        'Click "Log In".'
      ],
      expected:  'Login succeeds without validation error.',
      priority:  'Medium'
    }),
    tc('EDG', 2, {
      title:         'Login page is accessible with JavaScript disabled',
      preconditions: 'Browser has JavaScript disabled.',
      steps: [
        'Open the login page with JS disabled.',
        'Observe whether the form and basic structure render.'
      ],
      expected:  'Page displays a usable form or a graceful fallback message.',
      priority:  'Low'
    }),
    tc('EDG', 3, {
      title:         'XSS attempt in the email field is sanitised',
      preconditions: 'User is on the login page.',
      steps: [
        'Enter <script>alert("xss")</script> in the email field.',
        'Enter any value in the password field.',
        'Click "Log In".'
      ],
      expected:  'Input is treated as plain text. No script executes. Appropriate error is shown.',
      priority:  'High'
    }),
    tc('EDG', 4, {
      title:         'Login with email containing special characters',
      preconditions: 'A registered account with a valid RFC 5321 special-character email exists.',
      steps: [
        'Navigate to the login page.',
        'Enter an email with allowed special characters (e.g. user+tag@example.co.uk).',
        'Enter the correct password.',
        'Click "Log In".'
      ],
      expected:  'Login succeeds. Special characters in email are handled correctly.',
      priority:  'Medium'
    })
  ];

  if (hasForgotPwd) {
    edge.push(tc('EDG', 5, {
      title:         '"Forgot Password" link is functional',
      preconditions: 'User is on the login page.',
      steps: [
        'Click the "Forgot Password" link.',
        'Enter a registered email address.',
        'Submit the form.'
      ],
      expected:  'A password-reset email is sent. Confirmation message is shown on screen.',
      priority:  'Medium'
    }));
  }

  return { positive, negative, edge };
}

/* ── Shopping cart test cases ────────────────────────────── */
function buildCartCases(desc) {
  const lower          = desc.toLowerCase();
  const hasPromo       = /promo|coupon|discount|code/.test(lower);
  const hasPayPal      = /paypal/.test(lower);

  const positive = [
    tc('POS', 1, {
      title:         'Add an item to the cart',
      preconditions: 'User is logged in. At least one product is available for purchase.',
      steps: [
        'Navigate to a product listing page.',
        'Click "Add to Cart" on a product.',
        'View the cart.'
      ],
      expected:  'Product appears in the cart with correct name, quantity 1, and unit price.',
      priority:  'High'
    }),
    tc('POS', 2, {
      title:         'Cart total updates correctly when quantity changes',
      preconditions: 'Cart contains at least one item.',
      steps: [
        'Open the cart.',
        'Increase the quantity of an item from 1 to 3.',
        'Observe the subtotal and cart total.'
      ],
      expected:  'Subtotal = unit price × 3. Grand total reflects the updated amount.',
      priority:  'High'
    }),
    tc('POS', 3, {
      title:         'Checkout completes successfully with valid payment details',
      preconditions: 'Cart has items. User has a valid shipping address and payment method.',
      steps: [
        'Proceed to checkout.',
        'Enter a valid shipping address.',
        'Select a payment method and enter valid card details.',
        'Click "Place Order".'
      ],
      expected:  'Order confirmation page is shown with order ID. Confirmation email is sent.',
      priority:  'High'
    })
  ];

  if (hasPromo) {
    positive.push(tc('POS', 4, {
      title:         'Valid promo code applies correct discount',
      preconditions: 'Cart has items. A valid promo code exists.',
      steps: [
        'Open the cart or checkout page.',
        'Enter a valid promo code in the discount field.',
        'Click "Apply".'
      ],
      expected:  'Discount is applied. Updated total is displayed with the savings itemised.',
      priority:  'Medium'
    }));
  }

  const negative = [
    tc('NEG', 1, {
      title:         'Cannot proceed to checkout with an empty cart',
      preconditions: 'User is logged in with an empty cart.',
      steps: [
        'Navigate to the cart page.',
        'Click "Proceed to Checkout".'
      ],
      expected:  'Checkout button is disabled or an error message states the cart is empty.',
      priority:  'High'
    }),
    tc('NEG', 2, {
      title:         'Checkout fails with invalid card number',
      preconditions: 'Cart has items. User is on the payment step.',
      steps: [
        'Enter an invalid card number (e.g. 1234 5678 9012 3456).',
        'Fill in all other fields correctly.',
        'Click "Place Order".'
      ],
      expected:  'Payment is rejected. An appropriate error message is shown. Order is not placed.',
      priority:  'High'
    }),
    tc('NEG', 3, {
      title:         'Removing the only item empties the cart',
      preconditions: 'Cart contains exactly one item.',
      steps: [
        'Open the cart.',
        'Click the remove/delete button for the item.'
      ],
      expected:  'Cart is now empty. An "Your cart is empty" message or illustration is shown.',
      priority:  'Medium'
    }),
    tc('NEG', 4, {
      title:         'Invalid promo code shows error',
      preconditions: 'Cart has items.',
      steps: [
        'Enter an expired or non-existent promo code.',
        'Click "Apply".'
      ],
      expected:  'An inline error message states the promo code is invalid or expired.',
      priority:  'Medium'
    })
  ];

  const edge = [
    tc('EDG', 1, {
      title:         'Adding same item multiple times consolidates quantity',
      preconditions: 'Cart is empty. A product is available.',
      steps: [
        'Add the same product to the cart three separate times.',
        'View the cart.'
      ],
      expected:  'A single line item appears with quantity 3, not three separate entries.',
      priority:  'Medium'
    }),
    tc('EDG', 2, {
      title:         'Cart persists after browser refresh',
      preconditions: 'Cart contains items.',
      steps: [
        'Add items to the cart.',
        'Refresh the browser page.'
      ],
      expected:  'Cart contents are retained after the refresh.',
      priority:  'Medium'
    }),
    tc('EDG', 3, {
      title:         'Quantity cannot be set below 1',
      preconditions: 'Cart has an item with quantity 1.',
      steps: [
        'Attempt to decrease the quantity below 1 using the minus/decrement control.'
      ],
      expected:  'Quantity stays at 1 or a prompt asks if the user wants to remove the item.',
      priority:  'Low'
    }),
    tc('EDG', 4, {
      title:         'Checkout with maximum allowed quantity per item',
      preconditions: 'A product has a per-order maximum quantity limit.',
      steps: [
        'Add the maximum allowed quantity of an item.',
        'Attempt to add one more.',
        'Proceed to checkout.'
      ],
      expected:  'System enforces the limit. User is notified. Checkout proceeds with capped quantity.',
      priority:  'Medium'
    })
  ];

  return { positive, negative, edge };
}

/* ── File upload test cases ───────────────────────────────── */
function buildUploadCases(desc) {
  const lower       = desc.toLowerCase();
  const hasMultiple = /multiple|batch|several/.test(lower);
  const hasPreview  = /preview|thumbnail/.test(lower);

  const positive = [
    tc('POS', 1, {
      title:         'Upload a valid supported file successfully',
      preconditions: 'User is logged in with upload permission. A valid file (within size/type limits) is ready.',
      steps: [
        'Navigate to the upload section.',
        'Click "Choose File" or drag a valid file onto the drop zone.',
        'Confirm the upload.'
      ],
      expected:  'File uploads successfully. A success message and file entry appear in the library.',
      priority:  'High'
    }),
    tc('POS', 2, {
      title:         'Upload progress bar displays accurately',
      preconditions: 'Valid file is selected for upload.',
      steps: [
        'Select a large valid file.',
        'Observe the progress bar during upload.'
      ],
      expected:  'Progress bar increments from 0% to 100%. On completion it disappears or shows "Done".',
      priority:  'Medium'
    })
  ];

  if (hasMultiple) {
    positive.push(tc('POS', 3, {
      title:         'Multiple files upload in a single session',
      preconditions: 'Multiple valid files are ready, total size within session limit.',
      steps: [
        'Select multiple valid files at once.',
        'Confirm the upload.'
      ],
      expected:  'All selected files upload successfully. Each file appears in the library.',
      priority:  'High'
    }));
  }

  if (hasPreview) {
    positive.push(tc('POS', 4, {
      title:         'Thumbnail preview appears after successful image upload',
      preconditions: 'A valid image file (JPG/PNG) is ready.',
      steps: [
        'Upload a valid image file.',
        'Observe the media library entry.'
      ],
      expected:  'A thumbnail preview of the uploaded image is displayed in the library.',
      priority:  'Medium'
    }));
  }

  const negative = [
    tc('NEG', 1, {
      title:         'Upload rejected when file exceeds maximum size',
      preconditions: 'User is on the upload page.',
      steps: [
        'Select a file that exceeds the maximum allowed size.',
        'Attempt to upload it.'
      ],
      expected:  'Upload is blocked before transfer. An error message states the file size limit.',
      priority:  'High'
    }),
    tc('NEG', 2, {
      title:         'Upload rejected for unsupported file type',
      preconditions: 'User is on the upload page.',
      steps: [
        'Select a file with a disallowed extension (e.g. .exe or .zip).',
        'Attempt to upload it.'
      ],
      expected:  'File is rejected. Error message lists the accepted formats.',
      priority:  'High'
    }),
    tc('NEG', 3, {
      title:         'Upload fails gracefully on network interruption',
      preconditions: 'File upload is in progress.',
      steps: [
        'Begin uploading a large valid file.',
        'Disconnect from the network mid-upload.'
      ],
      expected:  'Upload fails with a user-friendly error. Option to retry is provided.',
      priority:  'Medium'
    })
  ];

  const edge = [
    tc('EDG', 1, {
      title:         'Upload a file with a filename containing special characters',
      preconditions: 'A valid file with a filename such as "résumé (final) #3.pdf" is ready.',
      steps: [
        'Select the file with special characters in its name.',
        'Upload it.'
      ],
      expected:  'File uploads successfully. Filename is displayed correctly or sanitised gracefully.',
      priority:  'Medium'
    }),
    tc('EDG', 2, {
      title:         'Upload a zero-byte (empty) file',
      preconditions: 'A valid file type but with 0 bytes is available.',
      steps: [
        'Attempt to upload the empty file.'
      ],
      expected:  'Upload is blocked or a warning is shown indicating the file is empty.',
      priority:  'Medium'
    }),
    tc('EDG', 3, {
      title:         'File at exactly the maximum size boundary is accepted',
      preconditions: 'A file whose size is exactly the maximum allowed limit is available.',
      steps: [
        'Select the boundary-size file.',
        'Upload it.'
      ],
      expected:  'File uploads successfully. No size-exceeded error is shown.',
      priority:  'Medium'
    }),
    tc('EDG', 4, {
      title:         'Duplicate filename handling',
      preconditions: 'A file with the same name already exists in the library.',
      steps: [
        'Upload a new file with the same name as an existing one.'
      ],
      expected:  'System either renames the new file, prompts the user, or replaces the old one — behaviour is documented.',
      priority:  'Low'
    })
  ];

  return { positive, negative, edge };
}

/* ── Registration test cases ─────────────────────────────── */
function buildRegisterCases(desc) {
  const positive = [
    tc('POS', 1, {
      title:         'Successful account registration with all valid data',
      preconditions: 'Registration page is accessible. Email address is not already registered.',
      steps: [
        'Navigate to the registration page.',
        'Fill in all required fields with valid data.',
        'Click "Register" / "Sign Up".'
      ],
      expected:  'Account is created. User is redirected or shown a success message. Confirmation email is sent.',
      priority:  'High'
    }),
    tc('POS', 2, {
      title:         'Password strength indicator updates in real time',
      preconditions: 'User is on the registration page.',
      steps: [
        'Start typing a password in the password field.',
        'Observe the strength indicator as more characters are added.'
      ],
      expected:  'Indicator accurately reflects weak/medium/strong state as password evolves.',
      priority:  'Low'
    })
  ];

  const negative = [
    tc('NEG', 1, {
      title:         'Registration blocked with already-registered email',
      preconditions: 'An account already exists with a given email.',
      steps: [
        'Attempt to register with the already-registered email.',
        'Complete all other fields.',
        'Submit the form.'
      ],
      expected:  'Error message indicates the email is already in use. No duplicate account is created.',
      priority:  'High'
    }),
    tc('NEG', 2, {
      title:         'Registration fails when passwords do not match',
      preconditions: 'User is on the registration page.',
      steps: [
        'Enter a password in the password field.',
        'Enter a different value in the confirm-password field.',
        'Submit the form.'
      ],
      expected:  'Validation error shown on the confirm-password field. Form is not submitted.',
      priority:  'High'
    }),
    tc('NEG', 3, {
      title:         'Required fields cannot be left blank',
      preconditions: 'User is on the registration page.',
      steps: [
        'Submit the form without filling in any fields.'
      ],
      expected:  'Each required field shows an inline validation error. Form is not submitted.',
      priority:  'High'
    })
  ];

  const edge = [
    tc('EDG', 1, {
      title:         'Username at maximum allowed character length',
      preconditions: 'User is on the registration page.',
      steps: [
        'Enter a username with exactly the maximum allowed number of characters.',
        'Complete remaining fields and submit.'
      ],
      expected:  'Registration succeeds without a length-validation error.',
      priority:  'Medium'
    }),
    tc('EDG', 2, {
      title:         'Registration with an international/unicode name',
      preconditions: 'User is on the registration page.',
      steps: [
        'Enter a name containing non-ASCII characters (e.g. "张伟" or "Ünlü").',
        'Complete other fields and submit.'
      ],
      expected:  'Name is stored and displayed correctly throughout the application.',
      priority:  'Medium'
    }),
    tc('EDG', 3, {
      title:         'Submitting the form twice in quick succession',
      preconditions: 'All fields are valid.',
      steps: [
        'Fill in all registration fields.',
        'Double-click the "Register" button rapidly.'
      ],
      expected:  'Only one account is created. Duplicate submission is prevented.',
      priority:  'Medium'
    })
  ];

  return { positive, negative, edge };
}

/* ── Search / filter test cases ──────────────────────────── */
function buildSearchCases(desc) {
  const positive = [
    tc('POS', 1, {
      title:         'Search returns relevant results for a valid keyword',
      preconditions: 'The data set contains at least one item matching the keyword.',
      steps: [
        'Navigate to the search page.',
        'Enter a keyword known to match existing items.',
        'Submit the search.'
      ],
      expected:  'Results list displays relevant items. Keyword is highlighted in results.',
      priority:  'High'
    }),
    tc('POS', 2, {
      title:         'Filters narrow down search results correctly',
      preconditions: 'Search results are displayed.',
      steps: [
        'Apply one or more filter options.',
        'Observe the updated results.'
      ],
      expected:  'Results update to show only items matching the applied filters.',
      priority:  'High'
    })
  ];

  const negative = [
    tc('NEG', 1, {
      title:         'Search with no matching keyword returns empty state',
      preconditions: 'Search feature is accessible.',
      steps: [
        'Enter a keyword that matches no items (e.g. "xyzabc123").',
        'Submit the search.'
      ],
      expected:  '"No results found" message is displayed. Suggestions or alternative actions may appear.',
      priority:  'Medium'
    }),
    tc('NEG', 2, {
      title:         'Search blocked when query field is empty',
      preconditions: 'User is on the search page.',
      steps: [
        'Leave the search field blank.',
        'Submit the search.'
      ],
      expected:  'Search is not performed, or all results are returned with an explanatory message.',
      priority:  'Low'
    })
  ];

  const edge = [
    tc('EDG', 1, {
      title:         'Search with SQL injection attempt is handled safely',
      preconditions: 'Search feature is accessible.',
      steps: [
        'Enter \' OR 1=1-- in the search field.',
        'Submit the search.'
      ],
      expected:  'Input is treated as a literal string. No data is leaked or corrupted.',
      priority:  'High'
    }),
    tc('EDG', 2, {
      title:         'Search with very long query string',
      preconditions: 'Search feature is accessible.',
      steps: [
        'Enter a query string of 500+ characters.',
        'Submit the search.'
      ],
      expected:  'Input is truncated or an error is shown. Application does not crash.',
      priority:  'Medium'
    }),
    tc('EDG', 3, {
      title:         'Search is case-insensitive',
      preconditions: 'Items matching a keyword exist.',
      steps: [
        'Search using the keyword in all lowercase.',
        'Search again using the keyword in all uppercase.'
      ],
      expected:  'Both queries return the same set of results.',
      priority:  'Medium'
    })
  ];

  return { positive, negative, edge };
}

/* ── Profile / settings test cases ───────────────────────── */
function buildProfileCases(desc) {
  const positive = [
    tc('POS', 1, {
      title:         'User can update their display name successfully',
      preconditions: 'User is logged in and on the profile settings page.',
      steps: [
        'Change the display name field to a new valid value.',
        'Click "Save Changes".'
      ],
      expected:  'Updated name is persisted and reflected immediately across the app.',
      priority:  'High'
    }),
    tc('POS', 2, {
      title:         'User can change their email address',
      preconditions: 'User is authenticated. New email address is not already registered.',
      steps: [
        'Navigate to account settings.',
        'Enter a new valid email address.',
        'Confirm the change (e.g. enter current password).',
        'Save.'
      ],
      expected:  'Email is updated. A confirmation or verification email may be sent to the new address.',
      priority:  'High'
    })
  ];

  const negative = [
    tc('NEG', 1, {
      title:         'Profile save fails when required fields are cleared',
      preconditions: 'User is on the profile settings page.',
      steps: [
        'Clear a required field (e.g. display name).',
        'Click "Save Changes".'
      ],
      expected:  'Validation error is shown. Changes are not saved.',
      priority:  'High'
    }),
    tc('NEG', 2, {
      title:         'Cannot change email to one already in use',
      preconditions: 'Another account already uses the target email.',
      steps: [
        'Enter an email already associated with another account.',
        'Save changes.'
      ],
      expected:  'Error message indicates the email is already taken.',
      priority:  'High'
    })
  ];

  const edge = [
    tc('EDG', 1, {
      title:         'Profile photo upload with a very large image',
      preconditions: 'User is on the profile settings page.',
      steps: [
        'Attempt to upload an image file larger than the allowed maximum.',
      ],
      expected:  'Upload is blocked with a descriptive error message.',
      priority:  'Medium'
    }),
    tc('EDG', 2, {
      title:         'Concurrent profile updates from two browser sessions',
      preconditions: 'User is logged in on two browser tabs simultaneously.',
      steps: [
        'Edit the display name in Tab 1 and save.',
        'Immediately edit the display name in Tab 2 and save.'
      ],
      expected:  'Last write wins or a conflict message is shown. Data is not corrupted.',
      priority:  'Low'
    })
  ];

  return { positive, negative, edge };
}

/* ── Generic feature test cases ─────────────────────────── */
function buildGenericCases(desc) {
  /* Extract quoted strings or capitalised nouns as feature hints */
  const quotedTerms  = (desc.match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, ''));
  const featureHint  = quotedTerms[0] || 'the feature';

  const positive = [
    tc('POS', 1, {
      title:         `Happy path: ${featureHint} completes successfully with valid input`,
      preconditions: 'System is in a ready state. All required pre-conditions are met.',
      steps: [
        'Navigate to the relevant page or screen.',
        'Provide all required inputs with valid data.',
        'Submit or trigger the action.'
      ],
      expected:  'The action completes successfully. A confirmation or success state is shown.',
      priority:  'High'
    }),
    tc('POS', 2, {
      title:         'All mandatory fields accept their maximum allowed valid input',
      preconditions: 'Feature is accessible.',
      steps: [
        'Fill each required field with a value at the upper boundary of what is valid.',
        'Submit the form or action.'
      ],
      expected:  'Submission succeeds. No validation errors are triggered.',
      priority:  'Medium'
    }),
    tc('POS', 3, {
      title:         'Success state is clearly communicated to the user',
      preconditions: 'Valid data is provided.',
      steps: [
        'Complete the main action successfully.',
        'Observe the UI feedback.'
      ],
      expected:  'A success message, notification, or state change confirms the action was completed.',
      priority:  'Medium'
    })
  ];

  const negative = [
    tc('NEG', 1, {
      title:         'Submission blocked when required fields are empty',
      preconditions: 'Feature form or action is accessible.',
      steps: [
        'Leave all required fields empty.',
        'Attempt to submit.'
      ],
      expected:  'Validation errors appear for each required field. Submission does not proceed.',
      priority:  'High'
    }),
    tc('NEG', 2, {
      title:         'Invalid data format is rejected with a helpful error',
      preconditions: 'Feature form is accessible.',
      steps: [
        'Enter data in an incorrect format (e.g. text in a numeric field, wrong date format).',
        'Submit.'
      ],
      expected:  'The specific field shows a format validation error. Submission is blocked.',
      priority:  'High'
    }),
    tc('NEG', 3, {
      title:         'Unauthorised access is blocked',
      preconditions: 'User does not have permission to access this feature.',
      steps: [
        'Attempt to access the feature without the required role or authentication.'
      ],
      expected:  'Access is denied. User is redirected to login or shown a "403 Forbidden" message.',
      priority:  'High'
    }),
    tc('NEG', 4, {
      title:         'System handles server error gracefully',
      preconditions: 'Feature is in use and the server returns a 500 error.',
      steps: [
        'Trigger the action while the server is returning errors.',
        'Observe the UI response.'
      ],
      expected:  'A user-friendly error message is shown. No technical stack trace is exposed.',
      priority:  'Medium'
    })
  ];

  const edge = [
    tc('EDG', 1, {
      title:         'Input at exact minimum allowed length is accepted',
      preconditions: 'Feature form is accessible.',
      steps: [
        'Enter input with exactly the minimum number of characters/values allowed.',
        'Submit.'
      ],
      expected:  'Submission succeeds. No minimum-length validation error is shown.',
      priority:  'Medium'
    }),
    tc('EDG', 2, {
      title:         'Input exceeding maximum allowed length is rejected',
      preconditions: 'Feature form is accessible.',
      steps: [
        'Enter input that exceeds the maximum allowed length by at least one character.',
        'Submit.'
      ],
      expected:  'Validation error indicates the maximum length. Submission is blocked.',
      priority:  'Medium'
    }),
    tc('EDG', 3, {
      title:         'Special characters and unicode are handled correctly',
      preconditions: 'Feature form is accessible.',
      steps: [
        'Enter data containing special characters (e.g. <, >, &, %, unicode emoji).',
        'Submit.'
      ],
      expected:  'Data is stored and displayed correctly. No injection occurs. No crashes.',
      priority:  'Medium'
    }),
    tc('EDG', 4, {
      title:         'Action is idempotent — submitting twice does not duplicate data',
      preconditions: 'All fields are valid.',
      steps: [
        'Submit the form.',
        'Immediately submit again (e.g. double-click, back + resubmit).'
      ],
      expected:  'Only one record is created or one action performed. Duplicates are prevented.',
      priority:  'Medium'
    })
  ];

  return { positive, negative, edge };
}

/* ── Rendering ────────────────────────────────────────────
   Converts generated test cases into accessible HTML cards.
   ──────────────────────────────────────────────────────── */

/** Group configuration: key → display name + badge modifier */
const GROUPS = [
  { key: 'positive', label: 'Positive',   mod: 'positive', description: 'Valid inputs and expected happy-path flows.' },
  { key: 'negative', label: 'Negative',   mod: 'negative', description: 'Invalid inputs and error scenarios.'         },
  { key: 'edge',     label: 'Edge Case',  mod: 'edge',     description: 'Boundary conditions and unusual scenarios.'  }
];

/**
 * Renders all test-case groups into #results-container.
 * @param {{ positive: TestCase[], negative: TestCase[], edge: TestCase[] }} groups
 */
function renderResults(groups) {
  resultsContainer.innerHTML = '';

  let totalCount = 0;

  GROUPS.forEach(({ key, label, mod, description }) => {
    const cases = groups[key];
    if (!cases || cases.length === 0) return;

    totalCount += cases.length;

    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';
    groupCard.setAttribute('aria-label', `${label} test cases`);

    /* Group header */
    groupCard.innerHTML = `
      <div class="group-header">
        <span class="group-badge group-badge--${mod}" aria-label="${label} category">${label}</span>
        <span class="group-title">${label} Scenarios</span>
        <span class="group-count" aria-label="${cases.length} test cases">${cases.length} test case${cases.length > 1 ? 's' : ''}</span>
      </div>
    `;

    /* Test-case list */
    const tcList = document.createElement('ul');
    tcList.className = 'tc-list';
    tcList.setAttribute('aria-label', `${label} test case list`);

    cases.forEach(testCase => {
      const li = document.createElement('li');
      li.className = 'tc-item';

      /* Build ordered steps HTML */
      const stepsHtml = `<ol>${testCase.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`;

      /* Priority badge CSS modifier */
      const priorityMod = testCase.priority.toLowerCase();

      li.innerHTML = `
        <div class="tc-meta">
          <span class="tc-id" aria-label="Test ID">${escapeHtml(testCase.id)}</span>
          <span class="tc-title">${escapeHtml(testCase.title)}</span>
          <span class="priority-badge priority-badge--${priorityMod}" aria-label="Priority: ${testCase.priority}">${escapeHtml(testCase.priority)}</span>
        </div>
        <div class="tc-body">
          <div class="tc-field">
            <span class="tc-field-label">Preconditions</span>
            <span class="tc-field-value">${escapeHtml(testCase.preconditions)}</span>
          </div>
          <div class="tc-field">
            <span class="tc-field-label">Expected Result</span>
            <span class="tc-field-value">${escapeHtml(testCase.expected)}</span>
          </div>
          <div class="tc-field tc-field--full">
            <span class="tc-field-label">Test Steps</span>
            <div class="tc-field-value">${stepsHtml}</div>
          </div>
        </div>
      `;

      tcList.appendChild(li);
    });

    groupCard.appendChild(tcList);
    resultsContainer.appendChild(groupCard);
  });

  /* Update summary counts */
  const pos = groups.positive.length;
  const neg = groups.negative.length;
  const edg = groups.edge.length;
  summaryCountsEl.innerHTML =
    `<strong>${totalCount}</strong> test cases generated &mdash; ` +
    `<strong>${pos}</strong> positive, <strong>${neg}</strong> negative, <strong>${edg}</strong> edge`;
}

/**
 * Escapes HTML special characters to prevent XSS when inserting
 * user-derived text via innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Input validation ─────────────────────────────────────── */

/**
 * Validates the feature input textarea.
 * Shows an error message and marks the field invalid when needed.
 * @returns {boolean} true if input is valid.
 */
function validateInput() {
  const value = featureInput.value.trim();

  /* Clear previous error state */
  featureInput.classList.remove('is-invalid');
  inputError.hidden = true;
  inputError.textContent = '';

  if (value.length === 0) {
    showInputError('Please describe a feature or user story before generating test cases.');
    return false;
  }

  if (value.length < MIN_INPUT_LENGTH) {
    showInputError(
      `Your description is too short (${value.length} characters). ` +
      `Please provide at least ${MIN_INPUT_LENGTH} characters for meaningful test cases.`
    );
    return false;
  }

  return true;
}

/**
 * Displays a validation error message on the textarea.
 * @param {string} message
 */
function showInputError(message) {
  featureInput.classList.add('is-invalid');
  inputError.textContent = message;
  inputError.hidden = false;
  featureInput.focus();
}

/* ── Copy as plain-text table ─────────────────────────────── */

/**
 * Collects all rendered test cases and formats them as a plain-text
 * Markdown-style pipe table, then copies it to the clipboard.
 */
function copyAsTable() {
  const rows = collectAllTestCases();
  if (rows.length === 0) return;

  const header = '| ID | Group | Title | Priority | Preconditions | Steps | Expected Result |';
  const divider = '|---|---|---|---|---|---|---|';
  const lines = rows.map(r =>
    `| ${r.id} | ${r.group} | ${r.title} | ${r.priority} | ${r.preconditions} | ${r.steps.join(' → ')} | ${r.expected} |`
  );

  const tableText = [header, divider, ...lines].join('\n');

  navigator.clipboard.writeText(tableText).then(() => {
    showToast('Table copied to clipboard!');
  }).catch(() => {
    /* Fallback for environments where clipboard API is unavailable */
    fallbackCopy(tableText);
    showToast('Table copied to clipboard!');
  });
}

/* ── Download CSV ─────────────────────────────────────────── */

/**
 * Collects all test cases and triggers a CSV file download.
 */
function downloadCSV() {
  const rows = collectAllTestCases();
  if (rows.length === 0) return;

  const headers = ['ID', 'Group', 'Title', 'Priority', 'Preconditions', 'Steps', 'Expected Result'];
  const csvLines = [
    headers.map(csvCell).join(','),
    ...rows.map(r => [
      r.id,
      r.group,
      r.title,
      r.priority,
      r.preconditions,
      r.steps.join(' → '),
      r.expected
    ].map(csvCell).join(','))
  ];

  const csvContent  = csvLines.join('\r\n');
  const blob        = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url         = URL.createObjectURL(blob);
  const link        = document.createElement('a');
  const timestamp   = new Date().toISOString().slice(0, 10);

  link.href         = url;
  link.download     = `testcraft-cases-${timestamp}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('CSV downloaded!');
}

/**
 * Wraps a cell value for RFC 4180 CSV: quotes it and escapes inner quotes.
 * @param {string|number} value
 * @returns {string}
 */
function csvCell(value) {
  const str = String(value == null ? '' : value);
  /* Wrap in double-quotes; escape existing double-quotes by doubling */
  return `"${str.replace(/"/g, '""')}"`;
}

/* ── Shared data collector ────────────────────────────────── */

/**
 * Reads the in-memory test cases stored on the module-level variable
 * (set each time generateTestCases is called).
 * @returns {Array<{id,group,title,priority,preconditions,steps,expected}>}
 */
function collectAllTestCases() {
  if (!currentTestCases) return [];

  const result = [];
  GROUPS.forEach(({ key, label }) => {
    (currentTestCases[key] || []).forEach(tc => {
      result.push({ ...tc, group: label });
    });
  });
  return result;
}

/* ── Module-level state ───────────────────────────────────── */

/** Holds the last generated set of test cases for export functions. */
let currentTestCases = null;

/* ── Toast helper ─────────────────────────────────────────── */

/** @type {number|null} Timer ID for clearing active toast */
let toastTimer = null;

/**
 * Shows a brief toast notification at the bottom-right of the screen.
 * @param {string} message
 * @param {number} [duration=2800] - Milliseconds before toast hides.
 */
function showToast(message, duration) {
  duration = duration || 2800;

  /* Reuse or create the toast element */
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  /* Clear any running timer so rapid calls reset the timeout */
  if (toastTimer !== null) {
    clearTimeout(toastTimer);
  }

  toast.textContent = message;
  toast.classList.add('show');

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toastTimer = null;
  }, duration);
}

/* ── Clipboard fallback (non-secure contexts) ─────────────── */

/**
 * Creates a temporary textarea to copy text in environments where
 * navigator.clipboard is unavailable (e.g. HTTP, older browsers).
 * @param {string} text
 */
function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

/* ── Event listeners ──────────────────────────────────────── */

/* Generate button */
generateBtn.addEventListener('click', function () {
  if (!validateInput()) return;

  const description = featureInput.value.trim();

  /* Disable button during "generation" to prevent double-submit */
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating…';

  /*
   * A short async delay gives the browser time to repaint the button
   * state before the synchronous generation work begins.
   */
  setTimeout(function () {
    currentTestCases = generateTestCases(description);

    renderResults(currentTestCases);

    /* Show the output section */
    outputSection.hidden = false;
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* Re-enable button */
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Test Cases';
  }, 120);
});

/* Clear error when user starts typing again */
featureInput.addEventListener('input', function () {
  if (featureInput.classList.contains('is-invalid')) {
    featureInput.classList.remove('is-invalid');
    inputError.hidden = true;
    inputError.textContent = '';
  }
});

/* Example quick-fill buttons */
exampleBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    const key = btn.getAttribute('data-example');
    if (EXAMPLES[key]) {
      featureInput.value = EXAMPLES[key];
      featureInput.focus();

      /* Clear any validation state left from a prior submission */
      featureInput.classList.remove('is-invalid');
      inputError.hidden = true;
    }
  });
});

/* Copy and download action buttons */
copyBtn.addEventListener('click', copyAsTable);
downloadBtn.addEventListener('click', downloadCSV);
