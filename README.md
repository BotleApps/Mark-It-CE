# Mark-It-CE - Your Ultimate Bookmark, Todos, Notes & Memory Manager



**Mark-It-CE** is a powerful Chrome Extension designed to help users manage bookmarks and open tabs efficiently. With intuitive spaces and groups, you can organize your bookmarks better, search with ease, and enjoy a seamless browsing experience.

---
![image](https://github.com/user-attachments/assets/ebde6dd0-3d66-4028-af85-d47874055b73)

## 🚀 Features

### 📌 Bookmark Management

- **Create, Edit & Delete Bookmarks** – Easily manage your saved links.
- **Move Bookmarks** – Organize bookmarks within groups with drag-and-drop.
- **Quick Save Popup** – Click the extension icon to instantly save the current tab as a bookmark.

### 📂 Bookmark Group Management

- **Create, Edit & Delete Groups** – Organize your bookmarks into categorized groups.
- **Move Groups** – Arrange groups to your preference.

### 🏠 Space Management

- **Create & Edit Spaces** – Manage different workspaces for focused browsing.
- **Switch Between Spaces** – Quickly toggle between multiple spaces.

### 🔄 Open Tabs Management

- **Bookmark Open Tabs** – Save open tabs with a click.
- **Drag & Drop Tabs** – Easily move tabs between groups.

### ⚙️ Settings

- **Customize Themes** – Switch between light & dark mode.
- **Import & Export Bookmarks** – Transfer bookmarks easily.
- **First-Time Setup Wizard** – Seamless onboarding for new users.

### 🔍 Search & Filtering

- **Search Bookmarks** – Instantly find saved bookmarks using keywords.

### 🌟 User Experience

- **Smooth Drag & Drop** – Powered by `@dnd-kit/core` for a fluid experience.
- **Toast Notifications** – Get quick alerts for actions.

### 📝 Coming Soon

- **Todos and Notes Management** – Stay organized with built-in task and note tracking.
---

## 📥 Installation

### 🛠 [Install from Chrome Web Store](https://chromewebstore.google.com/detail/mark-it-memory-manager/ggpbonlpbpoimehcopnkeoklajdpkbho)

![Screenshot 2025-02-08 at 10 11 17 PM](https://github.com/user-attachments/assets/1a5d5e77-4498-4de8-80d1-056ff3711493)


### 📜 Install Manually (For Developers)

1. Clone the repository:
   ```sh
   git clone https://github.com/BotleApps/Mark-It-CE.git
   cd Mark-It-CE
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Build the project:
   ```sh
   npm run build
   ```
4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

---

## 🛠 Development & Contribution

### 🔧 Running in Development Mode

```sh
npm run dev
```

### 📏 Linting Code

```sh
npm run lint
```

### 🧪 Running Tests

```sh
npm run test
```

### 📦 Packaging for Chrome Web Store

```sh
npm run package
```

### � Version Management

```sh
# Auto-detect version bump from commits
npm run bump

# Or specify bump type manually
npm run bump:major    # 1.0.0 → 2.0.0
npm run bump:minor    # 1.0.0 → 1.1.0
npm run bump:patch    # 1.0.0 → 1.0.1
```

### �🚀 Automated Publishing Setup

```sh
npm run setup-webstore
```

**Robust CI/CD Pipeline:**
- 🔍 **PR Analysis**: Auto-detects version bump from commit messages
- 🤖 **Auto Versioning**: Bumps version automatically on merge to main
- 🚀 **Auto Publishing**: Deploys to Chrome Web Store automatically
- 📋 **Smart Comments**: Bot suggests version changes on PRs

For detailed publishing instructions, see [PUBLISHING.md](docs/PUBLISHING.md).

### 🤝 Contributing

Contributions are always welcome! To get started:

1. Fork the repo and create a new branch.
2. Implement your changes and commit with a clear message.
3. Submit a Pull Request.

For issues or feature requests, visit our [Issue Tracker](https://github.com/BotleApps/Mark-It-CE/issues).

---

## 🔄 Release Notes

### **v1.0.5** *(Latest)*

✅ **New Features:**

- **Quick Save Popup** – Click the extension icon to instantly save the current tab as a bookmark. Choose your space and group directly from the popup without opening the main manager.

🐞 **Bug Fixes:**

- Enhanced UI/UX with better button states (disabled when no bookmarks in group)

### **v1.0.4**

✅ **New Features:**

- **Open All Tabs in Group** – Added a convenient "Open All" button to bookmark groups, allowing you to open all bookmarks in a group with a single click. Perfect for opening your daily work tabs or project-related bookmarks instantly.

🐞 **Bug Fixes:**

- Improved bookmark importing functionality to properly merge with existing bookmarks instead of overwriting them
- Fixed various TypeScript compilation errors for better stability

### **v1.0.3**

✅ **New Features:**

- Collapsable side panel – Collapse the open tabs side panel to save screen space and focus on your main content.
- Bookmark tab settings – Now choose whether to open bookmarks in a new tab or existing tab.  
  Tip: Go to the settings menu, and select your preferred option (New Tab or Existing Tab) from the dropdown.

  Thanks to [@vishnuvardhan-s](https://github.com/vishnuvardhan-s) – Vishnuvardhan S

🐞 **Bug Fixes:**

- Fixed an issue where importing bookmarks from a file would overwrite existing bookmarks

### **v1.0.2**

🐞 **Bug Fixes:**

- Import from Chrome Bookmarks issue fix
- UX - Text & space size fixes

### **v1.0.1**

✅ **New Features:**

- Space Deletion – Now delete spaces via settings.
- Improved Scrolling – Smoother navigation for bookmarks & open tabs.
- Text Input Validation – Prevents invalid input.
- Enhanced UI/UX – Better design and user experience.
- Bug Fixes & Performance Improvements.

### **v1.0.0**

🚀 **Initial Release** – Powerful bookmark & tab manager for Chrome!

---

## 📌 Useful Links

- 🏗 **Open Source Repo:** [GitHub](https://github.com/BotleApps/Mark-It-CE)
- 📝 **Report Issues:** [Issue Tracker](https://github.com/BotleApps/Mark-It-CE/issues)
- ⭐ **Feedback & Reviews:** [Chrome Web Store Reviews](https://chromewebstore.google.com/detail/mark-it-memory-manager/ggpbonlpbpoimehcopnkeoklajdpkbho/reviews)

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](https://github.com/BotleApps/Mark-It-CE/blob/main/LICENSE) for details.

Happy Bookmarking! 🎉

## 🙏 Acknowledgements

A big thank you to all our contributors for their valuable support and contributions! 💖

### 🚀 Contributors

- [@sivakumarvemula](https://github.com/sivakumarvemula) – Siva Kumar Vemula  
- [@vishnuvardhan-s](https://github.com/vishnuvardhan-s) – Vishnuvardhan S

Your efforts make this project better every day. Thank you! 🎉
