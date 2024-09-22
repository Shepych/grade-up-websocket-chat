<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory;

    protected $guarded = [];
    protected $hidden = [];

    public function messages() {
        return $this->hasMany(Message::class);
    }

    public function lastMessage()
    {
        return Message::where('chat_id', $this->id)
            ->latest('id')
            ->first();
    }
}
