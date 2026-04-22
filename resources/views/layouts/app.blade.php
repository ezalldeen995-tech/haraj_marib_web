<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'حراج مأرب')</title>

    <!-- Bootstrap 5 RTL CDN -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!-- Custom Styles -->
    <link rel="stylesheet" href="{{ asset('web/css/style.css') }}">
    
    @stack('styles')
</head>
<body>

    <!-- NAVBAR -->
    <nav class="navbar navbar-expand-lg">
        <div class="container">
            <a class="navbar-brand" href="/web/index.html">
                <i class="bi bi-shop"></i> حراج مأرب
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="mainNav">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link" href="/web/index.html">الرئيسية</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/web/ads.html">الإعلانات</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="/web/auctions.html">المزادات</a>
                    </li>
                </ul>
                <div id="navAuthArea">
                    <!-- This will be handled by client-side JS if needed, 
                         but for Blade pages we might want static links -->
                    <a href="/web/post-ad.html" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-circle me-1"></i> أضف إعلان
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <main>
        @yield('content')
    </main>

    <footer class="py-4 bg-dark text-white mt-5">
        <div class="container text-center">
            <p class="mb-0">&copy; {{ date('Y') }} حراج مأرب. جميع الحقوق محفوظة.</p>
        </div>
    </footer>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    
    @stack('scripts')
</body>
</html>
