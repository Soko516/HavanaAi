const STORAGE_KEY = 'havana-ai-conversation';
const AGE_KEY = 'havana-ai-18-confirmed';
const promptInput = document.querySelector('#prompt');
const composer = document.querySelector('#composer');
const messages = document.querySelector('#messages');
const welcome = document.querySelector('#welcome');
const toast = document.querySelector('#toast');
const ageGate = document.querySelector('#ageGate');
const app = document.querySelector('#app');
const ageCheck = document.querySelector('#ageCheck');
const enterButton = document.querySelector('#enterButton');
const uploadDialog = document.querySelector('#uploadDialog');
const uploadCheck = document.querySelector('#uploadCheck');
const chooseVideo = document.querySelector('#chooseVideo');
const videoInput = document.querySelector('#videoInput');

const replies = ['I’m ready to help. Tell me a little more about what you’d like to make, and we’ll shape it together.','That’s a great direction. I can help you break it into clear, practical next steps.','Let’s explore that. Start with your goal, and I’ll help turn the idea into an actionable plan.'];
function escapeHtml(value) { return value.replace(/[&<>"']/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[character])); }
function showToast(message) { toast.textContent = message; toast.classList.add('visible'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2600); }
function saveConversation() { localStorage.setItem(STORAGE_KEY, messages.innerHTML); }
function addMessage(text, role, persist = true) { welcome.classList.add('hidden'); messages.classList.add('has-messages'); const item = document.createElement('div'); item.className = `message ${role}`; item.innerHTML = `<div class="bubble"><span class="message-label">${role === 'user' ? 'YOU' : 'HAVANAAI'}</span>${escapeHtml(text).replace(/\n/g, '<br>')}</div>`; messages.appendChild(item); messages.scrollTop = messages.scrollHeight; if (persist) saveConversation(); }
function sendMessage(text) { const clean = text.trim(); if (!clean) return; addMessage(clean, 'user'); promptInput.value = ''; promptInput.style.height = 'auto'; promptInput.focus(); setTimeout(() => addMessage(replies[Math.floor(Math.random() * replies.length)], 'assistant'), 450); }
function clearConversation(notify = true) { messages.replaceChildren(); messages.classList.remove('has-messages'); welcome.classList.remove('hidden'); localStorage.removeItem(STORAGE_KEY); if (notify) showToast('Conversation cleared'); }
function openUpload() { uploadDialog.hidden = false; uploadCheck.checked = false; chooseVideo.disabled = true; }
function closeUpload() { uploadDialog.hidden = true; }
function enterApp() { localStorage.setItem(AGE_KEY, 'true'); ageGate.remove(); app.hidden = false; promptInput.focus(); }

ageCheck.addEventListener('change', () => { enterButton.disabled = !ageCheck.checked; });
enterButton.addEventListener('click', enterApp);
if (localStorage.getItem(AGE_KEY) === 'true') { ageGate.remove(); app.hidden = false; } else { app.hidden = true; }
composer.addEventListener('submit', event => { event.preventDefault(); sendMessage(promptInput.value); });
promptInput.addEventListener('input', () => { promptInput.style.height = 'auto'; promptInput.style.height = `${Math.min(promptInput.scrollHeight, 120)}px`; });
promptInput.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); composer.requestSubmit(); } });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.prompt)));
document.querySelector('#newChat').addEventListener('click', () => { clearConversation(false); promptInput.focus(); });
document.querySelector('#clearChat').addEventListener('click', () => { if (messages.children.length) clearConversation(); });
document.querySelector('#uploadButton').addEventListener('click', openUpload);
document.querySelector('#closeUpload').addEventListener('click', closeUpload);
uploadCheck.addEventListener('change', () => { chooseVideo.disabled = !uploadCheck.checked; });
chooseVideo.addEventListener('click', () => videoInput.click());
videoInput.addEventListener('change', () => { const file = videoInput.files[0]; if (!file) return; if (!file.type.startsWith('video/')) { showToast('Please choose a video file'); return; } if (file.size > 500 * 1024 * 1024) { showToast('Video must be smaller than 500 MB'); return; } closeUpload(); showToast(`Selected: ${file.name} — demo only, not uploaded`); videoInput.value = ''; });
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-view]').forEach(item => item.classList.remove('active')); button.classList.add('active'); if (button.dataset.view !== 'chat') showToast(`${button.textContent.trim()} is coming soon`); }));
const saved = localStorage.getItem(STORAGE_KEY); if (saved) { messages.innerHTML = saved; messages.classList.add('has-messages'); welcome.classList.add('hidden'); }
