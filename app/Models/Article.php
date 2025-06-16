<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @OA\Schema(
 *     schema="Article",
 *     type="object",
 *     title="Article Model",
 *     required={"title", "category", "content", "user_id"},
 *     @OA\Property(property="idarticles", type="integer", format="int64", description="Article ID", readOnly=true),
 *     @OA\Property(property="title", type="string", description="Title of the article", example="My Awesome Article"),
 *     @OA\Property(property="category", type="string", description="Category of the article", example="Technology"),
 *     @OA\Property(property="content", type="string", description="Content of the article", example="This is the detailed content..."),
 *     @OA\Property(property="link_picture", type="string", nullable=true, description="Link to article picture", example="http://example.com/image.jpg"),
 *     @OA\Property(property="user_id", type="string", format="uuid", description="Author's User ID", readOnly=true),
 *     @OA\Property(property="status", type="string", enum={"draft", "published", "archived"}, default="draft", description="Status of the article", example="published"),
 *     @OA\Property(property="created_at", type="string", format="date-time", description="Creation timestamp", readOnly=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", description="Last update timestamp", readOnly=true)
 * )
 */

class Article extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'articles';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'idarticles';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'category',
        'content',
        'user_id',
        'link_picture', // Added link_picture
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            // Add casts here if needed, e.g., for status if using enums
        ];
    }

    /**
     * Get the user (author) that owns the article.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'iduser');
    }
}
