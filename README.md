# DiffCheck - Premium Side-by-Side File Comparison

DiffCheck is a modern, high-performance web application designed for developers to compare two versions of a file with precision. Featuring a stunning glassmorphism interface and word-level diffing accuracy.

## Features

- **Side-by-Side View:** Clear horizontal comparison of original vs modified files.
- **Word-Level Highlighting:** Drills down into specific line changes to show exactly what characters or words were added/removed.
- **Glassmorphism UI:** A premium, dark-themed interface with smooth transitions and material design principles.
- **Drag & Drop:** Drop files directly into the editor for instant comparison.
- **Comparison Options:** 
  - Ignore Whitespace: Filter out trivial formatting changes.
  - Ignore Case: Focus on logic rather than capitalization.
- **Quick Actions:** One-click "Copy to Clipboard" for both original and modified versions.
- **Dynamic Stats:** Real-time counters for total removals and additions.

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge).
- (Optional) A local web server for development.

### Installation
1. Clone or download this repository.
2. Open index.html in your browser.
   - Note: For the best experience with file APIs, it's recommended to serve the folder using a local server.

```bash
# Example: Using Python's built-in server
python3 -m http.server 8000
```

## Built With

- **HTML5 & Vanilla CSS3**: Custom glassmorphism design system.
- **JavaScript (ES6+)**: Core logic and UI interactivity.
- **jsdiff**: High-performance text diffing library.
- **Google Fonts**: Outfit & JetBrains Mono.

## License
This project is open-source. Feel free to modify and adapt it for your own needs.

---