// Winwin Group Voice Bot - Avec API OpenAI TTS Réelle
// Version corrigée avec tous les bugs résolus

class WinwinVoiceBot {
    constructor() {
        // OpenAI Configuration - Clé API fournie
        this.openaiApiKey = 'ENTRER VOTRE CLE ICI';
        this.openaiBaseUrl = 'https://api.openai.com/v1';
        
        // Application State
        this.isListening = false;
        this.isProcessing = false;
        this.recognition = null;
        this.currentAudio = null; // Pour contrôler la lecture audio
        this.conversation = [];
        
        // Configuration
        this.config = {
            model: 'gpt-4o-mini',
            ttsModel: 'tts-1-hd', // Modèle TTS haute qualité
            temperature: 0.7,
            voice: 'alloy', // Voix OpenAI par défaut
            systemPrompt: 'Tu es un assistant vocal intelligent de Winwin Group. Réponds de manière concise, naturelle et professionnelle. Tu représentes l\'excellence et l\'innovation de notre entreprise. Sois serviable, amical et toujours orienté solution.'
        };

        // Voix OpenAI TTS disponibles avec descriptions
        this.availableVoices = [
            { id: 'alloy', name: 'Alloy', description: 'Voix équilibrée et polyvalente' },
            { id: 'ash', name: 'Ash', description: 'Voix naturelle et chaleureuse' },
            { id: 'ballad', name: 'Ballad', description: 'Voix douce et mélodieuse' },
            { id: 'coral', name: 'Coral', description: 'Voix féminine claire et expressive' },
            { id: 'echo', name: 'Echo', description: 'Voix masculine calme et profonde' },
            { id: 'fable', name: 'Fable', description: 'Voix narrative engageante' },
            { id: 'nova', name: 'Nova', description: 'Voix féminine énergique et moderne' },
            { id: 'onyx', name: 'Onyx', description: 'Voix masculine profonde et assurée' },
            { id: 'sage', name: 'Sage', description: 'Voix sage et posée' },
            { id: 'shimmer', name: 'Shimmer', description: 'Voix douce et apaisante' },
            { id: 'vine', name: 'Vine', description: 'Voix dynamique et vivante' }
        ];

        // Quick Prompts Database
        this.quickPrompts = {
            'assistant-commercial': 'Tu es un assistant commercial professionnel de Winwin Group. Sois persuasif, orienté résultats et aide les clients à prendre des décisions éclairées. Utilise un ton confiant et professionnel.',
            'support-technique': 'Tu es un expert support technique de Winwin Group. Sois patient, précis et pédagogique. Explique les concepts techniques de manière simple et accessible.',
            'coach-personnel': 'Tu es un coach personnel motivant et bienveillant de Winwin Group. Encourage, inspire et guide vers l\'atteinte d\'objectifs. Sois empathique et positif.',
            'consultant-business': 'Tu es un consultant business expert de Winwin Group. Fournis des conseils stratégiques professionnels, des analyses pertinentes et des recommandations concrètes.'
        };
        
        // DOM Elements
        this.elements = {};
        
        this.init();
    }

    init() {
        this.initElements();
        this.initSpeechRecognition();
        this.bindEvents();
        this.populateVoiceSelect(); // Populate avec les vraies voix OpenAI
        this.loadSettings();
        this.updateStatus('ready', 'Prêt');
        this.showToast('success', 'Système initialisé', 'Assistant vocal Winwin Group avec voix OpenAI TTS prêt');
    }

    initElements() {
        this.elements = {
            // Status
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            
            // Chat
            conversationArea: document.getElementById('conversationArea'),
            
            // Voice Controls
            voiceButton: document.getElementById('voiceButton'),
            textInputButton: document.getElementById('textInputButton'),
            clearChatButton: document.getElementById('clearChatButton'),
            audioVisualizer: document.getElementById('audioVisualizer'),
            
            // Text Input
            textInputArea: document.getElementById('textInputArea'),
            textInput: document.getElementById('textInput'),
            sendButton: document.getElementById('sendButton'),
            
            // Settings
            toggleSettings: document.getElementById('toggleSettings'),
            settingsContent: document.getElementById('settingsContent'),
            modelSelect: document.getElementById('modelSelect'),
            ttsModelSelect: document.getElementById('ttsModelSelect'),
            voiceSelect: document.getElementById('voiceSelect'),
            testVoiceButton: document.getElementById('testVoiceButton'),
            temperatureSlider: document.getElementById('temperatureSlider'),
            temperatureValue: document.getElementById('temperatureValue'),
            systemPrompt: document.getElementById('systemPrompt'),
            quickPrompts: document.getElementById('quickPrompts'),
            saveSettingsButton: document.getElementById('saveSettingsButton'),
            exportButton: document.getElementById('exportButton'),
            
            // API Status
            chatApiStatus: document.getElementById('chatApiStatus'),
            ttsApiStatus: document.getElementById('ttsApiStatus'),
            
            // Overlays
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    populateVoiceSelect() {
        // Vider d'abord le select
        this.elements.voiceSelect.innerHTML = '';
        
        // Ajouter toutes les voix OpenAI TTS
        this.availableVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.id;
            option.textContent = `${voice.name} - ${voice.description}`;
            this.elements.voiceSelect.appendChild(option);
        });
        
        // Sélectionner la voix par défaut
        this.elements.voiceSelect.value = this.config.voice;
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'fr-FR';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateStatus('listening', 'Écoute...');
                this.elements.voiceButton.classList.add('listening');
                this.elements.audioVisualizer.classList.add('active');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleUserInput(transcript, 'voice');
            };
            
            this.recognition.onerror = (event) => {
                this.handleSpeechError(event.error);
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.elements.voiceButton.classList.remove('listening');
                this.elements.audioVisualizer.classList.remove('active');
                if (!this.isProcessing) {
                    this.updateStatus('ready', 'Prêt');
                }
            };
        } else {
            this.showToast('error', 'Erreur', 'La reconnaissance vocale n\'est pas supportée par votre navigateur');
        }
    }

    bindEvents() {
        // Voice Controls
        this.elements.voiceButton.addEventListener('click', () => this.toggleVoiceRecording());
        this.elements.textInputButton.addEventListener('click', () => this.toggleTextInput());
        this.elements.clearChatButton.addEventListener('click', () => this.clearConversation());
        
        // Text Input
        this.elements.sendButton.addEventListener('click', () => this.sendTextMessage());
        this.elements.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendTextMessage();
            }
        });
        
        // Settings
        this.elements.toggleSettings.addEventListener('click', () => this.toggleSettings());
        this.elements.temperatureSlider.addEventListener('input', (e) => {
            this.elements.temperatureValue.textContent = e.target.value;
            this.config.temperature = parseFloat(e.target.value);
        });
        
        // Quick Prompts
        this.elements.quickPrompts.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-prompt-btn')) {
                this.selectQuickPrompt(e.target);
            }
        });
        
        // Settings Actions
        this.elements.saveSettingsButton.addEventListener('click', () => this.saveSettings());
        this.elements.exportButton.addEventListener('click', () => this.exportConversation());
        
        // Model and Voice Selection
        this.elements.modelSelect.addEventListener('change', (e) => {
            this.config.model = e.target.value;
            this.showToast('info', 'Modèle mis à jour', `Nouveau modèle: ${e.target.selectedOptions[0].text}`);
        });
        
        // TTS Model Selection
        this.elements.ttsModelSelect.addEventListener('change', (e) => {
            this.config.ttsModel = e.target.value;
            this.showToast('info', 'Modèle TTS mis à jour', `Nouveau modèle TTS: ${e.target.selectedOptions[0].text}`);
        });
        
        this.elements.voiceSelect.addEventListener('change', (e) => {
            this.config.voice = e.target.value;
            const selectedVoice = this.availableVoices.find(v => v.id === e.target.value);
            this.showToast('success', 'Voix mise à jour', `Nouvelle voix: ${selectedVoice.name}`);
        });
        
        // Test Voice Button
        this.elements.testVoiceButton.addEventListener('click', () => this.testSelectedVoice());
    }

    // Test Voice Functionality
    async testSelectedVoice() {
        const testMessage = `Bonjour ! Je suis ${this.config.voice}, votre nouvelle voix OpenAI TTS de Winwin Group. Comment trouvez-vous ma voix ?`;
        
        try {
            this.updateStatus('processing', 'Test de la voix...');
            this.showLoading('Test de la voix OpenAI TTS...');
            
            await this.speakTextWithOpenAI(testMessage);
            
            this.showToast('success', 'Test réussi', `Voix ${this.config.voice} testée avec succès`);
            
        } catch (error) {
            console.error('Erreur test de voix:', error);
            this.showToast('error', 'Erreur de test', 'Impossible de tester la voix sélectionnée');
        } finally {
            this.updateStatus('ready', 'Prêt');
            this.hideLoading();
        }
    }

    // Speech Recognition Methods
    toggleVoiceRecording() {
        if (!this.recognition) {
            this.showToast('error', 'Erreur', 'Reconnaissance vocale non disponible');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else if (!this.isProcessing) {
            try {
                this.recognition.start();
            } catch (error) {
                this.showToast('error', 'Erreur', 'Impossible de démarrer l\'enregistrement');
            }
        }
    }

    handleSpeechError(error) {
        this.isListening = false;
        this.elements.voiceButton.classList.remove('listening');
        this.elements.audioVisualizer.classList.remove('active');
        
        let message = 'Erreur de reconnaissance vocale';
        switch (error) {
            case 'not-allowed':
                message = 'Accès au microphone refusé. Veuillez autoriser l\'accès.';
                break;
            case 'no-speech':
                message = 'Aucune parole détectée. Réessayez.';
                break;
            case 'network':
                message = 'Erreur réseau. Vérifiez votre connexion.';
                break;
        }
        
        this.showToast('error', 'Erreur Vocale', message);
        this.updateStatus('ready', 'Prêt');
    }

    // Text Input Methods
    toggleTextInput() {
        const isVisible = !this.elements.textInputArea.classList.contains('hidden');
        this.elements.textInputArea.classList.toggle('hidden');
        
        if (!isVisible) {
            this.elements.textInput.focus();
        }
    }

    sendTextMessage() {
        const message = this.elements.textInput.value.trim();
        if (message && !this.isProcessing) {
            this.handleUserInput(message, 'text');
            this.elements.textInput.value = '';
        }
    }

    // Message Handling
    async handleUserInput(message, inputType) {
        if (this.isProcessing) return;
        
        // Add user message immediately
        this.addMessage('user', message, inputType);
        
        this.isProcessing = true;
        this.updateStatus('processing', 'Génération de la réponse...');
        this.showLoading('Génération de la réponse IA...');
        
        try {
            // Call OpenAI Chat API
            const response = await this.callOpenAI(message);
            this.addMessage('assistant', response, 'text');
            
            // Use OpenAI TTS for speech synthesis
            this.updateStatus('processing', 'Synthèse vocale...');
            this.showLoading('Génération de la voix naturelle...');
            
            await this.speakTextWithOpenAI(response);
            
            this.showToast('success', 'Réponse complète', 'Réponse générée et vocalisée avec succès');
            this.updateAPIStatus('chat', 'ready');
            this.updateAPIStatus('tts', 'ready');
            
        } catch (error) {
            console.error('Erreur:', error);
            
            // Update API status based on error
            if (error.message.includes('Chat')) {
                this.updateAPIStatus('chat', 'error');
            }
            if (error.message.includes('TTS')) {
                this.updateAPIStatus('tts', 'error');
            }
            
            // Fallback response
            const fallbackResponse = await this.generateFallbackResponse(message);
            this.addMessage('assistant', fallbackResponse, 'text');
            
            // Try TTS even for fallback
            try {
                await this.speakTextWithOpenAI(fallbackResponse);
                this.updateAPIStatus('tts', 'ready');
            } catch (ttsError) {
                console.error('Erreur TTS:', ttsError);
                this.updateAPIStatus('tts', 'error');
                this.showToast('warning', 'TTS indisponible', 'Réponse affichée sans synthèse vocale');
            }
            
            this.showToast('warning', 'Mode dégradé', 'Utilisation d\'une réponse de démonstration');
            
        } finally {
            this.isProcessing = false;
            this.updateStatus('ready', 'Prêt');
            this.hideLoading();
        }
    }

    // API Status Management
    updateAPIStatus(apiType, status) {
        const statusElement = apiType === 'chat' ? this.elements.chatApiStatus : this.elements.ttsApiStatus;
        if (statusElement) {
            statusElement.className = `status-value ${status}`;
            switch (status) {
                case 'ready':
                    statusElement.textContent = 'Prêt';
                    break;
                case 'error':
                    statusElement.textContent = 'Erreur';
                    break;
                case 'warning':
                    statusElement.textContent = 'Limité';
                    break;
            }
        }
    }

    // OpenAI Chat API Integration
    async callOpenAI(userMessage) {
        const messages = [
            {
                role: 'system',
                content: this.config.systemPrompt
            },
            ...this.conversation.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            {
                role: 'user',
                content: userMessage
            }
        ];

        const requestBody = {
            model: this.config.model,
            messages: messages,
            temperature: this.config.temperature,
            max_tokens: 1000
        };

        const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
            throw new Error(`Erreur API OpenAI Chat: ${errorMessage}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Format de réponse invalide de l\'API OpenAI');
        }

        return data.choices[0].message.content.trim();
    }

    // OpenAI Text-to-Speech Integration - VRAIE API TTS
    async speakTextWithOpenAI(text) {
        try {
            // Arrêter toute lecture audio en cours
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }

            const requestBody = {
                model: this.config.ttsModel,
                input: text,
                voice: this.config.voice,
                response_format: 'mp3',
                speed: 1.0
            };

            const response = await fetch(`${this.openaiBaseUrl}/audio/speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiApiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur API OpenAI TTS: ${response.status} - ${errorText}`);
            }

            // Récupérer le blob audio
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // Créer et jouer l'audio
            return new Promise((resolve, reject) => {
                this.currentAudio = new Audio(audioUrl);
                
                this.currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    resolve();
                };
                
                this.currentAudio.onerror = (error) => {
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    reject(new Error('Erreur de lecture audio'));
                };
                
                this.currentAudio.play().catch(reject);
            });
            
        } catch (error) {
            console.error('Erreur OpenAI TTS:', error);
            throw error;
        }
    }

    // Fallback response generation
    async generateFallbackResponse(userMessage) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const responses = [
            `Merci pour votre message "${userMessage}". En tant qu'assistant Winwin Group, je confirme que notre équipe examine votre demande avec attention. Nos experts sont à votre disposition pour vous accompagner.`,
            `Je comprends votre question concernant "${userMessage}". Chez Winwin Group, nous nous engageons à vous fournir les meilleures solutions adaptées à vos besoins spécifiques.`,
            `Votre demande "${userMessage}" est très intéressante. Permettez-moi de vous proposer quelques pistes de réflexion basées sur l'expertise Winwin Group et notre expérience du marché.`,
            `Concernant "${userMessage}", je peux vous assurer que Winwin Group dispose de l'expertise et des ressources nécessaires pour vous accompagner efficacement dans cette démarche.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Message Display
    addMessage(role, content, inputType) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const timestamp = new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'timestamp';
        timestampSpan.textContent = timestamp;
        
        metaDiv.appendChild(timestampSpan);
        
        // Add play button for assistant messages avec OpenAI TTS
        if (role === 'assistant') {
            const playButton = document.createElement('button');
            playButton.className = 'play-button';
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            playButton.title = `Réécouter avec la voix ${this.config.voice}`;
            playButton.addEventListener('click', async () => {
                try {
                    this.updateStatus('processing', 'Lecture audio...');
                    await this.speakTextWithOpenAI(content);
                    this.updateStatus('ready', 'Prêt');
                } catch (error) {
                    this.showToast('error', 'Erreur Audio', 'Impossible de lire le message');
                    this.updateStatus('ready', 'Prêt');
                }
            });
            metaDiv.appendChild(playButton);
        }
        
        bubbleDiv.appendChild(contentDiv);
        bubbleDiv.appendChild(metaDiv);
        messageDiv.appendChild(bubbleDiv);
        
        // Remove welcome message if present
        const welcomeMessage = this.elements.conversationArea.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.elements.conversationArea.appendChild(messageDiv);
        this.elements.conversationArea.scrollTop = this.elements.conversationArea.scrollHeight;
        
        // Store in conversation history
        this.conversation.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            inputType: inputType
        });
    }

    // Settings Management
    toggleSettings() {
        const isCollapsed = this.elements.settingsContent.classList.contains('collapsed');
        this.elements.settingsContent.classList.toggle('collapsed');
        
        const icon = this.elements.toggleSettings.querySelector('i');
        icon.className = isCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }

    selectQuickPrompt(button) {
        // Remove active class from all buttons
        this.elements.quickPrompts.querySelectorAll('.quick-prompt-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected button
        button.classList.add('active');
        
        // Set the system prompt
        const promptKey = button.dataset.prompt;
        const promptText = this.quickPrompts[promptKey];
        
        if (promptText) {
            this.elements.systemPrompt.value = promptText;
            this.config.systemPrompt = promptText;
            this.showToast('success', 'Prompt Appliqué', `Mode ${button.textContent.trim()} activé`);
        }
    }

    saveSettings() {
        this.config.model = this.elements.modelSelect.value;
        this.config.ttsModel = this.elements.ttsModelSelect.value;
        this.config.voice = this.elements.voiceSelect.value;
        this.config.temperature = parseFloat(this.elements.temperatureSlider.value);
        this.config.systemPrompt = this.elements.systemPrompt.value || this.config.systemPrompt;
        
        const selectedVoice = this.availableVoices.find(v => v.id === this.config.voice);
        this.showToast('success', 'Paramètres Sauvegardés', 
            `Configuration mise à jour - Voix: ${selectedVoice?.name || this.config.voice}`);
    }

    loadSettings() {
        // Apply default settings to UI
        this.elements.modelSelect.value = this.config.model;
        this.elements.ttsModelSelect.value = this.config.ttsModel;
        this.elements.voiceSelect.value = this.config.voice;
        this.elements.temperatureSlider.value = this.config.temperature;
        this.elements.temperatureValue.textContent = this.config.temperature;
        this.elements.systemPrompt.value = this.config.systemPrompt;
    }

    // Conversation Management
    clearConversation() {
        if (this.conversation.length === 0) {
            this.showToast('info', 'Conversation Vide', 'Aucune conversation à effacer');
            return;
        }
        
        if (confirm('Êtes-vous sûr de vouloir effacer la conversation ?')) {
            this.conversation = [];
            
            // Arrêter toute lecture audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            
            this.elements.conversationArea.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h2>Conversation effacée</h2>
                    <p>Prêt pour une nouvelle conversation avec voix OpenAI TTS !</p>
                    <div class="feature-highlight">
                        <div class="feature-item">
                            <i class="fas fa-microphone-alt"></i>
                            <span>Reconnaissance vocale</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-volume-up"></i>
                            <span>11 voix OpenAI naturelles</span>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-brain"></i>
                            <span>Intelligence GPT-4o</span>
                        </div>
                    </div>
                </div>
            `;
            this.showToast('info', 'Conversation Effacée', 'Historique supprimé avec succès');
        }
    }

    exportConversation() {
        if (this.conversation.length === 0) {
            this.showToast('warning', 'Aucune Conversation', 'Rien à exporter');
            return;
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            config: this.config,
            ttsVoice: this.config.voice,
            availableVoices: this.availableVoices,
            conversation: this.conversation
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `winwin-conversation-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('success', 'Export Réussi', 'Conversation téléchargée avec métadonnées TTS');
    }

    // UI Helpers
    updateStatus(type, text) {
        this.elements.statusDot.className = `status-dot ${type}`;
        this.elements.statusText.textContent = text;
    }

    showLoading(text = 'Chargement...') {
        this.elements.loadingText.textContent = text;
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    showToast(type, title, message, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            toast.remove();
        });
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.winwinBot = new WinwinVoiceBot();
});