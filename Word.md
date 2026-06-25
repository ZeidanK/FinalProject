Here is the task list ordered from easy → hard, with the very easy tasks that do not need an AI agent in the first group.

<!-- 1. Very easy tasks — no AI agent needed -->


These are mostly UI cleanup, text/display changes, or small frontend fixes.
<!-- 1.	Remove the app name from the navbar and keep only the logo -->
<!-- 2.	Remove the name of the user from the navbar -->
<!-- 3.	Dashboard page: remove the role -->
<!-- 4.	Dashboard page: remove the workspace active button -->
<!-- 5.	Anomalies UI: remove unnecessary scrollbar -->
<!-- 6.	Invoices: change date format from mm/dd/yyyy to dd/mm/yyyy -->
<!-- 7.	Register page: delete the option for both account types -->
<!-- 8.	Add a list of test users and passwords for testing – on accounts.md -->
<!-- 9.	Working with on my workspace: remove the full icon -->
10.	Code cleanup: delete extra functions and unused files
<!-- 2. Easy tasks -->
<!-- These are still simple, but they need checking data/state or touching both UI and logic. -->
<!-- 11.	Accountant active user should show in the header saying "Working With: 'user name'" -->
12.	Profile page: password view shows hashed password — fix so hashed password is never shown
<!-- 14.	Find an accountant: user should be able to remove the accountant -->
<!-- 15.	Working with on my workspace: add option to remove users -->
<!-- 16.	When accountant changes profile to private, it should still show the user they are working with them as long as they do not cancel -->

<!-- 3. Medium tasks -->

<!-- These need backend logic, database updates, or careful flow handling. -->

13.	Matching page: non-payment plan showing up in the two menus

17.	Login has no validation for email or phone
18.	Consider adding Google login
<!-- 19.	Profile page for business owner: adding a new company — review required data and improve UI -->
<!-- 20.	Delete account should be added to the profile page -->
20. reactaviate soft deleted accounts when the user logs in.
<!-- 21.	When uploading an invoice and the user deletes it, the file should be removed from the server -->
<!-- 22.	Anomalies: detect duplicate Excel files -->
<!-- 23.	Anomalies: group duplicate receipts together -->
<!-- 24.	Matching page: quick match currency mismatch -->
25.	Matching page: auto matching not working
<!-- 4. Hard tasks -->
<!-- These are larger features or require system-level changes. -->
<!-- 26.	Persistent storage: when uploading files and changing page, the work should keep running / stay saved -->
27.	Live notifications need improving and testing of server/client wide functions and interactions between users/ files/ database/ ai etc
28.	Reports page full implementation — currently nothing works
29.	Admin page full implementation — currently nothing works
30.	Testing the Ruppin server to see if the models will run on it
<!-- 5. Very hard / AI-heavy task -->
31.	Invoices extraction is still using API and is very slow — consider building your own AI model
This is the hardest task because it is not just a normal feature. It needs model choice, training/fine-tuning or OCR pipeline design, testing accuracy, deployment, server resources, and comparison against the current API.
A practical approach would be to keep the API for now, then test whether a local model or smaller extraction pipeline is actually faster and accurate enough.
32. almost all requests are duplicate and some are 6 times.