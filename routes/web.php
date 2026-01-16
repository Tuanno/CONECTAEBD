<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\UserController;
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

Route::get('/edit-user/{id}', function ($id) {
    return Inertia::render('EditUser', ['id' => $id]);
})->middleware(['auth', 'verified'])->name('edit-user');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Rotas para buscar alunos por classe
    Route::get('/api/students/{classGroup}', [StudentController::class, 'getStudentsByClass']);
    Route::get('/api/students', [StudentController::class, 'getAllStudents']);
    
    // Rotas para frequência
    Route::post('/api/attendances', [AttendanceController::class, 'store']);
    Route::get('/api/attendances/{classGroup}/{date}', [AttendanceController::class, 'getByDateAndClass']);
    Route::delete('/api/attendances/{id}', [AttendanceController::class, 'destroy']);
    
    // Rotas para usuários (editar e deletar)
    Route::get('/api/users/{id}', [UserController::class, 'edit']);
    Route::put('/api/users/{id}', [UserController::class, 'update']);
    Route::delete('/api/users/{id}', [UserController::class, 'destroy']);
});

require __DIR__.'/auth.php';
