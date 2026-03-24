<?php

namespace App\Services;

use Google\Cloud\Vision\V1\Client\ImageAnnotatorClient;
use Google\Cloud\Vision\V1\Likelihood;

class ImageModerationService
{
    protected ?ImageAnnotatorClient $client = null;

    /**
     * Create a new ImageModerationService instance.
     */
    public function __construct()
    {
        $credentialsPath = base_path(env('GOOGLE_CLOUD_CREDENTIALS'));

        if (!file_exists($credentialsPath)) {
            // Missing credentials, service will fail-open and skip API calls
            return;
        }

        try {
            $this->client = new ImageAnnotatorClient([
                'credentials' => $credentialsPath,
            ]);
        } catch (\Exception $e) {
            report($e);
        }
    }

    /**
     * Analyze an image for unsafe content using Google Cloud Vision SafeSearch.
     *
     * @param string $imagePath Absolute path to the image file.
     * @return bool True if safe.
     * @throws \Exception If unsafe.
     */
    public function analyze(string $imagePath): bool
    {
        if (!$this->client) {
            return true; // Fail-open: allow if service is unconfigured
        }

        try {
            $imageContent = file_get_contents($imagePath);

            $image = new \Google\Cloud\Vision\V1\Image();
            $image->setContent($imageContent);

            $feature = new \Google\Cloud\Vision\V1\Feature();
            $feature->setType(\Google\Cloud\Vision\V1\Feature\Type::SAFE_SEARCH_DETECTION);

            $request = new \Google\Cloud\Vision\V1\AnnotateImageRequest();
            $request->setImage($image);
            $request->setFeatures([$feature]);

            $batchRequest = new \Google\Cloud\Vision\V1\BatchAnnotateImagesRequest();
            $batchRequest->setRequests([$request]);

            $response = $this->client->batchAnnotateImages($batchRequest);
            $responses = $response->getResponses();
            $safeSearch = $responses[0]->getSafeSearchAnnotation();

            if (!$safeSearch) {
                // No annotation returned — fail-open
                return true;
            }

            $thresholds = [
                Likelihood::LIKELY,
                Likelihood::VERY_LIKELY,
            ];

            $adult    = $safeSearch->getAdult();
            $violence = $safeSearch->getViolence();
            $racy     = $safeSearch->getRacy();

            if (in_array($adult, $thresholds) || in_array($violence, $thresholds) || in_array($racy, $thresholds)) {
                throw new \Exception('Unsafe image detected');
            }

            return true;
        } catch (\Exception $e) {
            // Rethrow our specific exception
            if ($e->getMessage() === 'Unsafe image detected') {
                throw $e;
            }
            
            // Fail-open: allow the image if the API is unreachable
            report($e);

            return true;
        }
    }
}
