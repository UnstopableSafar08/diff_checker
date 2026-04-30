# DiffCheck - Premium Side-by-Side File Comparison

DiffCheck is a modern, high-performance web application designed for developers to compare two versions of a file with precision. Featuring a stunning glassmorphism interface and word-level diffing accuracy.

![DiffCheck](https://img.shields.io/badge/Version-1.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Side-by-Side View:** Clear horizontal comparison of original vs modified files
- **Word-Level Highlighting:** Drills down into specific line changes to show exactly what characters or words were added/removed
- **Glassmorphism UI:** A premium, dark-themed interface with smooth transitions and material design principles
- **Light/Dark Mode:** Toggle between themes for comfortable viewing in any environment
- **Drag & Drop:** Drop files directly into the editor for instant comparison
- **Comparison Options:**
  - Ignore Whitespace: Filter out trivial formatting changes
  - Ignore Case: Focus on logic rather than capitalization
  - Show Only Changes: Hide unchanged lines for cleaner diff view
- **Quick Actions:** One-click "Copy to Clipboard" for both original and modified versions
- **Dynamic Stats:** Real-time counters for total removals and additions
- **Keyboard Navigation:** Navigate through changes with arrow keys
- **Export Options:** Copy unified diff format to clipboard

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- (Optional) A local web server for development

### Installation

1. Clone or download this repository:
```bash
git clone https://github.com/yourusername/diff_checker.git
cd diff_checker
```

2. Open `index.html` in your browser
   - Note: For the best experience with file APIs, it's recommended to serve the folder using a local server

### Running Locally

Using Python's built-in server:

```bash
python3 -m http.server 8000
```

Using Node.js (http-server):

```bash
npx http-server -p 8000
```

Using PHP:

```bash
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

### Using Docker

Build the Docker image:

```bash
docker build -t diffcheck .
```

Run the container:

```bash
docker run -d -p 8080:80 diffcheck
```

Then navigate to `http://localhost:8080` in your browser.

## Usage

1. **Enter Text:** Type or paste your original text in the left editor and modified text in the right editor
2. **Upload Files:** Click "Upload" or drag & drop files directly into the editors
3. **Configure Options:** Toggle comparison options as needed
4. **Compare:** Click the green "Compare" button to generate the diff
5. **Navigate:** Use the navigation buttons or arrow keys to jump between changes
6. **Export:** Click "Copy Unified Diff" to copy the diff in standard format

## Built With

- **HTML5 & Vanilla CSS3**: Custom glassmorphism design system
- **JavaScript (ES6+)**: Core logic and UI interactivity
- **jsdiff**: High-performance text diffing library
- **Google Fonts**: Outfit & JetBrains Mono

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Project Structure

```
diff_checker/
├── index.html          # Main HTML file
├── assets/
│   ├── script.js       # Core JavaScript logic
│   └── style.css       # Styling and animations
├── Dockerfile          # Docker configuration
├── .dockerignore       # Docker ignore rules
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## License

This project is open-source and available under the [MIT License](LICENSE).

---

Made with ❤️ for developers