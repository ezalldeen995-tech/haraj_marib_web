<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('web/index.html');
});

Route::get('/admin', function () {
    return redirect('/admin/index.html');
});
