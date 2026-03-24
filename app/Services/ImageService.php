<?php

namespace App\Services;

use Intervention\Image\Laravel\Facades\Image;
use Illuminate\Support\Facades\Storage;

class ImageService
{
    /**
     * Upload and resize an image.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $path
     * @param int $width
     * @return string
     */
    public static function uploadAndResize($file, $path, $width = 800)
    {
        // Load the image
        $image = Image::read($file);

        // Resize maintaining aspect ratio
        $image->scale(width: $width);

        if (config('images.watermark_enabled', false)) {
            $type = config('images.watermark_type', 'text');
            $position = config('images.watermark_position', 'center'); // e.g., 'center', 'bottom-right'
            $opacity = config('images.watermark_opacity', 0.5);

            if ($type === 'text') {
                $text = config('images.watermark_text', 'Haraj-Maareb');
                $fontSize = config('images.watermark_font_size', 24);
                $colorHex = config('images.watermark_color', '#FFFFFF');

                // Determine position coordinates
                $x = $image->width() / 2;
                $y = $image->height() / 2;
                $align = 'center';
                $valign = 'middle';

                if ($position === 'bottom-right') {
                    $x = $image->width() - 20;
                    $y = $image->height() - 20;
                    $align = 'right';
                    $valign = 'bottom';
                }

                // Handle hex to rgba for opacity (Intervention Image v3 supports rgba string notation)
                $colorHex = ltrim($colorHex, '#');
                if (strlen($colorHex) == 6) {
                    list($r, $g, $b) = sscanf($colorHex, "%02x%02x%02x");
                    $color = "rgba($r, $g, $b, {$opacity})";
                } else {
                    $color = "rgba(255, 255, 255, {$opacity})"; // fallback
                }

                $image->text($text, intval($x), intval($y), function ($font) use ($fontSize, $color, $align, $valign) {
                    // Optional: set a standard font file if available inside public/fonts/
                    // $font->filename(public_path('fonts/arial.ttf'));
                    $font->color($color);
                    $font->size($fontSize);
                    $font->align($align);
                    $font->valign($valign);
                });
            } elseif ($type === 'image') {
                /*
                 * FUTURE PROOFING: Image Watermark (Logo)
                 * To switch to a Logo, change the 'watermark_type' config to 'image'
                 * and provide the logo path below.
                 *
                 * $logoPath = public_path('images/logo.png');
                 * if (file_exists($logoPath)) {
                 *     // In Intervention Image V3, add the logo watermark
                 *     $logo = Image::read($logoPath);
                 *     // Note: if logo opacity modification is needed natively
                 *     $image->place($logo, $position, 10, 10);
                 * }
                 */
            }
        }

        // Encode to JPG with 75% quality
        $encoded = $image->toJpeg(75);

        // Generate unique filename
        $filename = time() . '_' . uniqid() . '.jpg';

        // Save to storage
        Storage::disk('public')->put($path . '/' . $filename, $encoded);

        return $filename;
    }
}