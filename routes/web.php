<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth'])->post('/chats/create', [ChatController::class, 'create'])->name('chats.create');
Route::middleware(['auth'])->get('/chats/get', [ChatController::class, 'getChats'])->name('chats.get');
Route::middleware(['auth'])->get('/chats/{id}/messages', [ChatController::class, 'getMessages'])->name('chats.get');
Route::middleware(['auth'])->post('/chats/{id}/send_message', [ChatController::class, 'sendMessage'])->name('chats.send_message');
Route::middleware(['auth'])->get('/user', [ChatController::class, 'getUser'])->name('user.info');
Route::middleware(['auth'])->get('/users/list', [ChatController::class, 'getUsersList'])->name('users.list');
Route::middleware(['auth'])->get('/message/delete/{id}', [ChatController::class, 'deleteMessage'])->name('chats.message.delete');

require __DIR__.'/auth.php';
