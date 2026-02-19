document.addEventListener("DOMContentLoaded", () => {
  const text1 = document.getElementById("text1");
  const text2 = document.getElementById("text2");
  const file1 = document.getElementById("file1");
  const file2 = document.getElementById("file2");
  const compareBtn = document.getElementById("compareBtn");
  const ignoreWhitespace = document.getElementById("ignoreWhitespace");
  const ignoreCase = document.getElementById("ignoreCase");
  const diffResult = document.getElementById("diffResult");
  const diffLeft = document.getElementById("diffLeft");
  const diffRight = document.getElementById("diffRight");
  const removalStats = document.getElementById("removalStats");
  const additionStats = document.getElementById("additionStats");

  // Clear button — fade out then reload smoothly
  const clearBtn = document.getElementById("clearBtn");
  clearBtn.addEventListener("click", (e) => {
    // prevent accidental double-handling
    e.preventDefault();
    // smooth scroll to top first
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {}
    // fade out the body then reload
    document.body.style.transition = "opacity 240ms ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
      location.reload();
    }, 260);
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

  const performDiff = () => {
    const val1 = text1.value;
    const val2 = text2.value;

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
      removalStats.textContent = "0 removals";
      additionStats.textContent = "0 additions";
      return;
    }

    // Debugging info (helpful when unexpected identical detection occurs)
    // console.log('Normalized compare', { n1, n2, options });

    if (n1 === n2) {
      diffResult.innerHTML = `
        <div class="diff-stats-header">
          <div class="stat-box">
            <div class="stat-label">
              <span style="color: var(--diff-removed-border)">⊖</span>
              <span>0 removals</span>
            </div>
            <button class="btn-copy" onclick="copyText('text1', this)">Copy</button>
          </div>
          <div class="stat-box">
            <div class="stat-label">
              <span style="color: var(--diff-added-border)">⊕</span>
              <span>0 additions</span>
            </div>
            <button class="btn-copy" onclick="copyText('text2', this)">Copy</button>
          </div>
        </div>
        <div class="no-diff">There is no difference, Fully identical.</div>
      `;
      diffResult.classList.add("visible");
      diffResult.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const diff = Diff.diffLines(val1, val2, options);
    renderSideBySide(diff, options);
  };

  const renderSideBySide = (diff, options) => {
    diffLeft.innerHTML = "";
    diffRight.innerHTML = "";

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

            diffLeft.appendChild(
              createLine(leftLineNum++, leftHtml, "removed", true),
            );
            diffRight.appendChild(
              createLine(rightLineNum++, rightHtml, "added", true),
            );
          } else if (removedLines[j] !== undefined) {
            diffLeft.appendChild(createLine(leftLineNum++, oldL, "removed"));
            diffRight.appendChild(createLine(null, "", "empty"));
            totalRemovals++;
          } else {
            diffLeft.appendChild(createLine(null, "", "empty"));
            diffRight.appendChild(createLine(rightLineNum++, newL, "added"));
            totalAdditions++;
          }
        }
        i++; // Skip nextPart as we handled it
      } else if (part.removed) {
        const lines = part.value
          .split("\n")
          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "");
        lines.forEach((l) => {
          diffLeft.appendChild(createLine(leftLineNum++, l, "removed"));
          diffRight.appendChild(createLine(null, "", "empty"));
          totalRemovals++;
        });
      } else if (part.added) {
        const lines = part.value
          .split("\n")
          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "");
        lines.forEach((l) => {
          diffLeft.appendChild(createLine(null, "", "empty"));
          diffRight.appendChild(createLine(rightLineNum++, l, "added"));
          totalAdditions++;
        });
      } else {
        const lines = part.value
          .split("\n")
          .filter((l, idx, arr) => idx < arr.length - 1 || l !== "");
        lines.forEach((l) => {
          diffLeft.appendChild(createLine(leftLineNum++, l, "unchanged"));
          diffRight.appendChild(createLine(rightLineNum++, l, "unchanged"));
        });
      }
    }

    removalStats.textContent = `${totalRemovals} removal${totalRemovals !== 1 ? "s" : ""}`;
    additionStats.textContent = `${totalAdditions} addition${totalAdditions !== 1 ? "s" : ""}`;
    diffResult.classList.add("visible");
    diffResult.scrollIntoView({ behavior: "smooth" });
  };

  compareBtn.addEventListener("click", performDiff);

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
