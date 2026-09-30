<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AnnualNotebookController;
use App\Models\Notebook;
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

Route::get('/annual-notebook/create', function () {
    $user = auth()->user();
    abort_unless($user && in_array($user->user_role, ['professor', 'secretaria']), 403);

    return Inertia::render('AnnualNotebookCreate');
})->middleware(['auth', 'verified'])->name('annual-notebook.create');

Route::get('/annual-notebook/{id}/edit', function ($id) {
    $user = auth()->user();
    abort_unless($user && in_array($user->user_role, ['professor', 'secretaria']), 403);
    return Inertia::render('AnnualNotebookEdit', ['id' => $id]);
})->middleware(['auth', 'verified'])->name('annual-notebook.edit');

Route::get('/annual-notebook/edit', function () {
    $user = auth()->user();
    abort_unless($user && in_array($user->user_role, ['professor', 'secretaria']), 403);
    $notebook = Notebook::latest('id')->firstOrFail();
    return redirect()->route('annual-notebook.edit', ['id' => $notebook->id]);
})->middleware(['auth', 'verified'])->name('annual-notebook.edit-latest');

Route::get('/annual-notebook/overview', function () {
    $user = auth()->user();
    abort_unless($user && in_array($user->user_role, ['professor', 'secretaria']), 403);
    return Inertia::render('AnnualNotebookOverview');
})->middleware(['auth', 'verified'])->name('annual-notebook.overview-latest');

Route::get('/annual-notebook/{id}/overview', function ($id) {
    $user = auth()->user();
    abort_unless($user && in_array($user->user_role, ['professor', 'secretaria']), 403);
    return Inertia::render('AnnualNotebookOverview', ['id' => $id]);
})->middleware(['auth', 'verified'])->name('annual-notebook.overview');

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
    Route::patch('/api/group-users/{groupUser}/enrollment', [StudentController::class, 'updateEnrollment']);
    Route::get('/api/annual-notebook/options', [AnnualNotebookController::class, 'options']);
    Route::get('/api/annual-notebooks', [AnnualNotebookController::class, 'index']);
    Route::post('/api/annual-notebooks', [AnnualNotebookController::class, 'store']);
    Route::get('/api/annual-notebooks/{id}', [AnnualNotebookController::class, 'show']);
    Route::get('/api/annual-notebooks/{id}/overview', [AnnualNotebookController::class, 'overview']);
    Route::put('/api/annual-notebooks/{id}', [AnnualNotebookController::class, 'update']);
    
    // Rotas para frequência
    Route::post('/api/attendances', [AttendanceController::class, 'store']);
    Route::get('/api/attendances/{classGroup}/{date}', [AttendanceController::class, 'getByDateAndClass']);
    Route::delete('/api/attendances/{id}', [AttendanceController::class, 'destroy']);
    
    // Rota para relatório de frequência
    Route::get('/api/attendance-report', [AttendanceController::class, 'generateReport']);
    Route::get('/attendance-report', function () {
        $user = auth()->user();
        abort_unless($user && in_array($user->user_role, ['professor', 'secretaria']), 403);

        return Inertia::render('AttendanceReport');
    })->name('attendance-report');
    
    // Rota para histórico de frequência
    Route::get('/api/attendance-history', [AttendanceController::class, 'getStudentHistory']);
    Route::get('/attendance-history', function () {
        return Inertia::render('AttendanceHistory');
    })->name('attendance-history');
    
    // Rotas para usuários (editar e deletar)
    Route::get('/api/users/{id}', [UserController::class, 'edit']);
    Route::put('/api/users/{id}', [UserController::class, 'update']);
    Route::delete('/api/users/{id}', [UserController::class, 'destroy']);
});

require __DIR__.'/auth.php';
