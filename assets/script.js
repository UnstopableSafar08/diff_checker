document.addEventListener("DOMContentLoaded", () => {
  const text1 = document.getElementById("text1");
  const text2 = document.getElementById("text2");
  const file1 = document.getElementById("file1");
  const file2 = document.getElementById("file2");
  const compareBtn = document.getElementById("compareBtn");
  const ignoreWhitespace = document.getElementById("ignoreWhitespace");
  const ignoreCase = document.getElementById("ignoreCase");
  const showOnlyChanges = document.getElementById("showOnlyChanges");
  const unifiedView = document.getElementById("unifiedView");
  const swapBtn = document.getElementById("swapBtn");
  const diffResult = document.getElementById("diffResult");
  const diffLeft = document.getElementById("diffLeft");
  const diffRight = document.getElementById("diffRight");
  const unifiedDiff = document.getElementById("unifiedDiff");
  const removalStats = document.getElementById("removalStats");
  const additionStats = document.getElementById("additionStats");
  const prevChange = document.getElementById("prevChange");
  const nextChange = document.getElementById("nextChange");
  const changeCounter = document.getElementById("changeCounter");
  const copyDiff = document.getElementById("copyDiff");
  const downloadDiff = document.getElementById("downloadDiff");
  const progressIndicator = document.getElementById("progressIndicator");
  const themeToggle = document.getElementById("themeToggle");

  // Track change lines for navigation
  let changeLines = [];
  let currentChangeIndex = -1;

  // Debounce function for large files
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Theme toggle with persistence
  const initTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.body.classList.add("light-mode");
      themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  };

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  });

  initTheme();

  // Clear button — Reset inputs and results without reload
  const clearBtn = document.getElementById("clearBtn");
  clearBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Clear inputs
    text1.value = "";
    text2.value = "";
    file1.value = "";
    file2.value = "";

    // Reset stats
    removalStats.textContent = "0 removals";
    additionStats.textContent = "0 additions";

    // Clear diff panes
    diffLeft.innerHTML = "";
    diffRight.innerHTML = "";
    unifiedDiff.innerHTML = "";

    // Reset change tracking
    changeLines = [];
    currentChangeIndex = -1;
    updateChangeCounter();

    // Remove any special messages like "Fully identical"
    const existingNoDiff = diffResult.querySelector(".no-diff");
    if (existingNoDiff) existingNoDiff.remove();

    // Ensure side-by-side view is visible for next time
    const sideBySide = diffResult.querySelector(".diff-side-by-side");
    if (sideBySide) sideBySide.style.display = "grid";

    // Hide result section
    diffResult.classList.remove("visible");
  });

  // Copy to clipboard
  window.copyText = (id, btn) => {
    const text = document.getElementById(id).value;
    const buttonEl = btn || document.activeElement || null;
    navigator.clipboard.writeText(text).then(() => {
      if (buttonEl) {
        const originalText = buttonEl.textContent;
        buttonEl.textContent = "Copied!";
        setTimeout(() => (buttonEl.textContent = originalText), 2000);
      }
    });
  };

  // Handle file uploads
  const handleFileUpload = (fileInput, textArea) => {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        textArea.value = event.target.result;
      };
      reader.readAsText(file);
    });
  };

  handleFileUpload(file1, text1);
  handleFileUpload(file2, text2);

  // Make 'Upload File' spans trigger the hidden file inputs
  document.querySelectorAll(".upload-link").forEach((link, index) => {
    link.addEventListener("click", () => {
      const fileInput = index === 0 ? file1 : file2;
      fileInput.click();
    });
  });

  // Swap files functionality
  swapBtn.addEventListener("click", () => {
    const temp = text1.value;
    text1.value = text2.value;
    text2.value = temp;

    // Also swap file inputs
    const tempFile = file1.files[0];
    if (tempFile) {
      const dt = new DataTransfer();
      dt.items.add(tempFile);
      file2.files = dt.files;
    }
    file1.value = "";

    // Re-run comparison if results are visible
    if (diffResult.classList.contains("visible")) {
      performDiff();
    }
  });

  // Detect file type for syntax highlighting
  const detectLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'sh': 'bash',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'toml': 'toml',
      'ini': 'ini',
      'conf': 'ini',
      'log': 'plaintext'
    };
    return langMap[ext] || 'plaintext';
  };

  const createLine = (num, content, type, isWordDiff = false) => {
    const div = document.createElement("div");
    div.className = `diff-line ${type}`;

    const numSpan = document.createElement("span");
    numSpan.className = "line-num";
    numSpan.textContent = num || "";

    const contentSpan = document.createElement("span");
    contentSpan.className = "line-content";
    if (isWordDiff) {
      contentSpan.innerHTML = content;
    } else {
      contentSpan.textContent = content;
    }

    div.appendChild(numSpan);
    div.appendChild(contentSpan);
    return div;
  };

  // Generate unified diff text
  const generateUnifiedDiff = (diff) => {
    let result = "";
    let leftLine = 1;
    let rightLine = 1;

    diff.forEach((part) => {
      const lines = part.value.split("\n").filter((l, idx, arr) => idx < arr.length - 1 || l !== "");

      if (part.removed) {
        lines.forEach((line) => {
          result += `-${line}\n`;
          leftLine++;
        });
      } else if (part.added) {
        lines.forEach((line) => {
          result += `+${line}\n`;
          rightLine++;
        });
      } else {
        lines.forEach((line) => {
          result += ` ${line}\n`;
          leftLine++;
          rightLine++;
        });
      }
    });

    return result;
  };

  // Update change counter
  const updateChangeCounter = () => {
    const total = changeLines.length;
    const current = currentChangeIndex >= 0 ? currentChangeIndex + 1 : 0;
    changeCounter.textContent = `${current} / ${total}`;
    prevChange.disabled = currentChangeIndex <= 0;
    nextChange.disabled = currentChangeIndex >= total - 1;
  };

  // Navigate to a specific change
  const navigateToChange = (index) => {
    if (index < 0 || index >= changeLines.length) return;

    currentChangeIndex = index;
    updateChangeCounter();

    const { element, pane } = changeLines[index];
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Highlight the change
    element.style.background = "rgba(56, 189, 248, 0.3)";
    setTimeout(() => {
      element.style.background = "";
    }, 1500);
  };

  // Navigation button handlers
  prevChange.addEventListener("click", () => {
    if (currentChangeIndex > 0) {
      navigateToChange(currentChangeIndex - 1);
    }
  });

  nextChange.addEventListener("click", () => {
    if (currentChangeIndex < changeLines.length - 1) {
      navigateToChange(currentChangeIndex + 1);
    }
  });

  // Copy diff to clipboard
  copyDiff.addEventListener("click", () => {
    const val1 = text1.value;
    const val2 = text2.value;
    const options = {
      ignoreWhitespace: ignoreWhitespace.checked,
      ignoreCase: ignoreCase.checked,
    };

    const diff = Diff.diffLines(val1, val2, options);
    const unifiedDiffText = generateUnifiedDiff(diff);

    navigator.clipboard.writeText(unifiedDiffText).then(() => {
      const originalText = copyDiff.innerHTML;
      copyDiff.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => (copyDiff.innerHTML = originalText), 2000);
    });
  });

  // Download diff as file
  downloadDiff.addEventListener("click", () => {
    const val1 = text1.value;
    const val2 = text2.value;
    const options = {
      ignoreWhitespace: ignoreWhitespace.checked,
      ignoreCase: ignoreCase.checked,
    };

    const diff = Diff.diffLines(val1, val2, options);
    const unifiedDiffText = generateUnifiedDiff(diff);

    const blob = new Blob([unifiedDiffText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diff.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Synchronized scrolling
  let isScrolling = false;
  const syncScroll = (source, target) => {
    if (isScrolling) return;
    isScrolling = true;

    const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
    target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);

    setTimeout(() => {
      isScrolling = false;
    }, 10);
  };

  diffLeft.addEventListener("scroll", () => syncScroll(diffLeft, diffRight));
  diffRight.addEventListener("scroll", () => syncScroll(diffRight, diffLeft));

  const performDiff = () => {
    const val1 = text1.value;
    const val2 = text2.value;

    // Show progress for large files
    const isLargeFile = (val1.length + val2.length) > 50000;
    if (isLargeFile) {
      progressIndicator.style.display = "flex";
    }

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const options = {
        ignoreWhitespace: ignoreWhitespace.checked,
        ignoreCase: ignoreCase.checked,
      };

      const normalize = (s) => {
        let r = (s || "").toString();
        if (options.ignoreWhitespace) r = r.replace(/\s+/g, "");
        if (options.ignoreCase) r = r.toLowerCase();
        return r;
      };

      const n1 = normalize(val1);
      const n2 = normalize(val2);

      // If both normalized are empty, clear previous results and do nothing
      if (n1 === "" && n2 === "") {
        diffResult.classList.remove("visible");
        diffLeft.innerHTML = "";
        diffRight.innerHTML = "";
        unifiedDiff.innerHTML = "";
        removalStats.textContent = "0 removals";
        additionStats.textContent = "0 additions";
        changeLines = [];
        currentChangeIndex = -1;
        updateChangeCounter();
        progressIndicator.style.display = "none";
        return;
      }

      if (n1 === n2) {
        // Clear previous diff panes
        diffLeft.innerHTML = "";
        diffRight.innerHTML = "";
        unifiedDiff.innerHTML = "";

        // Update stats
        removalStats.textContent = "0 removals";
        additionStats.textContent = "0 additions";

        // Reset change tracking
        changeLines = [];
        currentChangeIndex = -1;
        updateChangeCounter();

        // Show identical message in a clean way without destroying DOM structure
        const sideBySide = diffResult.querySelector(".diff-side-by-side");
        let noDiffMsg = diffResult.querySelector(".no-diff");

        if (!noDiffMsg) {
          noDiffMsg = document.createElement("div");
          noDiffMsg.className = "no-diff";
          noDiffMsg.textContent = "There is no difference, Fully identical.";
          // Insert it after the stats header but before the side-by-side grid
          diffResult.insertBefore(noDiffMsg, sideBySide);
        }

        // Hide side-by-side panes when identical
        if (sideBySide) sideBySide.style.display = "none";
        unifiedDiff.style.display = "none";

        diffResult.classList.add("visible");
        diffResult.scrollIntoView({ behavior: "smooth" });
        progressIndicator.style.display = "none";
        return;
      }

      // If not identical, ensure side-by-side is visible and no-diff message is gone
      const sideBySide = diffResult.querySelector(".diff-side-by-side");
      const noDiffMsg = diffResult.querySelector(".no-diff");
      if (noDiffMsg) noDiffMsg.remove();

      // Toggle between unified and side-by-side view
      if (unifiedView.checked) {
        sideBySide.style.display = "none";
        unifiedDiff.style.display = "block";
        renderUnifiedDiff(val1, val2, options);
      } else {
        sideBySide.style.display = "grid";
        unifiedDiff.style.display = "none";
        const diff = Diff.diffLines(val1, val2, options);
        renderSideBySide(diff, options);
      }

      progressIndicator.style.display = "none";
    }, isLargeFile ? 100 : 0);
  };

  const renderUnifiedDiff = (val1, val2, options) => {
    unifiedDiff.innerHTML = "";
    changeLines = [];
    currentChangeIndex = -1;

    const diff = Diff.diffLines(val1, val2, options);
    let totalAdditions = 0;
    let totalRemovals = 0;
    let lineNum = 1;

    diff.forEach((part) => {
      const lines = part.value.split("\n").filter((l, idx, arr) => idx < arr.length - 1 || l !== "");

      lines.forEach((line) => {
        let type = "unchanged";
        if (part.removed) {
          type = "removed";
          totalRemovals++;
        } else if (part.added) {
          type = "added";
          totalAdditions++;
        }

        const lineEl = createLine(lineNum++, line, type);
        unifiedDiff.appendChild(lineEl);

        // Track changes for navigation
        if (type !== "unchanged") {
          changeLines.push({ element: lineEl, pane: "unified" });
        }

        // Hide unchanged lines if option is enabled
        if (showOnlyChanges.checked && type === "unchanged") {
          lineEl.classList.add("hidden");
        }
      });
    });

    removalStats.textContent = `${totalRemovals} removal${totalRemovals !== 1 ? "s" : ""}`;
    additionStats.textContent = `${totalAdditions} addition${totalAdditions !== 1 ? "s" : ""}`;
    updateChangeCounter();
    diffResult.classList.add("visible");
    diffResult.scrollIntoView({ behavior: "smooth" });
  };

  const renderSideBySide = (diff, options) => {
    diffLeft.innerHTML = "";
    diffRight.innerHTML = "";
    changeLines = [];
    currentChangeIndex = -1;

    let leftLineNum = 1;
    let rightLineNum = 1;
    let totalAdditions = 0;
    let totalRemovals = 0;

    for (let i = 0; i < diff.length; i++) {
      const part = diff[i];
      const nextPart = diff[i + 1];

      // Highlight word differences if a removal is followed by an addition
      if (part.removed && nextPart && nextPart.added) {
        const removedLines = part.value
          .split("\n")
          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "");
        const addedLines = nextPart.value
          .split("\n")
          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "");

        const maxLines = Math.max(removedLines.length, addedLines.length);

        for (let j = 0; j < maxLines; j++) {
          const oldL = removedLines[j] || "";
          const newL = addedLines[j] || "";

          if (removedLines[j] !== undefined && addedLines[j] !== undefined) {
            // Word diff
            const wordDiff = Diff.diffWords(oldL, newL, options);
            let leftHtml = "";
            let rightHtml = "";

            wordDiff.forEach((w) => {
              if (w.removed) {
                leftHtml += `<span class="word-removed">${w.value}</span>`;
                totalRemovals++;
              } else if (w.added) {
                rightHtml += `<span class="word-added">${w.value}</span>`;
                totalAdditions++;
              } else {
                leftHtml += w.value;
                rightHtml += w.value;
              }
            });

            const leftLine = createLine(leftLineNum++, leftHtml, "removed", true);
            const rightLine = createLine(rightLineNum++, rightHtml, "added", true);

            diffLeft.appendChild(leftLine);
            diffRight.appendChild(rightLine);

            changeLines.push({ element: leftLine, pane: "left" });
            changeLines.push({ element: rightLine, pane: "right" });
          } else if (removedLines[j] !== undefined) {
            const leftLine = createLine(leftLineNum++, oldL, "removed");
            diffLeft.appendChild(leftLine);
            diffRight.appendChild(createLine(null, "", "empty"));
            totalRemovals++;
            changeLines.push({ element: leftLine, pane: "left" });
          } else {
            diffLeft.appendChild(createLine(null, "", "empty"));
            const rightLine = createLine(rightLineNum++, newL, "added");
            diffRight.appendChild(rightLine);
            totalAdditions++;
            changeLines.push({ element: rightLine, pane: "right" });
          }
        }
        i++; // Skip nextPart as we handled it
      } else if (part.removed) {
        const lines = part.value
          .split("\n")
          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "");
        lines.forEach((l) => {
          const leftLine = createLine(leftLineNum++, l, "removed");
          diffLeft.appendChild(leftLine);
          diffRight.appendChild(createLine(null, "", "empty"));
          totalRemovals++;
          changeLines.push({ element: leftLine, pane: "left" });
        });
      } else if (part.added) {
        const lines = part.value
          .split("\n")
          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "");
        lines.forEach((l) => {
          diffLeft.appendChild(createLine(null, "", "empty"));
          const rightLine = createLine(rightLineNum++, l, "added");
          diffRight.appendChild(rightLine);
          totalAdditions++;
          changeLines.push({ element: rightLine, pane: "right" });
        });
      } else {
        const lines = part.value
          .split("\n")
          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "");
        lines.forEach((l) => {
          const leftLine = createLine(leftLineNum++, l, "unchanged");
          const rightLine = createLine(rightLineNum++, l, "unchanged");

          // Hide unchanged lines if option is enabled
          if (showOnlyChanges.checked) {
            leftLine.classList.add("hidden");
            rightLine.classList.add("hidden");
          }

          diffLeft.appendChild(leftLine);
          diffRight.appendChild(rightLine);
        });
      }
    }

    removalStats.textContent = `${totalRemovals} removal${totalRemovals !== 1 ? "s" : ""}`;
    additionStats.textContent = `${totalAdditions} addition${totalAdditions !== 1 ? "s" : ""}`;
    updateChangeCounter();
    diffResult.classList.add("visible");
    diffResult.scrollIntoView({ behavior: "smooth" });
  };

  // Debounced comparison for large files
  const debouncedCompare = debounce(performDiff, 300);

  compareBtn.addEventListener("click", performDiff);

  // Re-run comparison when options change
  [ignoreWhitespace, ignoreCase, showOnlyChanges, unifiedView].forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (diffResult.classList.contains("visible")) {
        debouncedCompare();
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + Enter to compare
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      performDiff();
    }

    // Ctrl/Cmd + Shift + S to swap
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
      e.preventDefault();
      swapBtn.click();
    }

    // Alt + Up to go to previous change
    if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      if (currentChangeIndex > 0) {
        navigateToChange(currentChangeIndex - 1);
      }
    }

    // Alt + Down to go to next change
    if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      if (currentChangeIndex < changeLines.length - 1) {
        navigateToChange(currentChangeIndex + 1);
      }
    }
  });

  // Drag and Drop support
  [text1, text2].forEach((area, index) => {
    const container = area.closest(".editor-container");

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      container.style.borderColor = "var(--accent-color)";
      container.style.boxShadow = "0 0 20px rgba(56, 189, 248, 0.2)";
    });

    container.addEventListener("dragleave", () => {
      container.style.borderColor = "var(--glass-border)";
      container.style.boxShadow = "var(--card-shadow)";
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.style.borderColor = "var(--glass-border)";
      container.style.boxShadow = "var(--card-shadow)";

      const file = e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          area.value = event.target.result;
          area.dispatchEvent(new Event("input"));
        };
        reader.readAsText(file);
      }
    });
  });
});
