<?php

namespace App\Http\Controllers;



use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function create(Request $request)
    {
        return Chat::create([
            'user_id' => Auth::id(),
            'address_id' => $request->user,
            'viewed' => 1
        ]);
    }

    public function getChats(Request $request) : Collection
    {
        $chats = Chat::where('user_id', Auth::id())
            ->orWhere('address_id', Auth::id())
            ->get();

        foreach ($chats as &$chat) {
            if($chat->lastMessage() && $chat->lastMessage()->user_id == Auth::id()) $chat->viewed = 1;
//            if($chat->lastMessage()->user_id == Auth::id()) $chat->viewed = 1;
        }
        return $chats;
    }

    public function getMessages($chatId)
    {
        $chat = Chat::find($chatId);
        $chat->viewed = true;
        $chat->update();

        return [
            'messages' => $chat->messages,
            'user_id' => Auth::id()
        ];
    }

    public function sendMessage(Request $request, $chatId)
    {
        $chat = Chat::find($chatId);
        $chat->viewed = false;
        $chat->update();

        $message = Message::create([
            'user_id' => Auth::id(),
            'chat_id' => $chat->id,
            'content' => $request->content
        ]);
        return [
            'user_id' => Auth::id(),
            'chat_id' => $chat->id,
            'content' => $request->content,
            'address_id' => $chat->address_id == Auth::id() ? $chat->user_id : $chat->address_id,
            'id' => $message->id,
        ];
    }

    public function getUser()
    {
        return Auth::user();
    }

    public function getUsersList()
    {
        return User::where('id', '!=', Auth::id())->get();
    }

    public function deleteMessage($messageId)
    {
        Message::find($messageId)->delete();
    }
}
