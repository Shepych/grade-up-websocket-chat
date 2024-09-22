import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import {useEffect, useState} from 'react';
import PrimaryButton from '/resources/js/Components/PrimaryButton.jsx';
import ChatsList from '/resources/js/Components/Chat/ChatsList/ChatsList.jsx';
import PersonalChat from '/resources/js/Components/Chat/PersonalChat/PersonalChat.jsx';
import axios from "axios";
import './Dashboard.css'

export default function Dashboard() {
    // Настраиваем управление формой через useForm
    const { data, setData, post, errors } = useForm({
        user: '',
    });

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // Состояние для управления рендерингом компонента после отправки формы
    const [showComponent, setShowComponent] = useState(false);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null); // Состояние для выбранного чата
    const [users, setUsers] = useState([]);

    // Функция для обработки выбора чата
    const handleChatSelect = (chatId) => {
        setSelectedChat(chatId); // Устанавливаем выбранный чат
    };

    // Обработчик изменения полей формы
    const handleChange = (e) => {
        setData(e.target.name, e.target.value);
    };

    // Обработчик отправки формы
    const handleSubmit = async (e) => { // Добавляем async
        e.preventDefault();

        try {
            // Отправляем данные на сервер с помощью fetch
            const response = await fetch('/chats/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,  // Добавляем CSRF-токен в заголовки
                },
                body: JSON.stringify({ user: data.user }),  // Отправляем выбранного пользователя
            });

            if (response.ok) {

                const newChat = await response.json();
                // console.log('Чат успешно создан', newChat);
                console.log(newChat)
                setChats((prevChats) => [...prevChats, newChat]);

                // Устанавливаем состояние, чтобы отобразить компонент после отправки
                setShowComponent(true);
            } else {
                console.error('Ошибка при создании чата');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
        }
    };

    useEffect(() => {
        console.log("Чаты обновлены:", chats);
    }, [chats]);

    useEffect(() => {
        axios.get('/users/list').then(response => {
            setUsers(response.data); // Заносим данные пользователя в состояние
        }).catch(error => {
            console.error('Ошибка при получении списка пользователей: ', error);
        });
    }, [])

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="chat__background overflow-hidden shadow-sm sm:rounded-lg flex">
                        <div className="chats__list text-gray-900">
                            <form className="users__selector-form" onSubmit={handleSubmit}>
                                <select className="users__selector" name="user" onChange={handleChange}>
                                    <option value="">Выберите пользователя</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>

                                <PrimaryButton>Создать чат</PrimaryButton>
                            </form>

                            <ChatsList onSelectChat={handleChatSelect} chats={chats} />
                        </div>

                        {selectedChat ? (
                            <PersonalChat chatId={selectedChat} />
                            ) : (
                                <p className="select__chat-message">Выберите чат для начала общения</p> // Выводим сообщение, если чат не выбран
                            )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
