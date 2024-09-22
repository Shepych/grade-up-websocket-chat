<?php
use Workerman\Worker;
use Workerman\WebServer;
use Workerman\Connection\TcpConnection;

require_once __DIR__ . '/vendor/autoload.php';


$chatConnections = []; // Массив для хранения подключений по чатам
$listConnections = []; // Массив для хранения подключений по списку чатов

// Создаем новый WebSocket-сервер
$ws_worker = new Worker("websocket://0.0.0.0:8888");

// Событие при установке соединения
$ws_worker->onConnect = function(TcpConnection $connection) use (&$chatConnections, &$listConnections) {
    echo "Новое соединение\n";
};

// Событие при получении сообщения
$ws_worker->onMessage = function(TcpConnection $connection, $data) use (&$chatConnections, &$listConnections) {
    $messageData = json_decode($data, true);

    // Обработка присоединения к чату
    if (isset($messageData['type']) && $messageData['type'] == 'joinChat') {
        $chatId = $messageData['chat_id'];

        // Проверяем, есть ли этот чат в массиве подключений
        if (!isset($chatConnections[$chatId])) {
            $chatConnections[$chatId] = [];
        }

        // Добавляем соединение в список подключений к чату, если оно ещё не добавлено
        if (!isset($chatConnections[$chatId][$connection->id])) {
            $chatConnections[$chatId][$connection->id] = $connection;
            echo "Пользователь присоединился к чату $chatId\n";
        }
    }
    if (isset($messageData['type']) && $messageData['type'] == 'sendMessage') {
        $chatId = $messageData['chat_id'];

        // Проверяем, есть ли этот чат в массиве подключений
        if (!isset($chatConnections[$chatId])) {
            $chatConnections[$chatId] = [];
        }

        // Добавляем соединение в список подключений к чату, если оно ещё не добавлено
        if (!isset($chatConnections[$chatId][$connection->id])) {
            $chatConnections[$chatId][$connection->id] = $connection;
            echo "Пользователь присоединился к чату $chatId\n";
        }

        // Обработка сообщения
        if (isset($messageData['content'])) {
            $message = $messageData['content'];
            $userId = $messageData['user_id'];
            $messageId = $messageData['message_id'];
            echo "Новое сообщение в чате $chatId: $message\n";

            // Запрос в бд на
            // Рассылаем сообщение всем пользователям в этом чате
            foreach ($chatConnections[$chatId] as $conn) {
                $conn->send(json_encode([
                    'type' => 'newMessage',
                    'id' => $messageId,
                    'chat_id' => $chatId,
                    'content' => $message,
                    'user_id' => $userId
                ]));
            }
        }

        // Отправляем ответ клиенту
        $connection->send(json_encode(['status' => 'success', 'chat_id' => $chatId]));
    }
    if (isset($messageData['type']) && $messageData['type'] == 'listenChatsList') {
        $userId = $messageData['user_id'];

        if (!isset($listConnections[$userId])) {
            $listConnections[$userId] = [];
        }

        if (!isset($listConnections[$userId][$connection->id])) {
            $listConnections[$userId][$connection->id] = $connection;
            echo "Пользователь ID: $userId слушает свои чаты \n";
        }
    }
    if (isset($messageData['type']) && $messageData['type'] == 'chatUpdate') {
        $userId = $messageData['user_id'];
        $chatId = $messageData['chat_id'];
        $addressUserId = $messageData['address_id'];

        $sqlConnect = mysqli_connect('grade_mysql', 'grade_user', 'grade_user_password', 'grade_database');

        if (!$sqlConnect) {
            die("Connection failed: " . mysqli_connect_error());
        }

        // Получаем информацию о пользователе
        $userQuery = "SELECT id, name FROM users WHERE id = " . intval($addressUserId);
        $result = mysqli_query($sqlConnect, $userQuery);

        if ($result && mysqli_num_rows($result) > 0) {
            $user = mysqli_fetch_assoc($result); // Получаем данные о пользователе
            echo "Обновился чат ID: $chatId для Юзера $userId (" . $user['name'] . ")\n";

            foreach ($listConnections[$userId] as $conn) {
                $conn->send(json_encode([
                    'type' => 'chatUpdate',
                    'chat_id' => $chatId,
                    'user' => [
                        'id' => $user['id'],
                        'name' => $user['name']
                    ]
                ]));
            }
        } else {
            echo "Пользователь не найден для ID: $userId\n";
        }
    }
    if (isset($messageData['type']) && $messageData['type'] == 'deleteMessage') {
        $chatId = $messageData['chat_id'];
        $messageId = $messageData['message_id'];

        // Удалить сообщение пользователя
        foreach ($chatConnections[$chatId] as $conn) {
            $conn->send(json_encode([
                'type' => 'deleteMessage',
                'message_id' => $messageId
            ]));
        }
    }
//    {
//        $connection->send(json_encode(['status' => 'error', 'message' => 'chat_id не найден']));
//    }
};

// Событие закрытия соединения
$ws_worker->onClose = function($connection) {
    echo "Соединение закрыто\n";
};

// Запуск сервера
Worker::runAll();
