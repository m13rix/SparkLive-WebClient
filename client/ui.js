const ui = {
    configPanelWrapper: document.querySelector('.config-panel-wrapper'),
    sessionActiveUI: document.querySelector('.session-active-ui'),
    systemPrompt: document.getElementById('systemPrompt'),
    voiceSelect: document.getElementById('voiceSelect'),
    startSessionButton: document.getElementById('startSessionButton'),
    stopSessionButton: document.getElementById('stopSessionButton'),
    statusDisplay: document.getElementById('status'),
    subtitlesDisplayArea: document.getElementById('subtitlesDisplay'),

    maxSubtitles: 5, // Max number of subtitle entries to show

    init() {
        this.startSessionButton.addEventListener('click', () => {
            if (window.technical && typeof window.technical.startSession === 'function') {
                window.technical.startSession();
            }
        });
        this.stopSessionButton.addEventListener('click', () => {
            if (window.technical && typeof window.technical.stopSession === 'function') {
                window.technical.stopSession();
            }
        });
    },

    showConfigPanel() {
        this.configPanelWrapper.classList.add('active');
        this.sessionActiveUI.classList.remove('active');
        this.subtitlesDisplayArea.classList.remove('active');
    },

    showSessionInterface() {
        this.configPanelWrapper.classList.remove('active');
        this.sessionActiveUI.classList.add('active');
        this.subtitlesDisplayArea.classList.add('active');
    },

    updateStatus(message) {
        this.statusDisplay.textContent = `${message}`; // Simpler status

        let currentAiState = 'idle';
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('слушаю') || lowerMessage.includes('speech detected')) {
            currentAiState = 'listening';
        } else if (lowerMessage.includes('ии отвечает') || lowerMessage.includes('speaking')) {
            currentAiState = 'speaking';
        } else if (lowerMessage.includes('думает') || lowerMessage.includes('обработка') || lowerMessage.includes('processing')) {
            currentAiState = 'thinking';
        }
        // Add other states if your visualizer supports them

        this.setAIStateVisualizer(currentAiState);
    },

    setAIStateVisualizer(newState) {
        if (typeof window.setAIState === 'function') {
            window.setAIState(newState);
        } else {
            // console.warn('Функция window.setAIState из ai_visualizer.js не найдена.');
        }
    },

    setAISpeechAmplitudeVisualizer(amplitude) {
        console.log(amplitude)
        if (typeof targetSpeechAmplitude !== 'undefined') {
            targetSpeechAmplitude = amplitude; // Assumes your visualizer reads this
        }
    },

    addSubtitle(text, type, isInterim = false) {
        let existingInterimEntry = this.subtitlesDisplayArea.querySelector('.interim-user-subtitle');

        if (isInterim && type === 'user') {
            if (!existingInterimEntry) {
                existingInterimEntry = document.createElement('div');
                existingInterimEntry.className = 'subtitle-entry user-subtitle interim-user-subtitle'; // Special class for easy finding

                const speakerSpan = document.createElement('span');
                speakerSpan.className = 'speaker';
                speakerSpan.textContent = 'Вы: ';
                existingInterimEntry.appendChild(speakerSpan);

                const textSpan = document.createElement('span');
                textSpan.className = 'interim-subtitle-text';
                existingInterimEntry.appendChild(textSpan);

                this.subtitlesDisplayArea.insertBefore(existingInterimEntry, this.subtitlesDisplayArea.firstChild); // Add at the "bottom" due to flex-direction: column-reverse
            }
            existingInterimEntry.querySelector('.interim-subtitle-text').textContent = text;
        } else {
            if (existingInterimEntry && type === 'user') { // Finalizing an interim user message
                existingInterimEntry.classList.remove('interim-user-subtitle');
                const textSpan = existingInterimEntry.querySelector('.interim-subtitle-text');
                if (textSpan) {
                    textSpan.textContent = text; // Update with final text
                    textSpan.classList.remove('interim-subtitle-text'); // Remove interim styling
                }
                // Keep this entry, it's now final
            } else { // New AI message or new final User message without prior interim
                if (existingInterimEntry && type === 'ai') { // If AI starts talking, remove user's interim
                    existingInterimEntry.remove();
                }
                const subtitleEntry = document.createElement('div');
                subtitleEntry.classList.add('subtitle-entry');

                const speakerSpan = document.createElement('span');
                speakerSpan.className = 'speaker';

                if (type === 'user') {
                    subtitleEntry.classList.add('user-subtitle');
                    speakerSpan.textContent = 'Вы: ';
                } else if (type === 'ai') {
                    subtitleEntry.classList.add('ai-subtitle');
                    speakerSpan.textContent = 'ИИ: ';
                }

                subtitleEntry.appendChild(speakerSpan);
                subtitleEntry.appendChild(document.createTextNode(text));
                this.subtitlesDisplayArea.insertBefore(subtitleEntry, this.subtitlesDisplayArea.firstChild);
            }
        }

        // Limit the number of subtitles displayed
        while (this.subtitlesDisplayArea.children.length > this.maxSubtitles) {
            this.subtitlesDisplayArea.lastChild.remove(); // Remove the oldest from the "top"
        }
        // Ensure scroll to the "bottom" (which is visually the bottom due to column-reverse)
        this.subtitlesDisplayArea.scrollTop = 0;
    },

    clearSubtitles() {
        this.subtitlesDisplayArea.innerHTML = '';
    },

    getSystemPrompt() {
        return this.systemPrompt.value;
    },

    getVoiceSelection() {
        return this.voiceSelect.value;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ui.init();
    window.ui = ui;
    ui.showConfigPanel(); // Start with config panel visible
});
