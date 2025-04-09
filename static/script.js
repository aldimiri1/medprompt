document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("symptomForm");
  const input = document.getElementById("symptomInput");
  const hiddenPrompt = document.getElementById("hiddenPrompt");
  const systemPromptField = document.getElementById("systemPrompt");
  const savePromptBtn = document.getElementById("savePromptBtn");
  const configIcon = document.getElementById("configIcon");
  const promptPanel = document.getElementById("promptPanel");
  const errorMsg = document.getElementById("error");
  const loadingMsg = document.getElementById("loading");
  const historyTabs = document.getElementById("historyTabs");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const recordBtn = document.getElementById("recordBtn");
  const recordStatus = document.getElementById("recordStatus");

  // Toggle prompt panel
  configIcon.addEventListener("click", () => {
    promptPanel.style.display = promptPanel.style.display === "none" ? "block" : "none";
  });

  // Save prompt
  savePromptBtn.addEventListener("click", () => {
    const prompt = systemPromptField.value.trim();
    localStorage.setItem("systemPrompt", prompt);
    promptPanel.style.display = "none";
    alert("✅ Prompt saved!");
  });

  // Load saved prompt on load
  const savedPrompt = localStorage.getItem("systemPrompt");
  if (savedPrompt) {
    systemPromptField.value = savedPrompt;
  }

  // Clear history
  clearHistoryBtn?.addEventListener("click", () => {
    if (confirm("Clear all history?")) {
      localStorage.removeItem("symptomHistory");
      renderHistory();
    }
  });

  // Submit form
  form.addEventListener("submit", (e) => {
    const symptoms = input.value.trim();
    const systemPrompt = systemPromptField.value.trim();

    if (symptoms.length < 10) {
      e.preventDefault();
      errorMsg.textContent = "Please describe your symptoms in more detail.";
      return;
    }

    hiddenPrompt.value = systemPrompt;
    errorMsg.textContent = "";
    loadingMsg.style.display = "block";
  });

  // Render history
  function renderHistory() {
    const history = JSON.parse(localStorage.getItem("symptomHistory")) || [];
    historyTabs.innerHTML = "";

    history.forEach((item) => {
      const container = document.createElement("div");
      container.className = "tab";

      const label = document.createElement("div");
      label.textContent = item.symptoms;

      const resultBox = document.createElement("div");
      resultBox.className = "result-box";
      resultBox.style.display = "none";
      resultBox.textContent = item.response;

      const reanalyzeBtn = document.createElement("button");
      reanalyzeBtn.className = "reanalyze-btn";
      reanalyzeBtn.textContent = "🔁 Re-analyze";
      reanalyzeBtn.onclick = () => {
        input.value = item.symptoms;
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.textContent = "📋 Copy";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(item.response);
        alert("Response copied to clipboard!");
      };

      label.addEventListener("click", () => {
        const isVisible = resultBox.style.display === "block";
        document.querySelectorAll(".result-box").forEach(box => box.style.display = "none");
        resultBox.style.display = isVisible ? "none" : "block";
      });

      container.appendChild(label);
      container.appendChild(resultBox);
      container.appendChild(reanalyzeBtn);
      container.appendChild(copyBtn);
      historyTabs.appendChild(container);
    });
  }

  renderHistory();

  // 🎙️ Audio recording and auto-submission
  let mediaRecorder;
  let audioChunks = [];

  recordBtn?.addEventListener("click", async () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      recordBtn.textContent = "🎙️ Start Recording";
      recordStatus.textContent = "Recording stopped. Transcribing...";
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      recordBtn.textContent = "⏹️ Stop Recording";
      recordStatus.textContent = "🎙️ Recording...";
    }
  });

  async function uploadAudio(blob) {
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");

    const res = await fetch("/transcribe", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (data.transcript) {
      input.value = data.transcript;
      recordStatus.textContent = "✅ Transcribed!";
      setTimeout(() => {
        document.getElementById("submitBtn").click();
      }, 500);
    } else {
      recordStatus.textContent = "❌ Transcription failed.";
    }
  }
});
