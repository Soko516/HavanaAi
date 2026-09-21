const promptInput = document.querySelector('#prompt');
const composer = document.querySelector('#composer');
const messages = document.querySelector('#messages');
const welcome = document.querySelector('#welcome');
const newChat = document.querySelector('#newChat');

const replies = [
  "I’m ready to help. Tell me a little more about what you’d like to make, and we’ll shape it together.",
  "That’s a great direction. I can help you break it into clear, practical next steps.",
  "Let’s explore that. Start with your goal, and I’ll help turn the idea into an actionable plan."
];

function addMessage(text, role) {
  welcome.classList.add('hidden');
  messages.classList.add('has-messages');
  const item = document.createElement('div');
  item.className = `message ${role}`;
  item.innerHTML = `<div class="bubble"><span class="message-label">${role === 'user' ? 'YOU' : 'HAVANAAI'}</span>${text.replace(/</g, '&lt;')}</div>`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

function sendMessage(text) {
  const clean = text.trim();
  if (!clean) return;
  addMessage(clean, 'user');
  promptInput.value = '';
  promptInput.style.height = 'auto';
  setTimeout(() => addMessage(replies[Math.floor(Math.random() * replies.length)], 'assistant'), 450);
}

composer.addEventListener('submit', (event) => { event.preventDefault(); sendMessage(promptInput.value); });
promptInput.addEventListener('input', () => { promptInput.style.height = 'auto'; promptInput.style.height = `${Math.min(promptInput.scrollHeight, 120)}px`; });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.prompt)));
newChat.addEventListener('click', () => { messages.innerHTML = ''; messages.classList.remove('has-messages'); welcome.classList.remove('hidden'); promptInput.focus(); });
