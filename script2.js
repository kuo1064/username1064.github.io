// Базовый фильтр матов
const badWords = ['блять', 'нацист', 'пиздец', 'иди нахуй', 'идинахуй', 'негр','иди на хуй'];

// Инициализация localStorage
if (!localStorage.getItem('retroChatMessages')) {
    localStorage.setItem('retroChatMessages', JSON.stringify([]));
}

if (!localStorage.getItem('retroChatUsers')) {
    localStorage.setItem('retroChatUsers', JSON.stringify([]));
}

// Текущий пользователь
let currentUser = 'Гость_' + Math.floor(Math.random() * 1000);
document.getElementById('usernameInput').value = currentUser;

// Обновление времени
function updateTime() {
    const now = new Date();
    const timestamp = `[${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
    document.getElementById('currentTime').textContent = timestamp;
    
    // Проверяем старые сообщения каждую минуту
    if (now.getSeconds() === 0) {
        checkOldMessages();
    }
}

setInterval(updateTime, 1000);
updateTime();

// Проверка и удаление старых сообщений
function checkOldMessages() {
    const now = new Date();
    const messages = JSON.parse(localStorage.getItem('retroChatMessages')) || [];
    const tenMinutesAgo = now.getTime() - 10 * 60 * 1000;
    
    const freshMessages = messages.filter(msg => {
        const msgDateStr = msg.timestamp.replace('[', '').replace(']', '');
        const msgParts = msgDateStr.split(/[- :]/);
        const msgDate = new Date(
            parseInt(msgParts[0]),
            parseInt(msgParts[1])-1,
            parseInt(msgParts[2]),
            parseInt(msgParts[3]),
            parseInt(msgParts[4]),
            parseInt(msgParts[5])
        );
        return msgDate.getTime() > tenMinutesAgo;
    });
    
    if (freshMessages.length < messages.length) {
        localStorage.setItem('retroChatMessages', JSON.stringify(freshMessages));
        loadMessages();
        addSystemMessage('Старые сообщения были автоматически удалены');
    }
}

// Загрузка сообщений
function loadMessages() {
    const messages = JSON.parse(localStorage.getItem('retroChatMessages')) || [];
    const chat = document.getElementById('chatMessages');
    
    // Очищаем только системные сообщения
    const systemMessages = chat.querySelectorAll('.system-message');
    chat.innerHTML = '';
    systemMessages.forEach(msg => chat.appendChild(msg));
    
    // Добавляем сохраненные сообщения
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <span class="timestamp">${msg.timestamp}</span>
            <span class="username">${msg.username}:</span>
            <span class="message-text">${msg.text}</span>
        `;
        chat.appendChild(messageElement);
    });
    
    document.getElementById('totalMessages').textContent = messages.length;
    scrollToBottom();
}

// Управление онлайн пользователями
function updateOnlineUsers() {
    let users = JSON.parse(localStorage.getItem('retroChatUsers')) || [];
    
    // Добавляем текущего пользователя
    if (!users.includes(currentUser)) {
        users.push(currentUser);
        localStorage.setItem('retroChatUsers', JSON.stringify(users));
    }
    
    // Удаляем неактивных пользователей (старше 5 минут)
    const activeUsers = users.filter(user => {
        return user === currentUser;
    });
    
    localStorage.setItem('retroChatUsers', JSON.stringify(activeUsers));
    
    // Отображаем онлайн пользователей
    const onlineUsersList = document.getElementById('onlineUsersList');
    const userCount = document.getElementById('userCount');
    
    if (activeUsers.length > 3) {
        onlineUsersList.textContent = `${activeUsers.length} пользователей`;
    } else {
        onlineUsersList.textContent = activeUsers.join(', ');
    }
    
    userCount.textContent = activeUsers.length;
}

// Функция отправки сообщения
function sendMessage() {
    const usernameInput = document.getElementById('usernameInput');
    const messageInput = document.getElementById('messageInput');
    
    currentUser = usernameInput.value.trim() || 'Аноним';
    const message = messageInput.value.trim();
    
    if (message === '') return;
    
    // Проверка на мат
    const hasBadWord = badWords.some(word => 
        message.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasBadWord) {
        addSystemMessage('Использование запрещенных слов недопустимо!');
        messageInput.value = '';
        return;
    }
    
    // Сохраняем сообщение
    const now = new Date();
    const timestamp = `[${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
    
    const messages = JSON.parse(localStorage.getItem('retroChatMessages')) || [];
    messages.push({
        username: currentUser,
        text: message,
        timestamp: timestamp,
        time: now.getTime()
    });
    
    // Ограничиваем историю 100 сообщениями
    if (messages.length > 100) {
        messages.shift();
    }
    
    localStorage.setItem('retroChatMessages', JSON.stringify(messages));
    
    // Обновляем интерфейс
    loadMessages();
    messageInput.value = '';
    updateOnlineUsers();
}

// Добавление системного сообщения
function addSystemMessage(message) {
    const now = new Date();
    const timestamp = `[${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'system-message';
    messageElement.innerHTML = `
        <span class="timestamp">${timestamp}</span>
        <span>● СИСТЕМА: ${message}</span>
    `;
    
    document.getElementById('chatMessages').appendChild(messageElement);
    scrollToBottom();
}

// Вспомогательные функции
function pad(num) {
    return num.toString().padStart(2, '0');
}

function scrollToBottom() {
    const chat = document.getElementById('chatMessages');
    chat.scrollTop = chat.scrollHeight;
}

// Обработчики событий
document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

document.getElementById('usernameInput').addEventListener('change', function() {
    currentUser = this.value.trim() || 'Аноним';
    updateOnlineUsers();
});

// Инициализация
loadMessages();
updateOnlineUsers();

// Проверка старых сообщений при загрузке
checkOldMessages();

// Проверка старых сообщений каждую минуту
setInterval(checkOldMessages, 60000);

// Пример сообщений при загрузке
setTimeout(() => {
    addSystemMessage('Чат запущен в тестовом режиме');
    
}, 1000);
// Анимация текста в пузыре


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    changeSpeechBubble();
});

// Анимация текста в пузыре
const phrases = [
    "Привет!",
    "Как дела?",
    "Пиши мне!",
    "Круто!",
    "Ого!",
    "Ага!",
    "Ух ты!",
    "Ха-ха!",
    "80-е рулят!",
    "Респект!",
    "Йоу!",
    "Чик-чирик!"
];

function changeSpeechBubble() {
    const bubble = document.querySelector('.speech-bubble');
    const randomIndex = Math.floor(Math.random() * phrases.length);
    const randomPhrase = phrases[randomIndex];
    
    // Анимация исчезновения
    bubble.style.opacity = '0';
    
    setTimeout(() => {
        bubble.textContent = randomPhrase;
        // Анимация появления
        bubble.style.opacity = '1';
    }, 300);
}

// Меняем фразу каждые 3 секунды
setInterval(changeSpeechBubble, 3000);
// Меню при клике на персонажа
const menuTrigger = document.getElementById('menuTrigger');
const dropdownMenu = document.getElementById('dropdownMenu');
let menuTimeout;

menuTrigger.addEventListener('click', function() {
    // Отменяем предыдущий таймер закрытия
    clearTimeout(menuTimeout);
    
    // Переключаем видимость меню
    dropdownMenu.classList.toggle('show');
    
    // Если меню видимо, устанавливаем таймер закрытия
    if (dropdownMenu.classList.contains('show')) {
        menuTimeout = setTimeout(() => {
            dropdownMenu.classList.remove('show');
        }, 60000); // Закрыть через 60 секунд
    }
});

// Закрытие меню при клике вне его
document.addEventListener('click', function(event) {
    if (!menuTrigger.contains(event.target)) {
        dropdownMenu.classList.remove('show');
        clearTimeout(menuTimeout);
    }
});

