<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @OA\Schema(
 *     schema="User",
 *     type="object",
 *     title="User Model",
 *     required={"fullname", "email", "datebirthday", "gender", "role"},
 *     @OA\Property(property="iduser", type="string", format="uuid", description="User ID", readOnly=true),
 *     @OA\Property(property="fullname", type="string", description="Full name of the user", example="John Doe"),
 *     @OA\Property(property="email", type="string", format="email", description="Email of the user", example="john.doe@example.com"),
 *     @OA\Property(property="datebirthday", type="string", format="date", description="Birth date of the user", example="1990-01-01"),
 *     @OA\Property(property="gender", type="string", description="Gender of the user", example="male"),
 *     @OA\Property(property="linkphoto", type="string", nullable=true, description="Link to user's photo", example="http://example.com/photo.jpg"),
 *     @OA\Property(property="role", type="string", description="Role of the user", example="user"),
 *     @OA\Property(property="email_verified_at", type="string", format="date-time", description="Email verification timestamp", readOnly=true, nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time", description="Creation timestamp", readOnly=true),
 *     @OA\Property(property="updated_at", type="string", format="date-time", description="Last update timestamp", readOnly=true)
 * )
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids;

/**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'users';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'iduser';

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'fullname',
        'email',
        'datebirthday',
        'gender', // Assuming you want to keep gender
        'linkphoto', // Added linkphoto as it's used in AuthController and migration
        'role',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'datebirthday' => 'date',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the columns that should receive a unique identifier.
     *
     * @return array<int, string>
     */
    public function uniqueIds(): array
    {
        return ['iduser'];
    }

    /**
     * Get the articles for the user.
     */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'user_id', 'iduser');
    }
}
