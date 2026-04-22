@extends('layouts.app')

@section('title', $auction->ad->title . ' - مزاد حراج مأرب')

@push('styles')
<style>
    :root {
        --premium-navy: #1e1b4b;
        --premium-gold: #f59e0b;
        --premium-gold-glow: rgba(245, 158, 11, 0.3);
    }

    .auction-container {
        background: white;
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid rgba(0,0,0,0.05);
        box-shadow: 0 10px 40px rgba(0,0,0,0.04);
    }

    .auction-image-side {
        position: relative;
        overflow: hidden;
        background: #f8fafc;
    }

    .auction-image-side img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        min-height: 400px;
    }

    .auction-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        background: var(--premium-gold);
        color: white;
        padding: 5px 15px;
        border-radius: 50px;
        font-weight: 700;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px var(--premium-gold-glow);
        z-index: 10;
        animation: pulse-gold 2s infinite;
    }

    @keyframes pulse-gold {
        0% { transform: scale(1); box-shadow: 0 4px 12px var(--premium-gold-glow); }
        50% { transform: scale(1.05); box-shadow: 0 4px 20px var(--premium-gold-glow); }
        100% { transform: scale(1); box-shadow: 0 4px 12px var(--premium-gold-glow); }
    }

    .auction-details-side {
        background: #fdfdfd;
        border-right: 1px solid rgba(0,0,0,0.03);
    }

    .price-card {
        background: #f8fafc;
        border-radius: 20px;
        padding: 24px;
        border: 1px solid rgba(0,0,0,0.02);
    }

    .timer-card {
        background: #fff1f2;
        color: #e11d48;
        border-radius: 12px;
        padding: 8px 16px;
        font-weight: 800;
        font-family: 'Courier New', Courier, monospace;
        letter-spacing: 1px;
    }

    .bid-input-group .form-control {
        border-radius: 12px 0 0 12px !important;
        border: 2px solid #e2e8f0;
        padding: 12px 20px;
        font-size: 1.2rem;
        font-weight: 700;
    }

    .bid-input-group .btn-bid {
        border-radius: 0 12px 12px 0 !important;
        background: var(--premium-navy);
        color: white;
        padding: 0 30px;
        font-weight: 700;
    }

    .bid-history-item {
        transition: all 0.3s ease;
        border-bottom: 1px solid #f1f5f9;
    }

    .bid-history-item:hover {
        background: #f8fafc;
    }

    .bid-history-item.highest {
        background: #ecfdf5;
        border-right: 4px solid #10b981;
    }
</style>
@endpush

@section('content')
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-lg-11">
            
            <div class="auction-container row g-0">
                <!-- Image Side -->
                <div class="col-md-6 auction-image-side">
                    <span class="auction-badge">
                        <i class="bi bi-broadcast me-1"></i> مزاد مباشر
                    </span>
                    @if($auction->ad->images->count() > 0)
                        <img src="{{ asset('storage/' . $auction->ad->images->first()->image_path) }}" alt="{{ $auction->ad->title }}">
                    @else
                        <div class="d-flex align-items-center justify-content-center h-100 text-muted bg-light">
                            <i class="bi bi-image fs-1 opacity-25"></i>
                        </div>
                    @endif
                </div>

                <!-- Details Side -->
                <div class="col-md-6 p-4 p-lg-5 auction-details-side">
                    <div id="auction-container" data-auction-id="{{ $auction->id }}" data-end-time="{{ $auction->end_time->toIso8601String() }}">
                        
                        <nav aria-label="breadcrumb" class="mb-3">
                            <ol class="breadcrumb" style="font-size: 0.85rem;">
                                <li class="breadcrumb-item"><a href="/web/index.html">الرئيسية</a></li>
                                <li class="breadcrumb-item"><a href="/web/auctions.html">المزادات</a></li>
                                <li class="breadcrumb-item active">{{ $auction->ad->category->name_ar ?? 'عام' }}</li>
                            </ol>
                        </nav>

                        <h1 class="h3 fw-bold mb-2">{{ $auction->ad->title }}</h1>
                        <p class="text-muted mb-4" style="font-size: 0.95rem;">{{ $auction->ad->description }}</p>

                        <div class="d-flex gap-4 mb-4 text-muted small border-bottom pb-4">
                            <span><i class="bi bi-person me-1"></i> المعلن: <strong>{{ $auction->ad->user->name ?? 'مستخدم' }}</strong></span>
                            <span><i class="bi bi-geo-alt me-1"></i> الموقع: <strong>{{ $auction->ad->address_text ?? 'مأرب' }}</strong></span>
                        </div>

                        <!-- Price & Timer -->
                        <div class="price-card mb-4 shadow-sm border">
                            <div class="row align-items-center">
                                <div class="col-7">
                                    <span class="text-uppercase text-muted fw-bold small d-block mb-1">أعلى مزايدة حالية</span>
                                    <div class="h2 fw-bolder text-primary mb-0">
                                        <span id="current-price">{{ number_format($auction->current_price) }}</span>
                                        <small class="fs-6">ر.ي</small>
                                    </div>
                                </div>
                                <div class="col-5 text-start">
                                    <span class="text-muted small d-block mb-2">الوقت المتبقي</span>
                                    <div id="countdown-timer" class="timer-card d-inline-block text-ltr">
                                        --:--:--
                                    </div>
                                </div>
                            </div>
                        </div>

                        @if($auction->status === 'active')
                        <!-- Bidding Form -->
                        <div class="card border-0 shadow-sm rounded-4 mb-4">
                            <div class="card-body p-4">
                                <h6 class="fw-bold mb-3"><i class="bi bi-hammer me-1 text-primary"></i> قدم عرضك الآن</h6>
                                <form id="bid-form">
                                    <div class="input-group bid-input-group mb-3">
                                        @php
                                            $minBid = collect([$auction->current_price + $auction->min_bid_step, $auction->start_price])->max();
                                        @endphp
                                        <input type="number" id="bid-amount" class="form-control" 
                                            min="{{ $minBid }}" 
                                            step="{{ $auction->min_bid_step }}" 
                                            placeholder="أقل مبلغ: {{ $minBid }}" required>
                                        <button class="btn btn-bid" type="submit">مزايدة</button>
                                    </div>

                                    <div class="form-check form-switch mt-3">
                                        <input class="form-check-input" type="checkbox" id="is-proxy" role="switch">
                                        <label class="form-check-label text-muted small" for="is-proxy">تفعيل المزايدة التلقائية (Proxy Bid)</label>
                                    </div>
                                    <div id="proxy-max-group" class="mt-3 animate__animated animate__fadeIn" style="display: none;">
                                        <label class="form-label small fw-bold">أقصى مبلغ للمزايدة التلقائية</label>
                                        <input type="number" id="max-proxy-amount" class="form-control form-control-sm border-dashed" placeholder="أدخل الحد الأقصى">
                                    </div>

                                    <div id="bid-error" class="mt-3 small"></div>
                                </form>
                            </div>
                        </div>
                        @else
                        <div class="alert alert-danger border-0 rounded-4 p-4 text-center mb-4">
                            <h5 class="fw-bold mb-1"><i class="bi bi-lock-fill me-1"></i> انتهى المزاد</h5>
                            @if($auction->winner_user_id)
                                <p class="mb-0">مبروك للفائز! تم إغلاق المزاد وتوليد طلب شراء.</p>
                            @else
                                <p class="mb-0">انتهى الوقت دون وصول عرض مناسب.</p>
                            @endif
                        </div>
                        @endif

                        <!-- Bid History -->
                        <div class="card border-0 shadow-sm rounded-4">
                            <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 fw-bold">سجل المزايدات</h6>
                                <span class="badge bg-light text-dark rounded-pill border">{{ $auction->bids->count() }} مزايدة</span>
                            </div>
                            <div class="card-body p-0" style="max-height: 250px; overflow-y: auto;">
                                <table class="table table-hover mb-0 fw-bold" style="font-size: 0.9rem;">
                                    <tbody id="bid-history">
                                        @forelse($auction->bids->sortByDesc('amount') as $index => $bid)
                                        <tr class="bid-history-item {{ $index === 0 && $auction->status === 'active' ? 'highest' : '' }}">
                                            <td class="py-3 px-4 border-0">
                                                <i class="bi bi-person-circle me-2 text-muted"></i>{{ $bid->user->name ?? 'مجهول' }}
                                            </td>
                                            <td class="py-3 px-4 border-0 text-primary">{{ number_format($bid->amount) }} ر.ي</td>
                                            <td class="py-3 px-4 border-0 text-muted small text-start">{{ $bid->created_at->diffForHumans() }}</td>
                                        </tr>
                                        @empty
                                        <tr>
                                            <td colspan="3" class="text-center py-5 text-muted italic">كن أول من يزايد على هذا المنتج!</td>
                                        </tr>
                                        @endforelse
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    // Ensure the countdown and bid logic is initialized
    // Assuming you have an logic in asset('web/js/auction.js')
</script>
<script src="{{ asset('web/js/auction.js') }}"></script>
@endpush
