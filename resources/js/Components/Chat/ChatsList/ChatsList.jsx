import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import styles from './ChatList.module.css';

export default function ChatsList({ chats: initialChats, onSelectChat }) {
    const [chats, setChats] = useState(initialChats);
    const [loading, setLoading] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null); // Выбранный чат
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);
    const chatRefs = useRef([]);

    useEffect(() => {
        // Получаем данные пользователя при монтировании компонента
        axios.get('/user').then((response) => {
            setUser(response.data); // Заносим данные пользователя в состояние
        }).catch((error) => {
            console.error('Ошибка при получении данных о пользователе:', error);
        });
    }, []); // Пустой массив зависимостей означает, что запрос выполнится один раз при монтировании

    useEffect(() => {
        if (user) {
            // Устанавливаем подключение к сокету только при монтировании компонента
            const newSocket = new WebSocket('ws://localhost:8888');

            // При установлении соединения
            newSocket.onopen = function () {
                console.log('Соединение для прослушки списка чатов');
                // Отправляем данные о присоединении к чату
                newSocket.send(JSON.stringify({ type: 'listenChatsList', user_id: user.id }));
            };

            // Обрабатываем входящие сообщения
            newSocket.onmessage = function (event) {
                const message = JSON.parse(event.data);

                if (message.type === 'chatUpdate') {
                    setChats((prevChats) => {
                        const chatExists = prevChats.some((chat) => chat.id === message.chat_id);

                        if (chatExists) {
                            return prevChats.map((chat) =>
                                chat.id === message.chat_id ? { ...chat, viewed: 0 } : chat
                            );
                        } else {
                            // Если чата нет, добавляем его в массив
                            return [...prevChats, { id: message.chat_id, ...message.data }];
                        }
                    });
                }
            };

            // Чистим соединение при размонтировании компонента
            return () => newSocket.close();
        }
    }, [user]);

    // Функция для выбора чата
    const handleChatSelect = (e, chatId) => {
        setSelectedChat(chatId); // Устанавливаем выбранный чат локально
        onSelectChat(chatId); // Передаем выбранный чат в родительский компонент через onSelectChat

        // Убираем стиль и обновляем состояние чата, чтобы React перерендерил компонент
        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.id === chatId ? { ...chat, viewed: 1 } : chat
            )
        );
    };

    // Этот эффект обновляет локальное состояние, если initialChats изменились
    useEffect(() => {
        setChats((prevChats) => {
            // Добавляем новые чаты, которые не присутствуют в предыдущем состоянии
            const newChats = initialChats.filter(
                (newChat) => !prevChats.some((chat) => chat.id === newChat.id)
            );
            return [...prevChats, ...newChats];
        });
    }, [initialChats]);

    useEffect(() => {
        // Если чаты уже переданы, не делаем запрос
        if (!initialChats.length) {
            setLoading(true);
            axios
                .get('/chats/get')
                .then((response) => {
                    setChats(response.data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error('Ошибка при получении чатов:', error);
                    setLoading(false);
                });
        }
    }, [initialChats]);

    return (
        <div>
            {loading ? (
                <div className="loader"></div> // Лоадер при загрузке данных
            ) : chats.length > 0 ? (
                <div className={`flex flex-col items-start`}>
                    {chats.map((chat) => (
                        <button
                            onClick={(e) => handleChatSelect(e, chat.id)}
                            className={`${chat.viewed === 0 ? styles['chat__not-viewed'] : ''} select__chat-button p-4 ${styles['chat__row']}`}
                            key={chat.id}
                        >
                            {chat.name || `Чат #${chat.id}`}
                        </button>
                    ))}
                </div>
            ) : (
                <p>Чатов нет</p>
            )}
        </div>
    );
}
