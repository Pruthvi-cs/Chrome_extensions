# 🧩 Chrome Extension — Project 1

A beginner-friendly Chrome Extension project created as part of a hands-on journey into **Chrome Extension development**.

This project focuses on understanding the fundamental structure of a Chrome Extension, how Chrome loads an extension, how the extension UI communicates with JavaScript, and how browser APIs can be used to interact with the current browser environment.

---

## 📌 About the Project

**Project 1** is the first step in the `Chrome_extensions` learning repository.

The purpose of this project is not to build a complex production application, but to understand the core concepts required to create Chrome Extensions.

The project provides a simple environment for learning:

- Chrome Extension structure
- `manifest.json`
- Extension popup
- HTML, CSS, and JavaScript
- Chrome Extension APIs
- Event handling
- Loading an extension locally
- Debugging an extension using Chrome DevTools

---

## 🎯 Learning Objectives

The main objectives of this project are:

1. Understand what a Chrome Extension is.
2. Learn the basic Chrome Extension folder structure.
3. Understand the role of `manifest.json`.
4. Create an extension popup.
5. Connect HTML, CSS, and JavaScript.
6. Handle user interactions.
7. Understand how Chrome provides APIs to extensions.
8. Learn how to load an unpacked extension.
9. Learn how to debug extension code.
10. Build a foundation for more advanced extensions.

---

# 🏗️ Basic Chrome Extension Architecture

A Chrome Extension can be thought of as a small web application with additional browser capabilities.

```text
                    Chrome Browser
                         │
                         ▼
                ┌─────────────────┐
                │ Chrome Extension│
                └────────┬────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          manifest      Popup     Scripts
             │           │          │
             ▼           ▼          ▼
        Configuration    UI       Logic
```

The basic relationship is:

```text
manifest.json
      │
      ├── Defines the extension
      │
      ▼
popup.html
      │
      ├── Creates the interface
      │
      ▼
style.css
      │
      ├── Controls appearance
      │
      ▼
popup.js
      │
      └── Handles behavior
```

---

# 📁 Project Structure

The project follows the typical structure of a simple Chrome Extension.

```text
project_1/
│
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
└── README.md
```

> The exact files may vary as the project evolves.

---

# 📄 `manifest.json`

`manifest.json` is one of the most important files in a Chrome Extension.

It tells Chrome:

- What the extension is called
- Which version of the manifest is being used
- What version the extension has
- Which interface should be displayed
- Which permissions the extension requires
- Which scripts belong to the extension

A simplified example looks like:

```json
{
    "manifest_version": 3,
    "name": "Project 1",
    "version": "1.0",
    "description": "My first Chrome Extension",
    "action": {
        "default_popup": "popup.html"
    }
}
```

### Why is it important?

Without `manifest.json`, Chrome does not know that the folder is a Chrome Extension.

Think of it as the **configuration file and entry point** of the extension.

---

# 🖥️ `popup.html`

`popup.html` defines the user interface displayed when the extension icon is clicked.

For example:

```text
Chrome Toolbar
      │
      ▼
[ Extension Icon ]
      │
      ▼
┌───────────────────┐
│     Extension     │
│                   │
│      Button       │
│                   │
│      Output       │
└───────────────────┘
```

HTML provides the structure of this popup.

Typical elements can include:

- Headings
- Buttons
- Input fields
- Labels
- Containers
- Result sections

---

# 🎨 `popup.css`

The CSS file controls the visual appearance of the popup.

It can be used for:

- Width and height
- Fonts
- Spacing
- Buttons
- Colors
- Borders
- Layout
- Hover effects
- Responsive behavior

The relationship is:

```text
popup.html
     │
     ▼
Structure
     │
     ▼
popup.css
     │
     ▼
Visual appearance
```

---

# ⚙️ `popup.js`

JavaScript provides the actual behavior of the extension.

It can:

- Listen for button clicks
- Read user input
- Modify HTML elements
- Perform calculations
- Communicate with Chrome APIs
- Display results
- Respond to browser events

For example:

```javascript
const button = document.getElementById("button");

button.addEventListener("click", () => {
    console.log("Button clicked!");
});
```

The basic execution flow is:

```text
User clicks button
        ↓
JavaScript event fires
        ↓
Function executes
        ↓
Application performs operation
        ↓
Result is displayed
```

---

# 🔄 How the Extension Works

The general workflow is:

```text
1. Chrome loads the extension
            │
            ▼
2. User clicks extension icon
            │
            ▼
3. Chrome opens popup.html
            │
            ▼
4. CSS styles the popup
            │
            ▼
5. JavaScript is loaded
            │
            ▼
6. User interacts with UI
            │
            ▼
7. JavaScript handles the event
            │
            ▼
8. Result is displayed
```

---

# 🌐 Chrome Extension vs Normal Website

A Chrome Extension may look like a normal website because it uses:

```text
HTML
CSS
JavaScript
```

However, an extension can also access special Chrome APIs.

### Normal website

```text
HTML
CSS
JavaScript
        │
        ▼
Web Page
```

### Chrome Extension

```text
HTML
CSS
JavaScript
        │
        ├── Chrome APIs
        ├── Browser tabs
        ├── Storage
        ├── Notifications
        └── Other extension capabilities
```

This is what makes Chrome Extensions powerful.

---

# 🧩 Manifest V3

This project is designed around the modern **Manifest V3** extension architecture.

Manifest V3 is the current architecture used for modern Chrome Extensions.

It provides a more structured and security-focused extension environment.

Some important concepts include:

- Extension actions
- Permissions
- Service workers
- Content scripts
- Extension pages
- Chrome APIs

As projects become more advanced, these concepts become increasingly important.

---

# 🔐 Permissions

Chrome Extensions use permissions to request access to browser capabilities.

For example, an extension may request access to:

```text
tabs
storage
activeTab
scripting
```

Permissions should only be requested when necessary.

A good extension follows the principle:

> **Request the minimum permissions required for the functionality.**

This improves security and user trust.

---

# 🛠️ Installation

You can run the extension locally without publishing it to the Chrome Web Store.

### Step 1 — Clone the repository

```bash
git clone https://github.com/Pruthvi-cs/Chrome_extensions.git
```

### Step 2 — Open Chrome Extensions

Open:

```text
chrome://extensions/
```

### Step 3 — Enable Developer Mode

Turn on:

```text
Developer mode
```

Usually this option appears in the top-right corner.

### Step 4 — Load the project

Click:

```text
Load unpacked
```

Then select:

```text
Chrome_extensions/project_1
```

### Step 5 — Launch the extension

The extension should now appear in Chrome's extension list.

Pin it to the toolbar and click its icon.

---

# 🧪 Testing

After loading the extension:

1. Open the extension.
2. Test each available UI element.
3. Interact with buttons and inputs.
4. Check the displayed output.
5. Open DevTools if something doesn't work.

---

# 🐛 Debugging

Chrome provides several useful debugging tools.

## Popup DevTools

Open the extension popup and inspect it.

You can check:

```text
Console
Elements
Sources
Network
Application
```

The **Console** is especially useful for JavaScript errors.

For example:

```text
Uncaught ReferenceError
Uncaught TypeError
SyntaxError
```

---

## Extension Errors

You can also check:

```text
chrome://extensions/
```

Chrome may display errors associated with the extension.

This is especially useful when there is a problem with:

- `manifest.json`
- Permissions
- JavaScript
- Extension APIs
- File paths

---

# 🧠 Important Concepts Learned

This project introduces several important Chrome Extension concepts.

### 1. Manifest

Defines the extension.

### 2. Popup

Provides the extension's user interface.

### 3. DOM

Allows JavaScript to interact with HTML elements.

### 4. Events

Allow the extension to respond to user actions.

### 5. Chrome APIs

Provide access to browser-specific functionality.

### 6. Developer Mode

Allows local testing of unpacked extensions.

### 7. DevTools

Helps debug HTML, CSS, and JavaScript.

---

# 📚 Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Popup structure |
| CSS3 | UI styling |
| JavaScript | Application logic |
| Chrome Extension APIs | Browser integration |
| Manifest V3 | Extension architecture |
| Chrome DevTools | Debugging |

---

# 🚀 Future Improvements

This project can be expanded into more advanced Chrome Extension projects.

Possible improvements include:

- [ ] Chrome Storage API
- [ ] Active tab interaction
- [ ] Content scripts
- [ ] Background/service worker
- [ ] Context menus
- [ ] Notifications
- [ ] Keyboard shortcuts
- [ ] API integration
- [ ] Better UI/UX
- [ ] Settings page
- [ ] Persistent data
- [ ] Communication between popup and content scripts

---

# 📈 Learning Roadmap

This project is the beginning of a larger Chrome Extension learning path.

```text
Project 1
   │
   ▼
Basic Extension Concepts
   │
   ▼
Project 2
   │
   ▼
Chrome APIs
   │
   ▼
Todo Extension
   │
   ▼
Storage & State Management
   │
   ▼
Web Analyzer
   │
   ▼
Content Scripts
   │
   ▼
Advanced Extensions
```

---

# 🎓 What This Project Teaches

The most important lesson from Project 1 is understanding that a Chrome Extension is more than just a webpage.

It combines:

```text
Web Development
      +
Browser APIs
      +
Extension Architecture
      +
Event-driven Programming
```

Once these fundamentals are understood, more advanced extensions become much easier to build.

---

# 🔗 Main Repository

This project is part of the Chrome Extensions learning repository:

**GitHub:**  
https://github.com/Pruthvi-cs/Chrome_extensions

---

# 👨‍💻 Author

**Pruthviraj A Rai**

GitHub:  
https://github.com/Pruthvi-cs

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐.

More Chrome Extension projects will be added as the learning journey continues.