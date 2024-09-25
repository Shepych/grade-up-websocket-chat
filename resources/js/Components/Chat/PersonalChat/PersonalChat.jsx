import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './PersonalChat.module.css';

export default function PersonalChat({ chatId }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true); // Лоадер
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [userId, setUserId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        const text = newMessage;

        // Отправляем новое сообщение на сервер
        axios.post(`/chats/${chatId}/send_message`, { content: text })
            .then(response => {
                // Добавляем новое сообщение в список сообщений
                setNewMessage(''); // Очищаем поле ввода
                socket.send(JSON.stringify({ type: 'sendMessage', chat_id: chatId, user_id: response.data.user_id, content: text, message_id: response.data.id }));
                socket.send(JSON.stringify({ type: 'chatUpdate', chat_id: chatId, user_id: response.data.address_id, address_id: userId, content: text }));
            })
            .catch(error => {
                console.error('Ошибка при отправке сообщения:', error);
            });
    };

    useEffect(() => {
        setLoading(true); // Включаем лоадер

        // Получаем сообщения с бэка при первой загрузке
        axios.get(`/chats/${chatId}/messages`)
            .then(response => {
                setMessages(response.data.messages); // Сохраняем сообщения в состояние
                setLoading(false); // Отключаем лоадер после получения данных
                setUserId(response.data.user_id);
            })
            .catch(error => {
                console.error('Ошибка при загрузке сообщений:', error);
                setLoading(false); // Отключаем лоадер даже при ошибке
            });

        // Устанавливаем подключение к сокету только при монтировании компонента
        const newSocket = new WebSocket('ws://localhost:8888');

        // При установлении соединения
        newSocket.onopen = function () {
            console.log('Соединение установлено');
            // Отправляем данные о присоединении к чату
            newSocket.send(JSON.stringify({ type: 'joinChat', chat_id: chatId }));
        };

        // Обрабатываем входящие сообщения
        newSocket.onmessage = function (event) {
            const message = JSON.parse(event.data);

            if (message.type === 'newMessage') {
                // Добавляем новое сообщение от другого пользователя
                setMessages(prevMessages => [...prevMessages, message]);
            }

            if (message.type === 'deleteMessage') {
                // Удаляем сообщение из стейта
                setMessages(prevMessages => prevMessages.filter(msg => msg.id !== message.message_id));
            }
        };

        // Сохраняем сокет в состояние, чтобы можно было использовать его для дальнейшего управления
        setSocket(newSocket);

        // Функция очистки при размонтировании компонента
        return () => {
            if (newSocket.readyState === WebSocket.OPEN) {
                newSocket.send(JSON.stringify({ type: 'leaveChat', chat_id: chatId }));
                newSocket.close(); // Закрываем соединение при размонтировании
                console.log('Соединение закрыто');
            }
        };
    }, [chatId]);

    const handleMessageDelete = (messageId) => {
        // Удалить из стейта
        axios.get(`/message/delete/${messageId}`)
            .then(response => {
                setMessages(prevMessages => prevMessages.filter(message => message.id !== messageId));
                socket.send(JSON.stringify({ type: 'deleteMessage', chat_id: chatId, message_id: messageId }));
            })
            .catch(error => {
                console.error('Ошибка при отправке сообщения:', error);
            });
    };

    return (
        <div className="flex justify-between w-full flex-col h-full">
            <div className={`${styles['chat__wrapper']}`}>
                {loading ? ( // Показываем лоадер пока данные загружаются
                    <div className="loader"></div>
                ) : messages.length > 0 ? ( // Если сообщения есть
                    messages.map((message, index) => (
                        <div
                            key={message.id || index} // Используем уникальный идентификатор сообщения или индекс
                            className={`${styles['message']} ${message.user_id !== userId ? 'self-end' : ''}`}
                        >
                            <span className={styles['sender__message']}>{message.user_id}</span>
                            {message.content}
                            {(message.user_id !== userId) ? '' : <div className="flex"><span onClick={() => handleMessageDelete(message.id || index)} className={styles['delete__button']}>Удалить</span></div>}
                        </div>
                    ))
                ) : (
                    <p>Сообщений пока нет</p> // Если нет сообщений
                )}
            </div>

            <div className={styles['footer']}>
                <form className={`${styles['form__send-message']}`} onSubmit={handleSubmit}>
                    <input
                        placeholder="Написать сообщение..."
                        className={styles['form__input-text']}
                        type="text"
                        name="content"
                        value={newMessage} // Управляем значением поля
                        onChange={(e) => setNewMessage(e.target.value)} // Обрабатываем изменение текста
                    />

                    <button className="samolet-icon">
                        <i className="fas fa-paper-plane text-2xl"></i>
                    </button>
                </form>
            </div>
        </div>
    );
}
