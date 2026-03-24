<?php

namespace App\Contracts;

use App\Models\Ad;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AdRepositoryInterface
{
    public function create(array $data): Ad;
    public function find($id): Ad;
    public function findWithRelations($id, array $relations): Ad;
    public function getFilteredAds(array $filters): LengthAwarePaginator;
    public function update($id, array $data): bool;
    public function delete($id): bool;
    public function renew($id): Ad;
}